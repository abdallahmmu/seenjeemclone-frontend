import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../models/api.model';
import {
  AcceptInviteRequest,
  AuthResponse,
  GoogleLoginRequest,
  HandleAvailabilityResponse,
  LoginRequest,
  MeResponse,
  RefreshResponse,
  RegisterRequest,
  UpdateProfileRequest,
  User,
  VerifyEmailResponse,
} from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly initializedSignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly initialized = this.initializedSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isAdmin = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  });
  readonly isSuperAdmin = computed(() => this.currentUserSignal()?.role === 'SUPER_ADMIN');

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiEnvelope<AuthResponse>>(`${environment.apiUrl}/auth/login`, request, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        tap((res) => this.setSession(res)),
      );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiEnvelope<AuthResponse>>(`${environment.apiUrl}/auth/register`, request, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        tap((res) => this.setSession(res)),
      );
  }

  /** Completes an admin invite: sets the real password and logs the account in. */
  acceptInvite(request: AcceptInviteRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiEnvelope<AuthResponse>>(`${environment.apiUrl}/auth/accept-invite`, request, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.data),
        tap((res) => this.setSession(res)),
      );
  }

  /** Signs in (or creates, or links) an account via a Google Identity Services ID token. Same session shape as login/register. */
  loginWithGoogle(request: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiEnvelope<AuthResponse>>(`${environment.apiUrl}/auth/google`, request, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        tap((res) => this.setSession(res)),
      );
  }

  /**
   * Confirms an emailed verification link. Doesn't change login state on
   * its own (the browser that clicks the link may not be signed in as this
   * user at all) — if the caller happens to already be `currentUser`, the
   * emailVerified flag is patched in-place so the UI (e.g. the
   * start-a-game banner) updates immediately without a full getMe() round trip.
   */
  verifyEmail(token: string): Observable<User> {
    return this.http.post<ApiEnvelope<VerifyEmailResponse>>(`${environment.apiUrl}/auth/verify-email`, { token }).pipe(
      map((res) => res.data.user),
      tap((user) => {
        if (this.currentUserSignal()?.id === user.id) {
          this.currentUserSignal.set(user);
        }
      }),
    );
  }

  /** Re-sends the verification email for the currently logged-in user. */
  resendVerificationEmail(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/resend-verification`, {});
  }

  /** Updates the caller's own profile fields and refreshes `currentUser` on success. */
  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.patch<ApiEnvelope<{ user: User }>>(`${environment.apiUrl}/profile`, request).pipe(
      map((res) => res.data.user),
      tap((user) => this.currentUserSignal.set(user)),
    );
  }

  /** Uploads a new avatar for the caller's own account and refreshes `currentUser` on success. */
  uploadAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<ApiEnvelope<{ user: User }>>(`${environment.apiUrl}/profile/avatar`, formData).pipe(
      map((res) => res.data.user),
      tap((user) => this.currentUserSignal.set(user)),
    );
  }

  /** Live handle-uniqueness check for the register/profile-settings forms. */
  checkHandleAvailability(handle: string): Observable<boolean> {
    return this.http
      .get<ApiEnvelope<HandleAvailabilityResponse>>(`${environment.apiUrl}/profile/handle-availability`, {
        params: { handle },
      })
      .pipe(map((res) => res.data.available));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this.clearSession()),
        catchError(() => {
          this.clearSession();
          return of(void 0);
        }),
      );
  }

  /** Exchanges the httpOnly refresh cookie for a new access token. Does not touch `currentUser`. */
  refresh(): Observable<RefreshResponse> {
    return this.http
      .post<ApiEnvelope<RefreshResponse>>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        tap((res) => this.tokenStorage.setAccessToken(res.accessToken)),
      );
  }

  /** Fetches the caller's own user record for the current access token and updates `currentUser`. */
  getMe(): Observable<User> {
    return this.http.get<ApiEnvelope<MeResponse>>(`${environment.apiUrl}/auth/me`).pipe(
      map((res) => res.data.user),
      tap((user) => this.currentUserSignal.set(user)),
    );
  }

  /**
   * Called once at app bootstrap to restore a session from the refresh cookie.
   * A page reload starts with an empty `TokenStorageService` (in-memory only,
   * see its own doc comment) and no `currentUser`, so this rebuilds both: the
   * refresh cookie yields a fresh access token, then `/auth/me` yields the
   * user record (email included — it isn't in the JWT) that the access token
   * alone can't provide.
   */
  tryRestoreSession(): Observable<boolean> {
    return this.refresh().pipe(
      switchMap(() => this.getMe()),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
      tap(() => this.initializedSignal.set(true)),
    );
  }

  /** Clears local session state without hitting the network (used after a failed refresh). */
  forceLogout(): void {
    this.clearSession();
  }

  /**
   * Patches `currentUser` directly from a response that already carries the
   * fresh user (e.g. redeeming a promo code) — avoids an extra getMe() round
   * trip for the common case where the mutating endpoint already returns
   * the updated record.
   */
  setCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
  }

  private setSession(res: AuthResponse): void {
    this.tokenStorage.setAccessToken(res.accessToken);
    this.currentUserSignal.set(res.user);
  }

  private clearSession(): void {
    this.tokenStorage.clear();
    this.currentUserSignal.set(null);
  }
}

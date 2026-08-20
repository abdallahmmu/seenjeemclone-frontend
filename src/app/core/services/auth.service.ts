import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../models/api.model';
import {
  AcceptInviteRequest,
  AuthResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  User,
  UserRole,
} from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

function base64UrlDecode(input: string): string {
  const padded = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
  return atob(padded);
}

/**
 * Best-effort claims read from an access token. The backend has no `/auth/me` endpoint,
 * so restoring a session after a page reload (via the httpOnly refresh cookie, which only
 * returns a new access token) has nothing else to rebuild `currentUser` from. `email` is
 * not in the token and stays blank until the next real login.
 */
function decodeAccessTokenClaims(token: string): { sub: string; role: UserRole } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { sub?: unknown; role?: unknown };
    if (typeof payload.sub === 'string' && typeof payload.role === 'string') {
      return { sub: payload.sub, role: payload.role as UserRole };
    }
    return null;
  } catch {
    return null;
  }
}

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

  /** Silent refresh using the httpOnly cookie; never throws. */
  refresh(): Observable<RefreshResponse> {
    return this.http
      .post<ApiEnvelope<RefreshResponse>>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        tap((res) => this.setSessionFromToken(res.accessToken)),
      );
  }

  /** Called once at app bootstrap to restore a session from the refresh cookie. */
  tryRestoreSession(): Observable<boolean> {
    return this.refresh().pipe(
      map(() => true),
      catchError(() => of(false)),
      tap(() => this.initializedSignal.set(true)),
    );
  }

  /** Clears local session state without hitting the network (used after a failed refresh). */
  forceLogout(): void {
    this.clearSession();
  }

  private setSession(res: AuthResponse): void {
    this.tokenStorage.setAccessToken(res.accessToken);
    this.currentUserSignal.set(res.user);
  }

  private setSessionFromToken(accessToken: string): void {
    this.tokenStorage.setAccessToken(accessToken);
    const claims = decodeAccessTokenClaims(accessToken);
    if (claims) {
      this.currentUserSignal.set({ id: claims.sub, email: '', role: claims.role, isActive: true });
    }
  }

  private clearSession(): void {
    this.tokenStorage.clear();
    this.currentUserSignal.set(null);
  }
}

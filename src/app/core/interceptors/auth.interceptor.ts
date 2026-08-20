import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/accept-invite'];

/** Attaches the in-memory access token and retries once via silent refresh on 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  const isExempt = AUTH_EXEMPT_PATHS.some((path) => req.url.includes(path));
  const accessToken = tokenStorage.accessToken;

  const authReq =
    accessToken && !isExempt ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isExempt) {
        return authService.refresh().pipe(
          switchMap((res) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } })),
          ),
          catchError((refreshError) => {
            authService.forceLogout();
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};

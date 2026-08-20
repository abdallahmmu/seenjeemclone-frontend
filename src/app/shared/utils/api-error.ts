import { HttpErrorResponse } from '@angular/common/http';

/** The backend's error responses are always `{ error: string }`. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: string } | null;
    if (body && typeof body.error === 'string' && body.error.length > 0) {
      return body.error;
    }
  }
  return fallback;
}

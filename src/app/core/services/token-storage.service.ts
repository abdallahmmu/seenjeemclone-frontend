import { Injectable, signal } from '@angular/core';

/**
 * Access token lives in memory only for the lifetime of the tab.
 * The refresh token is an httpOnly cookie set by the backend and is
 * never touched from client code.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly accessTokenSignal = signal<string | null>(null);

  get accessToken(): string | null {
    return this.accessTokenSignal();
  }

  setAccessToken(token: string | null): void {
    this.accessTokenSignal.set(token);
  }

  clear(): void {
    this.accessTokenSignal.set(null);
  }
}

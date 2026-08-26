export type UserRole = 'PLAYER' | 'ADMIN' | 'SUPER_ADMIN';

/** The backend never has a display name — only id/email/role/isActive/emailVerified. */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  /** True immediately for a Google sign-in; false for a fresh /auth/register account until the emailed link is clicked. */
  emailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

/** POST /auth/refresh only returns a new access token, never the user. */
export interface RefreshResponse {
  accessToken: string;
}

/** GET /auth/me returns the caller's own user record for the given access token. */
export interface MeResponse {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

/** POST /auth/verify-email returns the (now-verified) user record — no tokens, this doesn't change login state. */
export interface VerifyEmailResponse {
  user: User;
}

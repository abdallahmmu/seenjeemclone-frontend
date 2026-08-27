export type UserRole = 'PLAYER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  /** True immediately for a Google sign-in; false for a fresh /auth/register account until the emailed link is clicked. */
  emailVerified: boolean;
  /** Public display identity shown wherever the raw email used to be — chosen at registration, changeable via PATCH /profile. */
  handle: string;
  /** Null until an avatar is uploaded (or, for Google sign-in, seeded from the account's Google photo) — UI falls back to handle-initials. */
  avatarUrl: string | null;
  bio: string | null;
  mobile: string | null;
  /** Wallet balance spent on starting a game session — 0 sends the player to /shop instead of a fresh game. */
  credits: number;
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
  handle: string;
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

/** PATCH /profile — every field optional, omitted fields stay unchanged. "" clears bio/mobile; handle can never be cleared. */
export interface UpdateProfileRequest {
  handle?: string;
  bio?: string;
  mobile?: string;
}

export interface HandleAvailabilityResponse {
  available: boolean;
}

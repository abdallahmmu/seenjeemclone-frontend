export type UserRole = 'PLAYER' | 'ADMIN' | 'SUPER_ADMIN';

/** The backend never has a display name — only id/email/role/isActive. */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

/** POST /auth/refresh only returns a new access token, never the user. */
export interface RefreshResponse {
  accessToken: string;
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

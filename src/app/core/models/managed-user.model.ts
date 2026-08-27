import { UserRole } from './user.model';

/** GET /admin/users row — every role (including PLAYER), unlike AdminUser (admin.model.ts) which is scoped to ADMIN/SUPER_ADMIN accounts only. */
export interface ManagedUser {
  id: string;
  email: string;
  handle: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  credits: number;
  avatarUrl: string | null;
  bio: string | null;
  mobile: string | null;
  createdAt: string;
}

export interface ListUsersFilter {
  search?: string;
  role?: UserRole;
  limit: number;
  offset: number;
}

/** PATCH /admin/users/:id — every field optional, omitted fields stay unchanged. */
export interface UpdateUserRequest {
  handle?: string;
  email?: string;
  bio?: string;
  mobile?: string;
}

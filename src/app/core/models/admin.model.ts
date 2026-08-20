import { UserRole } from './user.model';

export interface AdminStats {
  totalQuestions: number;
  categoryPacks: { total: number; active: number; inactive: number };
  totalCategoryGroups: number;
  gamesPlayed: number;
  activeUsers: number;
}

/** The backend calls this domain "admins" (super-admin-managed accounts), not "team". */
export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface InviteAdminRequest {
  email: string;
  role?: 'ADMIN' | 'SUPER_ADMIN';
}

export interface AuditLogActor {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actor: AuditLogActor;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilter {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  limit: number;
  offset: number;
}

export interface AppSettings {
  id: string;
  featureFlags: Record<string, boolean>;
  lifelineConfig: { trapEnabled: boolean; holeEnabled: boolean; doubleAnswerEnabled: boolean };
  difficultyWeighting: { easy: number; medium: number; hard: number };
  updatedAt: string;
  updatedBy: string | null;
}

export type UpdateSettingsRequest = Partial<
  Pick<AppSettings, 'featureFlags' | 'lifelineConfig' | 'difficultyWeighting'>
>;

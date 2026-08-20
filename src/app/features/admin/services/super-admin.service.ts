import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope, ApiListEnvelope } from '../../../core/models/api.model';
import {
  AdminUser,
  AppSettings,
  AuditLogEntry,
  AuditLogFilter,
  InviteAdminRequest,
  UpdateSettingsRequest,
} from '../../../core/models/admin.model';
import { UserRole } from '../../../core/models/user.model';

export interface PagedResult<T> {
  items: T[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAdmins(): Observable<AdminUser[]> {
    return this.http.get<ApiEnvelope<AdminUser[]>>(`${this.base}/super-admin/admins`).pipe(map((res) => res.data));
  }

  inviteAdmin(payload: InviteAdminRequest): Observable<AdminUser> {
    return this.http
      .post<ApiEnvelope<AdminUser>>(`${this.base}/super-admin/admins`, payload)
      .pipe(map((res) => res.data));
  }

  /** Both "promote" and "demote" go through this same endpoint — role is just the target value. */
  setAdminRole(id: string, role: UserRole): Observable<AdminUser> {
    return this.http
      .patch<ApiEnvelope<AdminUser>>(`${this.base}/super-admin/admins/${id}/role`, { role })
      .pipe(map((res) => res.data));
  }

  /** One-directional — the backend has no "reactivate" endpoint. */
  deactivateAdmin(id: string): Observable<AdminUser> {
    return this.http
      .patch<ApiEnvelope<AdminUser>>(`${this.base}/super-admin/admins/${id}/deactivate`, {})
      .pipe(map((res) => res.data));
  }

  getAuditLogs(filter: AuditLogFilter): Observable<PagedResult<AuditLogEntry>> {
    let params = new HttpParams().set('limit', filter.limit).set('offset', filter.offset);
    if (filter.actorId) params = params.set('actorId', filter.actorId);
    if (filter.action) params = params.set('action', filter.action);
    if (filter.targetType) params = params.set('targetType', filter.targetType);
    if (filter.targetId) params = params.set('targetId', filter.targetId);

    return this.http
      .get<ApiListEnvelope<AuditLogEntry>>(`${this.base}/super-admin/audit-logs`, { params })
      .pipe(map((res) => ({ items: res.data, total: res.meta?.total ?? res.data.length })));
  }

  getSettings(): Observable<AppSettings> {
    return this.http.get<ApiEnvelope<AppSettings>>(`${this.base}/super-admin/settings`).pipe(map((res) => res.data));
  }

  updateSettings(payload: UpdateSettingsRequest): Observable<AppSettings> {
    return this.http
      .put<ApiEnvelope<AppSettings>>(`${this.base}/super-admin/settings`, payload)
      .pipe(map((res) => res.data));
  }
}

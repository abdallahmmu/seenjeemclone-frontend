import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AdminUser, AuditLogEntry } from '../../../core/models/admin.model';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { SuperAdminService } from '../services/super-admin.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-audit-logs',
  imports: [DataTableComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.auditLogs.title' | translate }}</h1>

    <div class="mt-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-500">{{ 'admin.auditLogs.actor' | translate }}</label>
        <select
          class="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          [value]="actorId()"
          (change)="actorId.set($any($event.target).value)"
        >
          <option value="">{{ 'admin.auditLogs.allActors' | translate }}</option>
          @for (admin of admins(); track admin.id) {
            <option [value]="admin.id">{{ admin.email }}</option>
          }
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-500">{{ 'admin.auditLogs.action' | translate }}</label>
        <input
          type="text"
          class="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          [value]="action()"
          (input)="action.set($any($event.target).value)"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-500">{{ 'admin.auditLogs.targetType' | translate }}</label>
        <input
          type="text"
          class="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          [value]="targetType()"
          (input)="targetType.set($any($event.target).value)"
        />
      </div>
      <button
        type="button"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        (click)="applyFilters()"
      >
        {{ 'common.search' | translate }}
      </button>
    </div>

    <div class="mt-4">
      <app-data-table
        [columns]="columns"
        [rows]="logs()"
        [loading]="loading()"
        [total]="total()"
        [page]="page()"
        [pageSize]="pageSize"
        (pageChange)="onPageChange($event)"
      />
    </div>
  `,
})
export class AuditLogsComponent {
  private readonly superAdminService = inject(SuperAdminService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly logs = signal<AuditLogEntry[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly admins = signal<AdminUser[]>([]);
  protected readonly actorId = signal('');
  protected readonly action = signal('');
  protected readonly targetType = signal('');
  protected readonly pageSize = PAGE_SIZE;

  protected readonly columns: DataTableColumn<AuditLogEntry>[] = [
    { key: 'actor', labelKey: 'admin.auditLogs.actor', cell: (l) => l.actor.email },
    { key: 'action', labelKey: 'admin.auditLogs.action' },
    { key: 'targetType', labelKey: 'admin.auditLogs.targetType' },
    { key: 'createdAt', labelKey: 'common.date', cell: (l) => new Date(l.createdAt).toLocaleString() },
  ];

  constructor() {
    this.superAdminService.getAdmins().subscribe((admins) => this.admins.set(admins));
    this.load();
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.superAdminService
      .getAuditLogs({
        actorId: this.actorId() || undefined,
        action: this.action() || undefined,
        targetType: this.targetType() || undefined,
        limit: this.pageSize,
        offset: (this.page() - 1) * this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.logs.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.toastService.error(apiErrorMessage(err, 'Could not load audit logs.'));
        },
      });
  }
}

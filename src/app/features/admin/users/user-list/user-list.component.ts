import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ManagedUser } from '../../../../core/models/managed-user.model';
import { UserRole } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-user-list',
  imports: [DataTableComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.users.title' | translate }}</h1>

    <div class="mt-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-500">{{ 'common.search' | translate }}</label>
        <input
          type="search"
          [placeholder]="'admin.users.searchPlaceholder' | translate"
          class="mt-1 w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          [value]="search()"
          (input)="search.set($any($event.target).value)"
          (keyup.enter)="applyFilters()"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-500">{{ 'common.role' | translate }}</label>
        <select
          class="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          [value]="roleFilter()"
          (change)="roleFilter.set($any($event.target).value)"
        >
          <option value="">{{ 'admin.users.allRoles' | translate }}</option>
          <option value="PLAYER">PLAYER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
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
        [rows]="users()"
        [loading]="loading()"
        [total]="total()"
        [page]="page()"
        [pageSize]="pageSize"
        (pageChange)="onPageChange($event)"
      >
        <ng-template #rowActions let-row>
          <div class="flex justify-end gap-3">
            <a [routerLink]="[row.id, 'edit']" class="text-xs font-semibold text-primary hover:text-primary-dark">
              {{ 'common.edit' | translate }}
            </a>
            @if (row.id !== authService.currentUser()?.id) {
              <button type="button" class="text-xs font-semibold text-slate-500 hover:text-slate-800" (click)="toggleActive(row)">
                {{ (row.isActive ? 'admin.admins.deactivate' : 'admin.users.activate') | translate }}
              </button>
            }
          </div>
        </ng-template>
      </app-data-table>
    </div>
  `,
})
export class UserListComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly users = signal<ManagedUser[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly search = signal('');
  protected readonly roleFilter = signal<UserRole | ''>('');
  protected readonly pageSize = PAGE_SIZE;

  protected readonly columns: DataTableColumn<ManagedUser>[] = [
    { key: 'handle', labelKey: 'common.name', cell: (u) => `@${u.handle}` },
    { key: 'email', labelKey: 'common.email' },
    { key: 'role', labelKey: 'common.role' },
    { key: 'credits', labelKey: 'admin.users.credits', cell: (u) => String(u.credits) },
    { key: 'isActive', labelKey: 'common.status', cell: (u) => (u.isActive ? '✓' : '✕') },
    { key: 'createdAt', labelKey: 'admin.admins.created', cell: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  constructor() {
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

  protected toggleActive(user: ManagedUser): void {
    this.adminService.setUserActive(user.id, !user.isActive).subscribe({
      next: (updated) => this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update this user.')),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService
      .searchUsers({
        search: this.search().trim() || undefined,
        role: this.roleFilter() || undefined,
        limit: this.pageSize,
        offset: (this.page() - 1) * this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.users.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.toastService.error(apiErrorMessage(err, 'Could not load users.'));
        },
      });
  }
}

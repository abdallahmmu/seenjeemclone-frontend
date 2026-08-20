import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUser } from '../../../core/models/admin.model';
import { UserRole } from '../../../core/models/user.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { SuperAdminService } from '../services/super-admin.service';

@Component({
  selector: 'app-admins',
  imports: [DataTableComponent, ConfirmModalComponent, ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.admins.title' | translate }}</h1>
      <button
        type="button"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        (click)="openInvite()"
      >
        + {{ 'admin.admins.invite' | translate }}
      </button>
    </div>

    <div class="mt-4">
      <app-data-table [columns]="columns" [rows]="admins()" [loading]="loading()" [total]="admins().length" [pageSize]="1000">
        <ng-template #rowActions let-row>
          <div class="flex justify-end gap-3">
            @if (row.role === 'ADMIN') {
              <button type="button" class="text-xs font-semibold text-primary hover:text-primary-dark" (click)="promote(row)">
                {{ 'admin.admins.promote' | translate }}
              </button>
            } @else {
              <button type="button" class="text-xs font-semibold text-slate-500 hover:text-slate-800" (click)="demote(row)">
                {{ 'admin.admins.demote' | translate }}
              </button>
            }
            @if (row.isActive) {
              <button
                type="button"
                class="text-xs font-semibold text-red-600 hover:text-red-800"
                (click)="confirmDeactivate(row)"
              >
                {{ 'admin.admins.deactivate' | translate }}
              </button>
            }
          </div>
        </ng-template>
      </app-data-table>
    </div>

    @if (inviteOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" (click)="inviteOpen.set(false)">
        <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">{{ 'admin.admins.invite' | translate }}</h2>
          <form class="mt-4 space-y-4" [formGroup]="inviteForm" (ngSubmit)="sendInvite()">
            <div>
              <label class="block text-sm font-medium text-slate-700">{{ 'admin.admins.inviteEmail' | translate }}</label>
              <input
                type="email"
                formControlName="email"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">{{ 'admin.admins.inviteRole' | translate }}</label>
              <select formControlName="role" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                (click)="inviteOpen.set(false)"
              >
                {{ 'common.cancel' | translate }}
              </button>
              <button
                type="submit"
                [disabled]="inviting()"
                class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {{ 'admin.admins.invite' | translate }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <app-confirm-modal
      [open]="!!pendingDeactivate()"
      [title]="'admin.admins.title' | translate"
      [message]="'common.confirm' | translate"
      [danger]="true"
      [confirmLabel]="'admin.admins.deactivate' | translate"
      (confirmed)="deactivateConfirmed()"
      (cancelled)="pendingDeactivate.set(null)"
    />
  `,
})
export class AdminsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly superAdminService = inject(SuperAdminService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly admins = signal<AdminUser[]>([]);
  protected readonly inviteOpen = signal(false);
  protected readonly inviting = signal(false);
  protected readonly pendingDeactivate = signal<AdminUser | null>(null);

  protected readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['ADMIN' as 'ADMIN' | 'SUPER_ADMIN', Validators.required],
  });

  protected readonly columns: DataTableColumn<AdminUser>[] = [
    { key: 'email', labelKey: 'common.email' },
    { key: 'role', labelKey: 'common.role' },
    { key: 'isActive', labelKey: 'common.status', cell: (a) => (a.isActive ? '✓' : '✕') },
    { key: 'createdAt', labelKey: 'admin.admins.created', cell: (a) => new Date(a.createdAt).toLocaleDateString() },
  ];

  constructor() {
    this.load();
  }

  protected openInvite(): void {
    this.inviteForm.reset({ email: '', role: 'ADMIN' });
    this.inviteOpen.set(true);
  }

  protected sendInvite(): void {
    if (this.inviteForm.invalid || this.inviting()) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviting.set(true);
    this.superAdminService.inviteAdmin(this.inviteForm.getRawValue()).subscribe({
      next: (admin) => {
        this.admins.update((list) => [...list, admin]);
        this.inviting.set(false);
        this.inviteOpen.set(false);
        this.toastService.success('Invitation sent.');
      },
      error: (err: unknown) => {
        this.inviting.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not send the invitation.'));
      },
    });
  }

  protected promote(admin: AdminUser): void {
    this.setRole(admin, 'SUPER_ADMIN');
  }

  protected demote(admin: AdminUser): void {
    this.setRole(admin, 'ADMIN');
  }

  protected confirmDeactivate(admin: AdminUser): void {
    this.pendingDeactivate.set(admin);
  }

  protected deactivateConfirmed(): void {
    const admin = this.pendingDeactivate();
    if (!admin) return;

    this.superAdminService.deactivateAdmin(admin.id).subscribe({
      next: (updated) => {
        this.admins.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
        this.pendingDeactivate.set(null);
      },
      error: (err: unknown) => {
        this.pendingDeactivate.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not deactivate this admin.'));
      },
    });
  }

  private setRole(admin: AdminUser, role: UserRole): void {
    this.superAdminService.setAdminRole(admin.id, role).subscribe({
      next: (updated) => this.admins.update((list) => list.map((a) => (a.id === updated.id ? updated : a))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the role.')),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.superAdminService.getAdmins().subscribe({
      next: (admins) => {
        this.admins.set(admins);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load admins.'));
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PromoCode } from '../../../../core/models/promo-code.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-promo-code-list',
  imports: [DataTableComponent, ConfirmModalComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.promoCodes.title' | translate }}</h1>
      <a routerLink="new" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        + {{ 'admin.promoCodes.add' | translate }}
      </a>
    </div>

    <div class="mt-4">
      <app-data-table [columns]="columns()" [rows]="codes()" [loading]="loading()" [total]="codes().length" [pageSize]="1000">
        <ng-template #rowActions let-row>
          <div class="flex justify-end gap-3">
            <button type="button" class="text-xs font-semibold text-slate-500 hover:text-slate-800" (click)="toggleActive(row)">
              {{ (row.active ? 'common.inactive' : 'common.active') | translate }}
            </button>
            <a [routerLink]="[row.id, 'edit']" class="text-xs font-semibold text-primary hover:text-primary-dark">{{ 'common.edit' | translate }}</a>
            <button type="button" class="text-xs font-semibold text-red-600 hover:text-red-800" (click)="confirmDelete(row)">{{ 'common.delete' | translate }}</button>
          </div>
        </ng-template>
      </app-data-table>
    </div>

    <app-confirm-modal
      [open]="!!pendingDelete()"
      [title]="'admin.promoCodes.title' | translate"
      [message]="'admin.promoCodes.deleteConfirm' | translate"
      [danger]="true"
      [confirmLabel]="'common.delete' | translate"
      (confirmed)="deleteConfirmed()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class PromoCodeListComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly codes = signal<PromoCode[]>([]);
  protected readonly pendingDelete = signal<PromoCode | null>(null);

  protected readonly columns = computed<DataTableColumn<PromoCode>[]>(() => [
    { key: 'code', labelKey: 'admin.promoCodes.code', cell: (c) => c.code },
    {
      key: 'reward',
      labelKey: 'admin.promoCodes.reward',
      cell: (c) => (c.type === 'PERCENTAGE' ? `${c.discountPercent}%` : `+${c.creditAmount} credits`),
    },
    { key: 'maxRedemptionsPerUser', labelKey: 'admin.promoCodes.maxRedemptions', cell: (c) => String(c.maxRedemptionsPerUser) },
    { key: 'targetUser', labelKey: 'admin.promoCodes.target', cell: (c) => c.targetUser?.handle ?? '—' },
    { key: 'expiresAt', labelKey: 'admin.promoCodes.expiresAt', cell: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—') },
    { key: 'active', labelKey: 'common.status', cell: (c) => (c.active ? '✓' : '—') },
  ]);

  constructor() {
    this.load();
  }

  protected toggleActive(code: PromoCode): void {
    this.adminService.updatePromoCode(code.id, { active: !code.active }).subscribe({
      next: (updated) => this.codes.update((list) => list.map((c) => (c.id === updated.id ? updated : c))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the promo code.')),
    });
  }

  protected confirmDelete(code: PromoCode): void {
    this.pendingDelete.set(code);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const code = this.pendingDelete();
    if (!code) return;

    this.adminService.deletePromoCode(code.id).subscribe({
      next: () => {
        this.codes.update((list) => list.filter((c) => c.id !== code.id));
        this.pendingDelete.set(null);
        this.toastService.success('Promo code deleted.');
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not delete the promo code.'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getPromoCodes().subscribe({
      next: (codes) => {
        this.codes.set(codes);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load promo codes.'));
      },
    });
  }
}

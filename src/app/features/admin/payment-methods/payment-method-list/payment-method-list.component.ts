import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentMethod } from '../../../../core/models/payment-method.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-payment-method-list',
  imports: [DataTableComponent, ConfirmModalComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.paymentMethods.title' | translate }}</h1>
      <a routerLink="new" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        + {{ 'admin.paymentMethods.add' | translate }}
      </a>
    </div>

    <div class="mt-4">
      <app-data-table [columns]="columns()" [rows]="methods()" [loading]="loading()" [total]="methods().length" [pageSize]="1000">
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
      [title]="'admin.paymentMethods.title' | translate"
      [message]="'admin.paymentMethods.deleteConfirm' | translate"
      [danger]="true"
      [confirmLabel]="'common.delete' | translate"
      (confirmed)="deleteConfirmed()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class PaymentMethodListComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly methods = signal<PaymentMethod[]>([]);
  protected readonly pendingDelete = signal<PaymentMethod | null>(null);

  protected readonly columns = computed<DataTableColumn<PaymentMethod>[]>(() => [
    { key: 'name', labelKey: 'admin.paymentMethods.name', cell: (m) => m.name },
    { key: 'order', labelKey: 'admin.paymentMethods.order', cell: (m) => String(m.order) },
    { key: 'active', labelKey: 'common.status', cell: (m) => (m.active ? '✓' : '—') },
  ]);

  constructor() {
    this.load();
  }

  protected toggleActive(method: PaymentMethod): void {
    this.adminService.updatePaymentMethod(method.id, { active: !method.active }).subscribe({
      next: (updated) => this.methods.update((list) => list.map((m) => (m.id === updated.id ? updated : m))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the payment method.')),
    });
  }

  protected confirmDelete(method: PaymentMethod): void {
    this.pendingDelete.set(method);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const method = this.pendingDelete();
    if (!method) return;

    this.adminService.deletePaymentMethod(method.id).subscribe({
      next: () => {
        this.methods.update((list) => list.filter((m) => m.id !== method.id));
        this.pendingDelete.set(null);
        this.toastService.success('Payment method deleted.');
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not delete the payment method.'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.methods.set(methods);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load payment methods.'));
      },
    });
  }
}

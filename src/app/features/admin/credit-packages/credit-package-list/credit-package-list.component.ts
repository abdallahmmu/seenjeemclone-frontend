import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CreditPackage } from '../../../../core/models/credit-package.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-credit-package-list',
  imports: [DataTableComponent, ConfirmModalComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.creditPackages.title' | translate }}</h1>
      <a routerLink="new" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        + {{ 'admin.creditPackages.add' | translate }}
      </a>
    </div>

    <div class="mt-4">
      <app-data-table [columns]="columns()" [rows]="packages()" [loading]="loading()" [total]="packages().length" [pageSize]="1000">
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
      [title]="'admin.creditPackages.title' | translate"
      [message]="'admin.creditPackages.deleteConfirm' | translate"
      [danger]="true"
      [confirmLabel]="'common.delete' | translate"
      (confirmed)="deleteConfirmed()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class CreditPackageListComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly packages = signal<CreditPackage[]>([]);
  protected readonly pendingDelete = signal<CreditPackage | null>(null);

  protected readonly columns = computed<DataTableColumn<CreditPackage>[]>(() => [
    { key: 'credits', labelKey: 'admin.creditPackages.credits', cell: (p) => String(p.credits) },
    { key: 'priceEgp', labelKey: 'admin.creditPackages.priceEgp', cell: (p) => `${p.priceEgp} EGP` },
    { key: 'order', labelKey: 'admin.creditPackages.order', cell: (p) => String(p.order) },
    { key: 'active', labelKey: 'common.status', cell: (p) => (p.active ? '✓' : '—') },
  ]);

  constructor() {
    this.load();
  }

  protected toggleActive(pkg: CreditPackage): void {
    this.adminService.updateCreditPackage(pkg.id, { active: !pkg.active }).subscribe({
      next: (updated) => this.packages.update((list) => list.map((p) => (p.id === updated.id ? updated : p))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the package.')),
    });
  }

  protected confirmDelete(pkg: CreditPackage): void {
    this.pendingDelete.set(pkg);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const pkg = this.pendingDelete();
    if (!pkg) return;

    this.adminService.deleteCreditPackage(pkg.id).subscribe({
      next: () => {
        this.packages.update((list) => list.filter((p) => p.id !== pkg.id));
        this.pendingDelete.set(null);
        this.toastService.success('Credit package deleted.');
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not delete the package.'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getCreditPackages().subscribe({
      next: (packages) => {
        this.packages.set(packages);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load credit packages.'));
      },
    });
  }
}

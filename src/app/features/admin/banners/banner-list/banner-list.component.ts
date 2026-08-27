import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Banner } from '../../../../core/models/banner.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { backendAssetUrl } from '../../../../shared/utils/backend-asset-url';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-banner-list',
  imports: [DataTableComponent, ConfirmModalComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.banners.title' | translate }}</h1>
      <a routerLink="new" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        + {{ 'admin.banners.add' | translate }}
      </a>
    </div>
    <p class="mt-1 text-sm text-slate-400">{{ 'admin.banners.orderHint' | translate }}</p>

    <div class="mt-4">
      <app-data-table [columns]="columns()" [rows]="banners()" [loading]="loading()" [total]="banners().length" [pageSize]="1000">
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
      [title]="'admin.banners.title' | translate"
      [message]="'admin.banners.deleteConfirm' | translate"
      [danger]="true"
      [confirmLabel]="'common.delete' | translate"
      (confirmed)="deleteConfirmed()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class BannerListComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly banners = signal<Banner[]>([]);
  protected readonly pendingDelete = signal<Banner | null>(null);

  protected readonly columns = computed<DataTableColumn<Banner>[]>(() => [
    { key: 'image', labelKey: 'admin.banners.image', cell: (b) => backendAssetUrl(b.imageUrl) },
    { key: 'order', labelKey: 'admin.banners.order', cell: (b) => String(b.order) },
    { key: 'frequencyCap', labelKey: 'admin.banners.frequencyCap', cell: (b) => b.frequencyCap },
    { key: 'linkUrl', labelKey: 'admin.banners.linkUrl', cell: (b) => b.linkUrl ?? '—' },
    { key: 'active', labelKey: 'common.status', cell: (b) => (b.active ? '✓' : '—') },
  ]);

  constructor() {
    this.load();
  }

  protected toggleActive(banner: Banner): void {
    this.adminService.updateBanner(banner.id, { active: !banner.active }).subscribe({
      next: (updated) => this.banners.update((list) => list.map((b) => (b.id === updated.id ? updated : b))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the banner.')),
    });
  }

  protected confirmDelete(banner: Banner): void {
    this.pendingDelete.set(banner);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const banner = this.pendingDelete();
    if (!banner) return;

    this.adminService.deleteBanner(banner.id).subscribe({
      next: () => {
        this.banners.update((list) => list.filter((b) => b.id !== banner.id));
        this.pendingDelete.set(null);
        this.toastService.success('Banner deleted.');
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not delete the banner.'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getBanners().subscribe({
      next: (banners) => {
        this.banners.set(banners);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load banners.'));
      },
    });
  }
}

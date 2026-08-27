import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { backendAssetUrl } from '../../../shared/utils/backend-asset-url';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../core/models/purchase-order.model';
import { AdminService } from '../services/admin.service';

type StatusFilter = PurchaseOrderStatus | 'ALL';

@Component({
  selector: 'app-purchase-order-review',
  imports: [FormsModule, ConfirmModalComponent, TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.purchaseOrders.title' | translate }}</h1>
    </div>

    <div class="mt-4 flex gap-2">
      @for (option of statusOptions; track option) {
        <button
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-semibold"
          [class]="filter() === option ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          (click)="setFilter(option)"
        >
          {{ ('admin.purchaseOrders.status' + option) | translate }}
        </button>
      }
    </div>

    @if (loading()) {
      <div class="mt-8 flex justify-center"><app-loading-spinner [size]="28" /></div>
    } @else if (orders().length === 0) {
      <p class="mt-8 text-center text-sm text-slate-400">{{ 'admin.purchaseOrders.empty' | translate }}</p>
    } @else {
      <div class="mt-4 space-y-3">
        @for (order of orders(); track order.id) {
          <div class="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <a [href]="proofUrl(order)" target="_blank" rel="noopener" class="shrink-0">
              <img [src]="proofUrl(order)" alt="" class="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
            </a>

            <div class="min-w-40 flex-1">
              <p class="text-sm font-semibold text-slate-800">{{ order.user?.handle ?? order.userId }}</p>
              <p class="text-xs text-slate-500">{{ order.user?.email }}</p>
            </div>

            <div class="min-w-32">
              <p class="text-sm text-slate-700">{{ order.creditsRequested }} {{ 'admin.purchaseOrders.credits' | translate }}</p>
              <p class="text-xs text-slate-500">
                @if (order.priceEgp !== order.originalPriceEgp) {
                  <span class="text-slate-400 line-through">{{ order.originalPriceEgp }}</span>
                  {{ order.priceEgp }} EGP
                } @else {
                  {{ order.priceEgp }} EGP
                }
              </p>
            </div>

            <div class="min-w-28 text-xs text-slate-500">{{ order.paymentMethod?.name }}</div>

            <span
              class="rounded-full px-2.5 py-1 text-xs font-semibold"
              [class]="statusClass(order.status)"
            >
              {{ ('admin.purchaseOrders.status' + order.status) | translate }}
            </span>

            @if (order.status === 'PENDING') {
              <div class="flex gap-2">
                <button type="button" class="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white hover:bg-secondary-dark" (click)="confirmApprove(order)">
                  {{ 'admin.purchaseOrders.approve' | translate }}
                </button>
                <button type="button" class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50" (click)="openReject(order)">
                  {{ 'admin.purchaseOrders.reject' | translate }}
                </button>
              </div>
            } @else if (order.rejectionReason) {
              <p class="max-w-48 text-xs text-slate-400">{{ order.rejectionReason }}</p>
            }
          </div>
        }
      </div>
    }

    <app-confirm-modal
      [open]="!!pendingApprove()"
      [title]="'admin.purchaseOrders.approve' | translate"
      [message]="'admin.purchaseOrders.approveConfirm' | translate"
      [confirmLabel]="'admin.purchaseOrders.approve' | translate"
      (confirmed)="approveConfirmed()"
      (cancelled)="pendingApprove.set(null)"
    />

    @if (pendingReject(); as order) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" (click)="pendingReject.set(null)">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">{{ 'admin.purchaseOrders.reject' | translate }}</h2>
          <p class="mt-2 text-sm text-slate-600">{{ 'admin.purchaseOrders.rejectPrompt' | translate }}</p>
          <textarea [(ngModel)]="rejectReason" rows="3" class="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100" (click)="pendingReject.set(null)">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" (click)="rejectConfirmed(order)">
              {{ 'admin.purchaseOrders.reject' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PurchaseOrderReviewComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  protected readonly statusOptions: StatusFilter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
  protected readonly filter = signal<StatusFilter>('PENDING');
  protected readonly loading = signal(true);
  protected readonly orders = signal<PurchaseOrder[]>([]);
  protected readonly pendingApprove = signal<PurchaseOrder | null>(null);
  protected readonly pendingReject = signal<PurchaseOrder | null>(null);
  protected rejectReason = '';

  constructor() {
    this.load();
  }

  protected setFilter(filter: StatusFilter): void {
    this.filter.set(filter);
    this.load();
  }

  protected proofUrl(order: PurchaseOrder): string {
    return backendAssetUrl(order.proofImageUrl);
  }

  protected statusClass(status: PurchaseOrderStatus): string {
    if (status === 'APPROVED') return 'bg-secondary-soft text-secondary-dark';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-accent-soft text-accent-dark';
  }

  protected confirmApprove(order: PurchaseOrder): void {
    this.pendingApprove.set(order);
  }

  protected approveConfirmed(): void {
    const order = this.pendingApprove();
    if (!order) return;
    this.pendingApprove.set(null);

    this.adminService.approvePurchaseOrder(order.id).subscribe({
      next: (updated) => this.replaceOrder(updated),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not approve the order.')),
    });
  }

  protected openReject(order: PurchaseOrder): void {
    this.rejectReason = '';
    this.pendingReject.set(order);
  }

  protected rejectConfirmed(order: PurchaseOrder): void {
    this.pendingReject.set(null);

    this.adminService.rejectPurchaseOrder(order.id, this.rejectReason.trim() || undefined).subscribe({
      next: (updated) => this.replaceOrder(updated),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not reject the order.')),
    });
  }

  private replaceOrder(updated: PurchaseOrder): void {
    if (this.filter() !== 'ALL' && updated.status !== this.filter()) {
      this.orders.update((list) => list.filter((o) => o.id !== updated.id));
    } else {
      this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
    }
    this.toastService.success('Order updated.');
  }

  private load(): void {
    this.loading.set(true);
    const filter = this.filter();
    this.adminService.getPurchaseOrders(filter === 'ALL' ? undefined : filter).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load purchase orders.'));
      },
    });
  }
}

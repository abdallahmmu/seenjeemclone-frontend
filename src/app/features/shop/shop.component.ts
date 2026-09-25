import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CreditPackage } from '../../core/models/credit-package.model';
import { PaymentMethod } from '../../core/models/payment-method.model';
import { PurchaseOrder } from '../../core/models/purchase-order.model';
import { AuthService } from '../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/api-error';
import { backendAssetUrl } from '../../shared/utils/backend-asset-url';
import { ShopService } from './services/shop.service';

@Component({
  selector: 'app-shop',
  imports: [TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl bg-bg px-4 py-10">
      <h1 class="nb-heading text-3xl text-ink">{{ 'shop.title' | translate }}</h1>
      <p class="mt-1 text-sm text-ink-soft">{{ 'shop.subtitle' | translate: { credits: currentCredits() } }}</p>

      @if (loading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner [size]="28" /></div>
      } @else {
        <div class="mt-8">
          <h2 class="nb-heading text-base text-ink">{{ 'shop.choosePackage' | translate }}</h2>
          <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            @for (pkg of packages(); track pkg.id) {
              <button
                type="button"
                class="nb-card flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)]"
                [class]="selectedPackage()?.id === pkg.id ? 'bg-primary-soft' : 'bg-surface'"
                (click)="selectedPackage.set(pkg)"
              >
                @if (pkg.imageUrl) {
                  <img [src]="assetUrl(pkg.imageUrl)" alt="" class="h-14 w-14 rounded-lg border-2 border-ink object-cover" />
                } @else {
                  <span class="text-3xl">💳</span>
                }
                <span class="nb-heading text-lg text-ink">{{ pkg.credits }}</span>
                <span class="text-xs font-semibold text-ink-soft">{{ pkg.priceEgp }} EGP</span>
              </button>
            }
          </div>

          <h2 class="nb-heading mt-8 text-base text-ink">{{ 'shop.choosePaymentMethod' | translate }}</h2>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            @for (method of paymentMethods(); track method.id) {
              <button
                type="button"
                class="nb-card flex items-start gap-3 p-4 text-start transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)]"
                [class]="selectedMethod()?.id === method.id ? 'bg-primary-soft' : 'bg-surface'"
                (click)="selectedMethod.set(method)"
              >
                @if (method.imageUrl) {
                  <img [src]="assetUrl(method.imageUrl)" alt="" class="h-10 w-10 shrink-0 rounded-lg border-2 border-ink object-cover" />
                }
                <span>
                  <span class="block text-sm font-bold text-ink">{{ method.name }}</span>
                  @if (method.instructions) {
                    <span class="block text-xs text-ink-soft">{{ method.instructions }}</span>
                  }
                </span>
              </button>
            }
          </div>

          <h2 class="nb-heading mt-8 text-base text-ink">{{ 'shop.uploadProof' | translate }}</h2>
          <p class="mt-1 text-xs text-ink-soft">{{ 'shop.uploadProofHint' | translate }}</p>
          <label class="nb-btn nb-btn-outline mt-3 inline-flex cursor-pointer px-4 py-2 text-sm">
            {{ proofFile() ? proofFile()!.name : ('shop.chooseFile' | translate) }}
            <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="onFileSelected($event)" />
          </label>

          <div class="mt-6">
            <button type="button" [disabled]="!canSubmit() || submitting()" class="nb-btn nb-btn-primary px-6 py-2.5 text-sm" (click)="submitOrder()">
              @if (submitting()) { <app-loading-spinner [size]="16" variant="white" /> }
              {{ 'shop.submitOrder' | translate }}
            </button>
          </div>
        </div>

        <div class="mt-12">
          <h2 class="nb-heading text-xl text-ink">{{ 'shop.myOrders' | translate }}</h2>
          @if (orders().length === 0) {
            <p class="mt-2 text-sm text-ink-soft">{{ 'shop.noOrders' | translate }}</p>
          } @else {
            <div class="mt-3 space-y-2">
              @for (order of orders(); track order.id) {
                <div class="nb-card flex items-center justify-between px-4 py-3 text-sm">
                  <span class="font-medium text-ink">{{ order.creditsRequested }} {{ 'shop.credits' | translate }} — {{ order.priceEgp }} EGP</span>
                  <span class="nb-badge normal-case" [class]="statusClass(order.status)">
                    {{ ('shop.status' + order.status) | translate }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ShopComponent implements OnInit {
  private readonly shopService = inject(ShopService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly packages = signal<CreditPackage[]>([]);
  protected readonly paymentMethods = signal<PaymentMethod[]>([]);
  protected readonly orders = signal<PurchaseOrder[]>([]);
  protected readonly selectedPackage = signal<CreditPackage | null>(null);
  protected readonly selectedMethod = signal<PaymentMethod | null>(null);
  protected readonly proofFile = signal<File | null>(null);

  protected readonly currentCredits = computed(() => this.authService.currentUser()?.credits ?? 0);
  protected readonly canSubmit = computed(() => !!this.selectedPackage() && !!this.selectedMethod() && !!this.proofFile());

  ngOnInit(): void {
    Promise.all([
      new Promise<void>((resolve) =>
        this.shopService.getCreditPackages().subscribe({
          next: (packages) => {
            this.packages.set(packages);
            resolve();
          },
          error: () => resolve(),
        }),
      ),
      new Promise<void>((resolve) =>
        this.shopService.getPaymentMethods().subscribe({
          next: (methods) => {
            this.paymentMethods.set(methods);
            resolve();
          },
          error: () => resolve(),
        }),
      ),
    ]).then(() => this.loading.set(false));

    this.loadOrders();
  }

  protected assetUrl(path: string): string {
    return backendAssetUrl(path);
  }

  protected statusClass(status: PurchaseOrder['status']): string {
    if (status === 'APPROVED') return 'nb-badge-secondary';
    if (status === 'REJECTED') return 'nb-badge-soft';
    return 'bg-secondary-soft text-secondary-dark';
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.proofFile.set(input.files?.[0] ?? null);
  }

  protected submitOrder(): void {
    const pkg = this.selectedPackage();
    const method = this.selectedMethod();
    const file = this.proofFile();
    if (!pkg || !method || !file || this.submitting()) return;

    this.submitting.set(true);
    this.shopService.submitPurchaseOrder(pkg.id, method.id, file).subscribe({
      next: () => {
        this.submitting.set(false);
        this.selectedPackage.set(null);
        this.selectedMethod.set(null);
        this.proofFile.set(null);
        this.toastService.success('Order submitted — an admin will review it shortly.');
        this.loadOrders();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not submit the order.'));
      },
    });
  }

  private loadOrders(): void {
    this.shopService.getMyPurchaseOrders().subscribe({
      next: (orders) => this.orders.set(orders),
      error: () => {
        // Best-effort only — the order history section just stays empty.
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { backendAssetUrl } from '../../../../shared/utils/backend-asset-url';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-payment-method-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-xl">
      <h1 class="text-2xl font-bold text-slate-900">{{ (isEdit() ? 'admin.paymentMethods.edit' : 'admin.paymentMethods.add') | translate }}</h1>

      <form class="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.paymentMethods.name' | translate }}</label>
          <input type="text" formControlName="name" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.paymentMethods.instructions' | translate }}</label>
          <textarea formControlName="instructions" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.paymentMethods.order' | translate }}</label>
          <input type="number" formControlName="order" class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div class="flex items-center gap-2">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 rounded border-slate-300" />
          <label for="active" class="text-sm text-slate-700">{{ 'common.active' | translate }}</label>
        </div>

        @if (isEdit()) {
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.paymentMethods.image' | translate }}</label>
            <div class="mt-2 flex items-center gap-4">
              @if (displayImageUrl(); as url) {
                <img [src]="url" alt="" class="h-16 w-16 rounded-lg object-cover" />
              }
              <label class="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                {{ uploading() ? '…' : ('admin.paymentMethods.uploadImage' | translate) }}
                <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
              </label>
            </div>
          </div>
        }

        <div class="flex justify-end gap-3">
          <a routerLink="/admin/payment-methods" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{{ 'common.cancel' | translate }}</a>
          <button type="submit" [disabled]="saving()" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            @if (saving()) { <app-loading-spinner [size]="16" variant="white" /> }
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class PaymentMethodFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly isEdit = signal(false);
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly displayImageUrl = computed(() => {
    const url = this.imageUrl();
    return url ? backendAssetUrl(url) : null;
  });

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    instructions: [''],
    order: [0],
    active: [true],
  });

  private methodId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.methodId = id;
      this.adminService.getPaymentMethod(id).subscribe({
        next: (method) => {
          this.form.patchValue({ ...method, instructions: method.instructions ?? '' });
          this.imageUrl.set(method.imageUrl);
        },
        error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not load the payment method.')),
      });
    }
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.methodId) return;

    this.uploading.set(true);
    this.adminService.uploadPaymentMethodImage(this.methodId, file).subscribe({
      next: (method) => {
        this.imageUrl.set(method.imageUrl);
        this.uploading.set(false);
      },
      error: (err: unknown) => {
        this.uploading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not upload the image.'));
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const payload = { ...value, instructions: value.instructions || null };
    const request = this.isEdit()
      ? this.adminService.updatePaymentMethod(this.methodId, payload)
      : this.adminService.createPaymentMethod(payload);

    request.subscribe({
      next: () => {
        this.toastService.success('Payment method saved.');
        this.router.navigateByUrl('/admin/payment-methods');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save the payment method.'));
      },
    });
  }
}

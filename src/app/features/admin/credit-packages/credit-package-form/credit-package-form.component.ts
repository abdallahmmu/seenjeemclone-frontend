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
  selector: 'app-credit-package-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-xl">
      <h1 class="text-2xl font-bold text-slate-900">{{ (isEdit() ? 'admin.creditPackages.edit' : 'admin.creditPackages.add') | translate }}</h1>

      <form class="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.creditPackages.credits' | translate }}</label>
          <input type="number" formControlName="credits" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.creditPackages.priceEgp' | translate }}</label>
          <input type="number" formControlName="priceEgp" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.creditPackages.order' | translate }}</label>
          <input type="number" formControlName="order" class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div class="flex items-center gap-2">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 rounded border-slate-300" />
          <label for="active" class="text-sm text-slate-700">{{ 'common.active' | translate }}</label>
        </div>

        @if (isEdit()) {
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.creditPackages.image' | translate }}</label>
            <div class="mt-2 flex items-center gap-4">
              @if (displayImageUrl(); as url) {
                <img [src]="url" alt="" class="h-16 w-16 rounded-lg object-cover" />
              }
              <label class="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                {{ uploading() ? '…' : ('admin.creditPackages.uploadImage' | translate) }}
                <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
              </label>
            </div>
          </div>
        }

        <div class="flex justify-end gap-3">
          <a routerLink="/admin/credit-packages" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{{ 'common.cancel' | translate }}</a>
          <button type="submit" [disabled]="saving()" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            @if (saving()) { <app-loading-spinner [size]="16" variant="white" /> }
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CreditPackageFormComponent implements OnInit {
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
    credits: [1, [Validators.required, Validators.min(1)]],
    priceEgp: [1, [Validators.required, Validators.min(0.01)]],
    order: [0],
    active: [true],
  });

  private packageId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.packageId = id;
      this.adminService.getCreditPackage(id).subscribe({
        next: (pkg) => {
          this.form.patchValue(pkg);
          this.imageUrl.set(pkg.imageUrl);
        },
        error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not load the package.')),
      });
    }
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.packageId) return;

    this.uploading.set(true);
    this.adminService.uploadCreditPackageImage(this.packageId, file).subscribe({
      next: (pkg) => {
        this.imageUrl.set(pkg.imageUrl);
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
    const payload = this.form.getRawValue();
    const request = this.isEdit()
      ? this.adminService.updateCreditPackage(this.packageId, payload)
      : this.adminService.createCreditPackage(payload);

    request.subscribe({
      next: () => {
        this.toastService.success('Credit package saved.');
        this.router.navigateByUrl('/admin/credit-packages');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save the package.'));
      },
    });
  }
}

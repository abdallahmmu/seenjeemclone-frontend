import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { backendAssetUrl } from '../../../../shared/utils/backend-asset-url';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-banner-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-xl">
      <h1 class="text-2xl font-bold text-slate-900">{{ (isEdit() ? 'admin.banners.edit' : 'admin.banners.add') | translate }}</h1>

      <form class="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.banners.image' | translate }}</label>
          <div class="mt-2 flex items-center gap-4">
            @if (displayImageUrl(); as url) {
              <img [src]="url" alt="" class="h-16 w-28 rounded-lg object-cover" />
            }
            <label class="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              {{ uploading() ? '…' : (isEdit() ? ('admin.banners.uploadImage' | translate) : ('admin.banners.chooseImage' | translate)) }}
              <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
            </label>
          </div>
          @if (!isEdit() && !selectedFile() && submitted()) {
            <p class="mt-1 text-xs text-red-600">{{ 'admin.banners.imageRequired' | translate }}</p>
          }
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.banners.linkUrl' | translate }}</label>
          <input type="text" formControlName="linkUrl" placeholder="/shop" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.banners.frequencyCap' | translate }}</label>
          <select formControlName="frequencyCap" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="ONCE">{{ 'admin.banners.once' | translate }}</option>
            <option value="TWICE">{{ 'admin.banners.twice' | translate }}</option>
            <option value="ALWAYS">{{ 'admin.banners.always' | translate }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.banners.order' | translate }}</label>
          <input type="number" formControlName="order" class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <p class="mt-1 text-xs text-slate-400">{{ 'admin.banners.orderHint' | translate }}</p>
        </div>

        <div class="flex items-center gap-2">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 rounded border-slate-300" />
          <label for="active" class="text-sm text-slate-700">{{ 'common.active' | translate }}</label>
        </div>

        <div class="flex justify-end gap-3">
          <a routerLink="/admin/banners" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{{ 'common.cancel' | translate }}</a>
          <button type="submit" [disabled]="saving()" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            @if (saving()) { <app-loading-spinner [size]="16" variant="white" /> }
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class BannerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly isEdit = signal(false);
  protected readonly submitted = signal(false);
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly displayImageUrl = computed(() => {
    const file = this.selectedFile();
    if (file) return URL.createObjectURL(file);
    const url = this.imageUrl();
    return url ? backendAssetUrl(url) : null;
  });

  protected readonly form = this.fb.nonNullable.group({
    linkUrl: [''],
    frequencyCap: ['ALWAYS' as 'ONCE' | 'TWICE' | 'ALWAYS'],
    order: [0],
    active: [true],
  });

  private bannerId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.bannerId = id;
      this.adminService.getBanner(id).subscribe({
        next: (banner) => {
          this.form.patchValue({ linkUrl: banner.linkUrl ?? '', frequencyCap: banner.frequencyCap, order: banner.order, active: banner.active });
          this.imageUrl.set(banner.imageUrl);
        },
        error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not load the banner.')),
      });
    }
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.isEdit()) {
      this.uploading.set(true);
      this.adminService.uploadBannerImage(this.bannerId, file).subscribe({
        next: (banner) => {
          this.imageUrl.set(banner.imageUrl);
          this.uploading.set(false);
        },
        error: (err: unknown) => {
          this.uploading.set(false);
          this.toastService.error(apiErrorMessage(err, 'Could not upload the image.'));
        },
      });
    } else {
      this.selectedFile.set(file);
    }
  }

  protected submit(): void {
    this.submitted.set(true);

    if (this.form.invalid || this.saving() || (!this.isEdit() && !this.selectedFile())) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const linkUrl = value.linkUrl.trim() || null;

    const request = this.isEdit()
      ? this.adminService.updateBanner(this.bannerId, { linkUrl, frequencyCap: value.frequencyCap, order: value.order, active: value.active })
      : this.adminService.createBanner({ linkUrl, frequencyCap: value.frequencyCap, order: value.order, active: value.active }, this.selectedFile()!);

    request.subscribe({
      next: () => {
        this.toastService.success('Banner saved.');
        this.router.navigateByUrl('/admin/banners');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save the banner.'));
      },
    });
  }
}

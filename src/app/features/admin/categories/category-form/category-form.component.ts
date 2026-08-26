import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryGroup } from '../../../../core/models/category.model';
import { TranslateService } from '../../../../core/services/translate.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { categoryImageUrl } from '../../../../shared/utils/category-image';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl">
      <h1 class="text-2xl font-bold text-slate-900">
        {{ (isEdit() ? 'admin.categories.edit' : 'admin.categories.add') | translate }}
      </h1>

      <form class="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.categories.group' | translate }}</label>
          <select formControlName="groupId" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="" disabled>{{ 'admin.categories.group' | translate }}</option>
            @for (group of groups(); track group.id) {
              <option [value]="group.id">{{ translateService.lang() === 'ar' ? group.nameAr : group.nameEn }}</option>
            }
          </select>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.categories.nameEn' | translate }}</label>
            <input
              type="text"
              formControlName="nameEn"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div dir="rtl">
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.categories.nameAr' | translate }}</label>
            <input
              type="text"
              formControlName="nameAr"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">{{
              'admin.categories.descriptionEn' | translate
            }}</label>
            <textarea
              formControlName="descriptionEn"
              rows="3"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            ></textarea>
          </div>
          <div dir="rtl">
            <label class="block text-sm font-medium text-slate-700">{{
              'admin.categories.descriptionAr' | translate
            }}</label>
            <textarea
              formControlName="descriptionAr"
              rows="3"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            ></textarea>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.categories.order' | translate }}</label>
          <input
            type="number"
            formControlName="order"
            class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div class="flex items-center gap-2">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 rounded border-slate-300" />
          <label for="active" class="text-sm text-slate-700">{{ 'common.active' | translate }}</label>
        </div>

        @if (isEdit()) {
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.categories.image' | translate }}</label>
            <div class="mt-2 flex items-center gap-4">
              <img [src]="displayImageUrl()" alt="" class="h-16 w-16 rounded-lg object-cover" />
              <label
                class="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {{ uploading() ? '…' : ('admin.categories.uploadImage' | translate) }}
                <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
              </label>
            </div>
          </div>
        }

        <div class="flex justify-end gap-3">
          <a
            routerLink="/admin/categories"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {{ 'common.cancel' | translate }}
          </a>
          <button
            type="submit"
            [disabled]="saving()"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            @if (saving()) {
              <app-loading-spinner [size]="16" variant="white" />
            }
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CategoryFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly translateService = inject(TranslateService);

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly isEdit = signal(false);
  protected readonly groups = signal<CategoryGroup[]>([]);
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly displayImageUrl = computed(() => categoryImageUrl({ imageUrl: this.imageUrl() }));

  protected readonly form = this.fb.nonNullable.group({
    groupId: ['', Validators.required],
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    descriptionEn: ['', Validators.required],
    descriptionAr: ['', Validators.required],
    order: [0],
    active: [true],
  });

  private categoryId = '';

  ngOnInit(): void {
    this.adminService.getCategoryGroups().subscribe((groups) => this.groups.set(groups));

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.categoryId = id;
      this.adminService.getCategory(id).subscribe({
        next: (category) => {
          this.form.patchValue(category);
          this.imageUrl.set(category.imageUrl);
        },
        error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not load the category.')),
      });
    }
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.categoryId) return;

    this.uploading.set(true);
    this.adminService.uploadCategoryImage(this.categoryId, file).subscribe({
      next: (category) => {
        this.imageUrl.set(category.imageUrl);
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
      ? this.adminService.updateCategory(this.categoryId, payload)
      : this.adminService.createCategory(payload);

    request.subscribe({
      next: () => {
        this.toastService.success('Category saved.');
        this.router.navigateByUrl('/admin/categories');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save the category.'));
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HelperToolTiming } from '../../../../core/models/helper-tool.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { helperToolIconUrl } from '../../../../shared/utils/helper-tool-icon';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-helper-tool-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl">
      <h1 class="text-2xl font-bold text-slate-900">
        {{ (isEdit() ? 'admin.helperTools.edit' : 'admin.helperTools.add') | translate }}
      </h1>

      <form class="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div class="flex items-center gap-4">
          <img [src]="displayIconUrl()" alt="" class="h-16 w-16 rounded-full border-2 border-primary-soft object-cover" />
          @if (isEdit()) {
            <label
              class="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {{ uploading() ? '…' : ('admin.helperTools.uploadImage' | translate) }}
              <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="onImageSelected($event)" />
            </label>
          } @else {
            <p class="text-xs text-slate-400">{{ 'admin.helperTools.uploadAfterCreate' | translate }}</p>
          }
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.helperTools.key' | translate }}</label>
          <input
            type="text"
            formControlName="key"
            placeholder="trap, hole, double_answer, ..."
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono disabled:bg-slate-50 disabled:text-slate-400"
          />
          @if (!isEdit()) {
            <p class="mt-1 text-xs text-slate-400">{{ 'admin.helperTools.keyHint' | translate }}</p>
          }
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.helperTools.nameEn' | translate }}</label>
            <input type="text" formControlName="nameEn" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div dir="rtl">
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.helperTools.nameAr' | translate }}</label>
            <input type="text" formControlName="nameAr" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.helperTools.descriptionEn' | translate }}</label>
            <textarea formControlName="descriptionEn" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
          </div>
          <div dir="rtl">
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.helperTools.descriptionAr' | translate }}</label>
            <textarea formControlName="descriptionAr" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.helperTools.timing' | translate }}</label>
            <select formControlName="timing" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="BEFORE_ONLY">{{ 'admin.helperTools.beforeOnly' | translate }}</option>
              <option value="BEFORE_OR_DURING">{{ 'admin.helperTools.beforeOrDuring' | translate }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.helperTools.order' | translate }}</label>
            <input type="number" formControlName="order" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 rounded border-slate-300" />
          <label for="active" class="text-sm text-slate-700">{{ 'common.active' | translate }}</label>
        </div>

        <div class="flex justify-end gap-3">
          <a
            routerLink="/admin/helper-tools"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {{ 'common.cancel' | translate }}
          </a>
          <button
            type="submit"
            [disabled]="saving()"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class HelperToolFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly isEdit = signal(false);
  protected readonly iconUrl = signal<string | null>(null);
  protected readonly currentKey = signal('trap');
  protected readonly displayIconUrl = computed(() => helperToolIconUrl({ iconUrl: this.iconUrl(), key: this.currentKey() }));

  protected readonly form = this.fb.nonNullable.group({
    key: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*$/)]],
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    descriptionEn: ['', Validators.required],
    descriptionAr: ['', Validators.required],
    timing: ['BEFORE_OR_DURING' as HelperToolTiming, Validators.required],
    order: [0],
    active: [true],
  });

  private toolId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.toolId = id;
      this.adminService.getHelperTool(id).subscribe({
        next: (tool) => {
          this.form.patchValue(tool);
          this.form.controls.key.disable();
          this.iconUrl.set(tool.iconUrl);
          this.currentKey.set(tool.key);
        },
        error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not load the helper tool.')),
      });
    }
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.toolId) return;

    this.uploading.set(true);
    this.adminService.uploadHelperToolImage(this.toolId, file).subscribe({
      next: (tool) => {
        this.iconUrl.set(tool.iconUrl);
        this.uploading.set(false);
      },
      error: (err: unknown) => {
        this.uploading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not upload the icon.'));
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { key, ...rest } = this.form.getRawValue();
    const request = this.isEdit() ? this.adminService.updateHelperTool(this.toolId, rest) : this.adminService.createHelperTool({ key, ...rest });

    request.subscribe({
      next: () => {
        this.toastService.success('Helper tool saved.');
        this.router.navigateByUrl('/admin/helper-tools');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save the helper tool.'));
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-category-group-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-xl">
      <h1 class="text-2xl font-bold text-slate-900">
        {{ (isEdit() ? 'admin.categoryGroups.edit' : 'admin.categoryGroups.add') | translate }}
      </h1>

      <form class="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.categoryGroups.nameEn' | translate }}</label>
          <input
            type="text"
            formControlName="nameEn"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div dir="rtl">
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.categoryGroups.nameAr' | translate }}</label>
          <input
            type="text"
            formControlName="nameAr"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.categoryGroups.order' | translate }}</label>
          <input
            type="number"
            formControlName="order"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div class="flex items-center gap-2">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 rounded border-slate-300" />
          <label for="active" class="text-sm text-slate-700">{{ 'common.active' | translate }}</label>
        </div>

        <div class="flex justify-end gap-3">
          <a
            routerLink="/admin/category-groups"
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
export class CategoryGroupFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly isEdit = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    order: [0],
    active: [true],
  });

  private groupId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.groupId = id;
      this.adminService.getCategoryGroup(id).subscribe({
        next: (group) => this.form.patchValue(group),
        error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not load the category group.')),
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.form.getRawValue();
    const request = this.isEdit()
      ? this.adminService.updateCategoryGroup(this.groupId, payload)
      : this.adminService.createCategoryGroup(payload);

    request.subscribe({
      next: () => {
        this.toastService.success('Category group saved.');
        this.router.navigateByUrl('/admin/category-groups');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save the category group.'));
      },
    });
  }
}

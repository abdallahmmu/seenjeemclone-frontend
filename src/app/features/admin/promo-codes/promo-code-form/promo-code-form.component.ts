import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-promo-code-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-xl">
      <h1 class="text-2xl font-bold text-slate-900">{{ (isEdit() ? 'admin.promoCodes.edit' : 'admin.promoCodes.add') | translate }}</h1>

      <form class="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.promoCodes.code' | translate }}</label>
          <input type="text" formControlName="code" [readonly]="isEdit()" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase disabled:bg-slate-100" [class.bg-slate-100]="isEdit()" />
        </div>

        @if (!isEdit()) {
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.promoCodes.type' | translate }}</label>
            <select formControlName="type" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="PERCENTAGE">{{ 'admin.promoCodes.typePercentage' | translate }}</option>
              <option value="FLAT_CREDITS">{{ 'admin.promoCodes.typeFlatCredits' | translate }}</option>
            </select>
          </div>
        }

        @if (form.controls.type.value === 'PERCENTAGE') {
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.promoCodes.discountPercent' | translate }}</label>
            <input type="number" formControlName="discountPercent" min="1" max="100" class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        } @else {
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.promoCodes.creditAmount' | translate }}</label>
            <input type="number" formControlName="creditAmount" min="1" class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        }

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.promoCodes.maxRedemptions' | translate }}</label>
          <select formControlName="maxRedemptionsPerUser" class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option [value]="1">{{ 'admin.promoCodes.once' | translate }}</option>
            <option [value]="2">{{ 'admin.promoCodes.twice' | translate }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.promoCodes.target' | translate }}</label>
          <input type="text" formControlName="targetUserHandle" [placeholder]="'admin.promoCodes.targetPlaceholder' | translate" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.promoCodes.expiresAt' | translate }}</label>
          <input type="date" formControlName="expiresAt" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div class="flex items-center gap-2">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 rounded border-slate-300" />
          <label for="active" class="text-sm text-slate-700">{{ 'common.active' | translate }}</label>
        </div>

        <div class="flex justify-end gap-3">
          <a routerLink="/admin/promo-codes" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{{ 'common.cancel' | translate }}</a>
          <button type="submit" [disabled]="saving()" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            @if (saving()) { <app-loading-spinner [size]="16" variant="white" /> }
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class PromoCodeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly isEdit = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    type: ['PERCENTAGE' as 'PERCENTAGE' | 'FLAT_CREDITS'],
    discountPercent: [10],
    creditAmount: [5],
    maxRedemptionsPerUser: [1],
    targetUserHandle: [''],
    expiresAt: [''],
    active: [true],
  });

  private codeId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.codeId = id;
      this.form.controls.code.disable();
      this.adminService.getPromoCode(id).subscribe({
        next: (code) => {
          this.form.patchValue({
            code: code.code,
            type: code.type,
            discountPercent: code.discountPercent ?? 10,
            creditAmount: code.creditAmount ?? 5,
            maxRedemptionsPerUser: code.maxRedemptionsPerUser,
            targetUserHandle: code.targetUser?.handle ?? '',
            expiresAt: code.expiresAt ? code.expiresAt.slice(0, 10) : '',
            active: code.active,
          });
        },
        error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not load the promo code.')),
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const targetUserHandle = value.targetUserHandle.trim() || null;
    const expiresAt = value.expiresAt ? new Date(value.expiresAt).toISOString() : null;

    const request = this.isEdit()
      ? this.adminService.updatePromoCode(this.codeId, {
          ...(value.type === 'PERCENTAGE' ? { discountPercent: value.discountPercent } : { creditAmount: value.creditAmount }),
          maxRedemptionsPerUser: value.maxRedemptionsPerUser,
          targetUserHandle,
          expiresAt,
          active: value.active,
        })
      : this.adminService.createPromoCode({
          code: value.code,
          type: value.type,
          ...(value.type === 'PERCENTAGE' ? { discountPercent: value.discountPercent } : { creditAmount: value.creditAmount }),
          maxRedemptionsPerUser: value.maxRedemptionsPerUser,
          targetUserHandle,
          expiresAt,
          active: value.active,
        });

    request.subscribe({
      next: () => {
        this.toastService.success('Promo code saved.');
        this.router.navigateByUrl('/admin/promo-codes');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save the promo code.'));
      },
    });
  }
}

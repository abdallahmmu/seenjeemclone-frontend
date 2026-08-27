import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PromoCodeService } from '../../services/promo-code.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ToastService } from '../../services/toast.service';
import { apiErrorMessage } from '../../utils/api-error';
import { TranslateService } from '../../../core/services/translate.service';

/** "Have a promo code?" dialog — opened from the header dropdown, redeems a code, and patches currentUser when credits were granted immediately. */
@Component({
  selector: 'app-promo-code-dialog',
  imports: [FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" (click)="closed.emit()">
        <div class="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <svg viewBox="0 0 24 24" fill="none" class="mx-auto h-16 w-16 text-primary">
            <path
              d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6M22 7H2v5h20V7ZM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <h2 class="mt-3 text-lg font-semibold text-slate-900">{{ 'promoCode.title' | translate }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ 'promoCode.subtitle' | translate }}</p>

          <input
            type="text"
            [(ngModel)]="code"
            [placeholder]="'promoCode.placeholder' | translate"
            class="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm uppercase tracking-wide"
            (keyup.enter)="submit()"
          />

          <div class="mt-5 flex justify-center gap-3">
            <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100" (click)="closed.emit()">
              {{ 'common.cancel' | translate }}
            </button>
            <button
              type="button"
              [disabled]="!code.trim() || submitting()"
              class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              (click)="submit()"
            >
              {{ 'promoCode.submit' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PromoCodeDialogComponent {
  private readonly promoCodeService = inject(PromoCodeService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly translateService = inject(TranslateService);

  readonly open = input(false);
  readonly closed = output<void>();

  protected code = '';
  protected readonly submitting = signal(false);

  protected submit(): void {
    const code = this.code.trim();
    if (!code || this.submitting()) return;

    this.submitting.set(true);
    this.promoCodeService.redeem(code).subscribe({
      next: ({ user, redemption }) => {
        this.submitting.set(false);
        this.authService.setCurrentUser(user);
        this.code = '';
        this.closed.emit();
        this.toastService.success(
          redemption.creditsGranted
            ? this.translateService.t('promoCode.creditsGranted', { credits: redemption.creditsGranted })
            : this.translateService.t('promoCode.discountBanked', { percent: redemption.discountPercent ?? 0 }),
        );
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not redeem this promo code.'));
      },
    });
  }
}

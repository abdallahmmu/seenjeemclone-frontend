import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import {
  passwordRequirements,
  passwordsMatchValidator,
  passwordStrengthValidator,
} from '../../../shared/validators/password.validator';

@Component({
  selector: 'app-accept-invite',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-bg px-4 py-12">
      <div class="w-full max-w-sm">
        <div class="nb-card p-8">
          <h1 class="nb-heading text-2xl text-ink">{{ 'auth.acceptInvite.title' | translate }}</h1>
          <p class="mt-1 text-sm text-ink-soft">{{ 'auth.acceptInvite.subtitle' | translate }}</p>

          @if (!token()) {
            <p class="nb-badge nb-badge-soft mt-6 w-full justify-center py-3 text-sm normal-case">
              {{ 'auth.acceptInvite.missingToken' | translate }}
            </p>
          } @else {
            <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
              <div>
                <label for="password" class="block text-sm font-semibold text-ink">{{
                  'auth.register.password' | translate
                }}</label>
                <input id="password" type="password" formControlName="password" autocomplete="new-password" class="nb-input mt-1" />
                @if (form.controls.password.value.length > 0 || form.controls.password.touched) {
                  <ul class="mt-2 space-y-0.5">
                    @for (requirement of checklist(); track requirement.key) {
                      <li
                        class="flex items-center gap-1.5 text-xs font-medium"
                        [class]="requirement.met ? 'text-emerald-700' : 'text-ink-soft'"
                      >
                        <span>{{ requirement.met ? '✓' : '○' }}</span>
                        {{ ('common.passwordRequirements.' + requirement.key) | translate }}
                      </li>
                    }
                  </ul>
                }
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-semibold text-ink">{{
                  'auth.register.confirmPassword' | translate
                }}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  class="nb-input mt-1"
                />
                @if (form.errors?.['passwordMismatch'] && form.controls.confirmPassword.touched) {
                  <p class="mt-1 text-xs font-semibold text-primary">{{ 'common.passwordMismatch' | translate }}</p>
                }
              </div>

              <button type="submit" [disabled]="submitting()" class="nb-btn nb-btn-primary w-full py-2.5 text-sm">
                @if (submitting()) {
                  <app-loading-spinner [size]="16" variant="white" />
                }
                {{ 'auth.acceptInvite.submit' | translate }}
              </button>
            </form>
          }

          <p class="mt-6 text-center text-sm text-ink-soft">
            <a routerLink="/login" class="nb-link">{{ 'auth.backToLogin' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AcceptInviteComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly token = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected checklist() {
    return passwordRequirements(this.form.controls.password.value);
  }

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
  }

  protected submit(): void {
    const token = this.token();
    if (!token || this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authService.acceptInvite({ token, password: this.form.getRawValue().password }).subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toastService.error(apiErrorMessage(err, 'This invite link is invalid or has expired.'));
      },
    });
  }
}

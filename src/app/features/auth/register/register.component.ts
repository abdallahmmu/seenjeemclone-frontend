import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div class="w-full max-w-sm">
        <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 class="text-2xl font-bold text-slate-900">{{ 'auth.register.title' | translate }}</h1>
          <p class="mt-1 text-sm text-slate-500">{{ 'auth.register.subtitle' | translate }}</p>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label for="email" class="block text-sm font-medium text-slate-700">{{
                'auth.register.email' | translate
              }}</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <p class="mt-1 text-xs text-red-600">
                  {{ (form.controls.email.errors?.['required'] ? 'common.required' : 'common.invalidEmail') | translate }}
                </p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-700">{{
                'auth.register.password' | translate
              }}</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              @if (form.controls.password.value.length > 0 || form.controls.password.touched) {
                <ul class="mt-2 space-y-0.5">
                  @for (requirement of checklist(); track requirement.key) {
                    <li
                      class="flex items-center gap-1.5 text-xs"
                      [class]="requirement.met ? 'text-emerald-600' : 'text-slate-400'"
                    >
                      <span>{{ requirement.met ? '✓' : '○' }}</span>
                      {{ ('common.passwordRequirements.' + requirement.key) | translate }}
                    </li>
                  }
                </ul>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-slate-700">{{
                'auth.register.confirmPassword' | translate
              }}</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              @if (form.errors?.['passwordMismatch'] && form.controls.confirmPassword.touched) {
                <p class="mt-1 text-xs text-red-600">{{ 'common.passwordMismatch' | translate }}</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="submitting()"
              class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              @if (submitting()) {
                <app-loading-spinner [size]="16" variant="white" />
              }
              {{ 'auth.register.submit' | translate }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            {{ 'auth.register.haveAccount' | translate }}
            <a routerLink="/login" class="font-medium text-primary hover:underline">{{
              'auth.register.loginLink' | translate
            }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected checklist() {
    return passwordRequirements(this.form.controls.password.value);
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    this.authService.register({ email, password }).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not create your account.'));
      },
    });
  }
}

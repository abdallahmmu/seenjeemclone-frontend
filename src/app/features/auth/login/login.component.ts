import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div class="w-full max-w-sm">
        <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 class="text-2xl font-bold text-slate-900">{{ 'auth.login.title' | translate }}</h1>
          <p class="mt-1 text-sm text-slate-500">{{ 'auth.login.subtitle' | translate }}</p>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label for="email" class="block text-sm font-medium text-slate-700">{{
                'auth.login.email' | translate
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
                'auth.login.password' | translate
              }}</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <p class="mt-1 text-xs text-red-600">{{ 'common.required' | translate }}</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="submitting()"
              class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {{ 'auth.login.submit' | translate }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            {{ 'auth.login.noAccount' | translate }}
            <a routerLink="/register" class="font-medium text-primary hover:underline">{{
              'auth.login.registerLink' | translate
            }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/';
        this.router.navigateByUrl(redirectTo);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toastService.error(apiErrorMessage(err, 'Invalid email or password.'));
      },
    });
  }
}

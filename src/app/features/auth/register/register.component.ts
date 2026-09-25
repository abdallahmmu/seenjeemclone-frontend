import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-sign-in-button/google-sign-in-button.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import {
  passwordRequirements,
  passwordsMatchValidator,
  passwordStrengthValidator,
} from '../../../shared/validators/password.validator';

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export type HandleStatus = 'idle' | 'checking' | 'available' | 'taken';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LoadingSpinnerComponent, GoogleSignInButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-bg px-4 py-12">
      <div class="w-full max-w-sm">
        <div class="nb-card p-8">
          <h1 class="nb-heading text-2xl text-ink">{{ 'auth.register.title' | translate }}</h1>
          <p class="mt-1 text-sm text-ink-soft">{{ 'auth.register.subtitle' | translate }}</p>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label for="handle" class="block text-sm font-semibold text-ink">{{
                'auth.register.handle' | translate
              }}</label>
              <input
                id="handle"
                type="text"
                formControlName="handle"
                maxlength="20"
                autocomplete="username"
                (input)="onHandleInput($event)"
                class="nb-input mt-1"
              />
              @if (form.controls.handle.invalid && form.controls.handle.touched) {
                <p class="mt-1 text-xs font-semibold text-primary">{{ 'auth.register.handleInvalid' | translate }}</p>
              } @else if (handleStatus() === 'checking') {
                <p class="mt-1 text-xs text-ink-soft">{{ 'auth.register.handleChecking' | translate }}</p>
              } @else if (handleStatus() === 'taken') {
                <p class="mt-1 text-xs font-semibold text-primary">{{ 'auth.register.handleTaken' | translate }}</p>
              } @else if (handleStatus() === 'available') {
                <p class="mt-1 text-xs font-semibold text-emerald-700">{{ 'auth.register.handleAvailable' | translate }}</p>
              }
            </div>

            <div>
              <label for="email" class="block text-sm font-semibold text-ink">{{
                'auth.register.email' | translate
              }}</label>
              <input id="email" type="email" formControlName="email" autocomplete="email" class="nb-input mt-1" />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <p class="mt-1 text-xs font-semibold text-primary">
                  {{ (form.controls.email.errors?.['required'] ? 'common.required' : 'common.invalidEmail') | translate }}
                </p>
              }
            </div>

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
              {{ 'auth.register.submit' | translate }}
            </button>
          </form>

          <div class="mt-6 flex items-center gap-3 text-xs font-semibold text-ink-soft">
            <span class="h-0.5 flex-1 bg-ink"></span>
            {{ 'common.or' | translate }}
            <span class="h-0.5 flex-1 bg-ink"></span>
          </div>

          <div class="mt-4 flex justify-center">
            <app-google-sign-in-button text="signup_with" (credential)="onGoogleCredential($event)" />
          </div>

          <p class="mt-6 text-center text-sm text-ink-soft">
            {{ 'auth.register.haveAccount' | translate }}
            <a routerLink="/login" class="nb-link">{{ 'auth.register.loginLink' | translate }}</a>
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
  protected readonly handleStatus = signal<HandleStatus>('idle');

  protected readonly form = this.fb.nonNullable.group(
    {
      handle: ['', [Validators.required, Validators.pattern(HANDLE_PATTERN)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  constructor() {
    this.form.controls.handle.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((handle) => {
          if (!HANDLE_PATTERN.test(handle)) {
            this.handleStatus.set('idle');
            return [];
          }
          this.handleStatus.set('checking');
          return this.authService.checkHandleAvailability(handle);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((available) => this.handleStatus.set(available ? 'available' : 'taken'));
  }

  /** Sanitizes as-you-type into handleField's charset — never surfaces an "invalid character" error, just strips it. */
  protected onHandleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (sanitized !== input.value) {
      input.value = sanitized;
    }
    this.form.controls.handle.setValue(sanitized);
  }

  protected checklist() {
    return passwordRequirements(this.form.controls.password.value);
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting() || this.handleStatus() === 'taken') {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { handle, email, password } = this.form.getRawValue();
    this.authService.register({ handle, email, password }).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not create your account.'));
      },
    });
  }

  protected onGoogleCredential(idToken: string): void {
    if (this.submitting()) return;

    this.submitting.set(true);
    this.authService.loginWithGoogle({ idToken }).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not sign in with Google.'));
      },
    });
  }
}

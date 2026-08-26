import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

type HandleStatus = 'idle' | 'checking' | 'available' | 'taken';

@Component({
  selector: 'app-profile-settings',
  imports: [ReactiveFormsModule, TranslatePipe, LoadingSpinnerComponent, UserAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-lg px-4 py-10">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'profile.title' | translate }}</h1>
      <p class="mt-1 text-sm text-slate-500">{{ 'profile.subtitle' | translate }}</p>

      <div class="mt-6 flex items-center gap-4">
        <app-user-avatar
          [avatarUrl]="authService.currentUser()?.avatarUrl ?? null"
          [handle]="authService.currentUser()?.handle ?? ''"
          [size]="64"
        />
        <label class="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          @if (uploadingAvatar()) {
            <app-loading-spinner [size]="14" />
          } @else {
            {{ 'profile.changeAvatar' | translate }}
          }
          <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="onAvatarSelected($event)" />
        </label>
      </div>

      <form class="mt-8 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label for="handle" class="block text-sm font-medium text-slate-700">{{ 'profile.handle' | translate }}</label>
          <input
            id="handle"
            type="text"
            formControlName="handle"
            maxlength="20"
            autocomplete="username"
            (input)="onHandleInput($event)"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          @if (form.controls.handle.invalid && form.controls.handle.touched) {
            <p class="mt-1 text-xs text-red-600">{{ 'auth.register.handleInvalid' | translate }}</p>
          } @else if (handleStatus() === 'checking') {
            <p class="mt-1 text-xs text-slate-400">{{ 'auth.register.handleChecking' | translate }}</p>
          } @else if (handleStatus() === 'taken') {
            <p class="mt-1 text-xs text-red-600">{{ 'auth.register.handleTaken' | translate }}</p>
          } @else if (handleStatus() === 'available') {
            <p class="mt-1 text-xs text-emerald-600">{{ 'auth.register.handleAvailable' | translate }}</p>
          }
        </div>

        <div>
          <label for="bio" class="block text-sm font-medium text-slate-700">{{ 'profile.bio' | translate }}</label>
          <textarea
            id="bio"
            formControlName="bio"
            maxlength="280"
            rows="3"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          ></textarea>
          <p class="mt-1 text-end text-xs text-slate-400">{{ form.controls.bio.value.length }}/280</p>
        </div>

        <div>
          <label for="mobile" class="block text-sm font-medium text-slate-700">{{ 'profile.mobile' | translate }}</label>
          <input
            id="mobile"
            type="tel"
            formControlName="mobile"
            maxlength="20"
            autocomplete="tel"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          [disabled]="saving()"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          @if (saving()) {
            <app-loading-spinner [size]="16" variant="white" />
          }
          {{ 'common.save' | translate }}
        </button>
      </form>
    </div>
  `,
})
export class ProfileSettingsComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly uploadingAvatar = signal(false);
  protected readonly handleStatus = signal<HandleStatus>('idle');

  private readonly ownHandle = this.authService.currentUser()?.handle ?? '';

  protected readonly form = this.fb.nonNullable.group({
    handle: [this.ownHandle, [Validators.required, Validators.pattern(HANDLE_PATTERN)]],
    bio: [this.authService.currentUser()?.bio ?? ''],
    mobile: [this.authService.currentUser()?.mobile ?? ''],
  });

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
          if (handle === this.ownHandle) {
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

  protected onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingAvatar.set(true);
    this.authService.uploadAvatar(file).subscribe({
      next: () => this.uploadingAvatar.set(false),
      error: (err: unknown) => {
        this.uploadingAvatar.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not upload the avatar.'));
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.saving() || this.handleStatus() === 'taken') {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { handle, bio, mobile } = this.form.getRawValue();
    this.authService.updateProfile({ handle, bio, mobile }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success('Profile updated.');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not update your profile.'));
      },
    });
  }
}

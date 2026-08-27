import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ManagedUser } from '../../../../core/models/managed-user.model';
import { UserRole } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-xl">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.users.edit' | translate }}</h1>

      @if (loading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner [size]="28" /></div>
      } @else {
        <form class="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="saveProfile()">
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.users.handle' | translate }}</label>
            <input type="text" formControlName="handle" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'common.email' | translate }}</label>
            <input type="email" formControlName="email" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.users.bio' | translate }}</label>
            <textarea formControlName="bio" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.users.mobile' | translate }}</label>
            <input type="text" formControlName="mobile" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div class="flex justify-end gap-3">
            <a routerLink="/admin/users" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{{ 'common.cancel' | translate }}</a>
            <button type="submit" [disabled]="saving()" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
              @if (saving()) { <app-loading-spinner [size]="16" variant="white" /> }
              {{ 'common.save' | translate }}
            </button>
          </div>
        </form>

        <div class="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 class="text-sm font-semibold text-slate-700">{{ 'admin.users.credits' | translate }}</h2>
          <p class="mt-1 text-2xl font-bold text-slate-900">{{ user()?.credits ?? 0 }}</p>
          <div class="mt-3 flex items-center gap-2">
            <input
              type="number"
              [value]="creditsDelta()"
              (input)="creditsDelta.set($any($event.target).valueAsNumber || 0)"
              class="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="+/- amount"
            />
            <button
              type="button"
              [disabled]="!creditsDelta() || adjustingCredits()"
              class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              (click)="applyCredits()"
            >
              {{ 'admin.users.applyCredits' | translate }}
            </button>
          </div>
          <p class="mt-1 text-xs text-slate-400">{{ 'admin.users.creditsHint' | translate }}</p>
        </div>

        @if (!isSelf()) {
          <div class="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <h2 class="text-sm font-semibold text-slate-700">{{ 'common.role' | translate }}</h2>
            <select
              class="mt-2 w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              [value]="user()?.role"
              (change)="setRole($any($event.target).value)"
            >
              <option value="PLAYER">PLAYER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          <div class="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <h2 class="text-sm font-semibold text-slate-700">{{ 'common.status' | translate }}</h2>
            <p class="mt-1 text-sm text-slate-500">{{ (user()?.isActive ? 'common.active' : 'common.inactive') | translate }}</p>
            <button
              type="button"
              class="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              (click)="toggleActive()"
            >
              {{ (user()?.isActive ? 'admin.admins.deactivate' : 'admin.users.activate') | translate }}
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly adjustingCredits = signal(false);
  protected readonly user = signal<ManagedUser | null>(null);
  protected readonly creditsDelta = signal(0);

  protected readonly isSelf = computed(() => this.user()?.id === this.authService.currentUser()?.id);

  protected readonly form = this.fb.nonNullable.group({
    handle: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    bio: [''],
    mobile: [''],
  });

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    this.adminService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.form.patchValue({ handle: user.handle, email: user.email, bio: user.bio ?? '', mobile: user.mobile ?? '' });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load this user.'));
      },
    });
  }

  protected saveProfile(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.adminService.updateUser(this.userId, this.form.getRawValue()).subscribe({
      next: (user) => {
        this.user.set(user);
        this.saving.set(false);
        this.toastService.success('User updated.');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not update this user.'));
      },
    });
  }

  protected applyCredits(): void {
    const delta = this.creditsDelta();
    if (!delta || this.adjustingCredits()) return;

    this.adjustingCredits.set(true);
    this.adminService.adjustUserCredits(this.userId, delta).subscribe({
      next: (user) => {
        this.user.set(user);
        this.adjustingCredits.set(false);
        this.creditsDelta.set(0);
        this.toastService.success('Credits updated.');
      },
      error: (err: unknown) => {
        this.adjustingCredits.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not adjust credits.'));
      },
    });
  }

  protected setRole(role: UserRole): void {
    this.adminService.setUserRole(this.userId, role).subscribe({
      next: (user) => {
        this.user.set(user);
        this.toastService.success('Role updated.');
      },
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the role.')),
    });
  }

  protected toggleActive(): void {
    const current = this.user();
    if (!current) return;

    this.adminService.setUserActive(this.userId, !current.isActive).subscribe({
      next: (user) => this.user.set(user),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update this user.')),
    });
  }
}

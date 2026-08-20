import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { SuperAdminService } from '../services/super-admin.service';

interface FeatureFlagRow {
  key: string;
  value: boolean;
}

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.settings.title' | translate }}</h1>

      @if (!loading()) {
        <form class="mt-6 space-y-8 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
          <div formGroupName="lifelineConfig">
            <h2 class="text-sm font-semibold text-slate-700">{{ 'admin.settings.lifelines' | translate }}</h2>
            <div class="mt-3 space-y-2">
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" formControlName="trapEnabled" class="h-4 w-4 rounded border-slate-300" />
                {{ 'admin.settings.trapEnabled' | translate }}
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" formControlName="holeEnabled" class="h-4 w-4 rounded border-slate-300" />
                {{ 'admin.settings.holeEnabled' | translate }}
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" formControlName="doubleAnswerEnabled" class="h-4 w-4 rounded border-slate-300" />
                {{ 'admin.settings.doubleAnswerEnabled' | translate }}
              </label>
            </div>
          </div>

          <div formGroupName="difficultyWeighting">
            <h2 class="text-sm font-semibold text-slate-700">{{ 'admin.settings.difficultyWeighting' | translate }}</h2>
            <div class="mt-3 grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-slate-500">{{ 'admin.settings.easy' | translate }}</label>
                <input
                  type="number"
                  step="0.1"
                  formControlName="easy"
                  class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-500">{{ 'admin.settings.medium' | translate }}</label>
                <input
                  type="number"
                  step="0.1"
                  formControlName="medium"
                  class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-500">{{ 'admin.settings.hard' | translate }}</label>
                <input
                  type="number"
                  step="0.1"
                  formControlName="hard"
                  class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-sm font-semibold text-slate-700">{{ 'admin.settings.featureFlags' | translate }}</h2>
            <div class="mt-3 space-y-2">
              @for (flag of featureFlags(); track flag.key) {
                <div class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <label class="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      [checked]="flag.value"
                      (change)="toggleFlag(flag.key)"
                      class="h-4 w-4 rounded border-slate-300"
                    />
                    {{ flag.key }}
                  </label>
                  <button
                    type="button"
                    class="text-xs font-semibold text-red-500 hover:text-red-700"
                    (click)="removeFlag(flag.key)"
                  >
                    ✕
                  </button>
                </div>
              }
            </div>
            <div class="mt-3 flex gap-2">
              <input
                type="text"
                [value]="newFlagName()"
                (input)="newFlagName.set($any($event.target).value)"
                [placeholder]="'admin.settings.flagName' | translate"
                class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                (click)="addFlag()"
              >
                {{ 'admin.settings.addFlag' | translate }}
              </button>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="saving()"
              class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {{ 'admin.settings.save' | translate }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly superAdminService = inject(SuperAdminService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly featureFlags = signal<FeatureFlagRow[]>([]);
  protected readonly newFlagName = signal('');

  protected readonly form = this.fb.nonNullable.group({
    lifelineConfig: this.fb.nonNullable.group({
      trapEnabled: [true],
      holeEnabled: [true],
      doubleAnswerEnabled: [true],
    }),
    difficultyWeighting: this.fb.nonNullable.group({
      easy: [1, [Validators.required, Validators.min(0.01)]],
      medium: [1, [Validators.required, Validators.min(0.01)]],
      hard: [1, [Validators.required, Validators.min(0.01)]],
    }),
  });

  ngOnInit(): void {
    this.superAdminService.getSettings().subscribe({
      next: (settings) => {
        this.form.patchValue({
          lifelineConfig: settings.lifelineConfig,
          difficultyWeighting: settings.difficultyWeighting,
        });
        this.featureFlags.set(Object.entries(settings.featureFlags).map(([key, value]) => ({ key, value })));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load settings.'));
      },
    });
  }

  protected addFlag(): void {
    const key = this.newFlagName().trim();
    if (!key || this.featureFlags().some((f) => f.key === key)) return;
    this.featureFlags.update((flags) => [...flags, { key, value: true }]);
    this.newFlagName.set('');
  }

  protected toggleFlag(key: string): void {
    this.featureFlags.update((flags) => flags.map((f) => (f.key === key ? { ...f, value: !f.value } : f)));
  }

  protected removeFlag(key: string): void {
    this.featureFlags.update((flags) => flags.filter((f) => f.key !== key));
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const featureFlags = Object.fromEntries(this.featureFlags().map((f) => [f.key, f.value]));

    this.superAdminService
      .updateSettings({
        lifelineConfig: value.lifelineConfig,
        difficultyWeighting: value.difficultyWeighting,
        featureFlags,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.success('Settings saved.');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.toastService.error(apiErrorMessage(err, 'Could not save settings.'));
        },
      });
  }
}

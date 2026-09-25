import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Category } from '../../../core/models/category.model';
import { CreateGameSessionRequest, GAME_CATEGORIES_COUNT, GameSessionSummary } from '../../../core/models/game.model';
import { HelperTool, WIRED_HELPER_TOOL_KEYS, WiredHelperToolKey } from '../../../core/models/helper-tool.model';
import { AuthService } from '../../../core/services/auth.service';
import { HelperToolService } from '../../../core/services/helper-tool.service';
import { TranslateService } from '../../../core/services/translate.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { categoryImageUrl } from '../../../shared/utils/category-image';
import { helperToolIconUrl } from '../../../shared/utils/helper-tool-icon';
import { GameStateService } from '../services/game-state.service';
import { GameService } from '../services/game.service';

/** Binds a catalog row's `key` to the real form control it controls (see game.model.ts's Team flags). */
const CONTROL_NAME_BY_KEY: Record<WiredHelperToolKey, 'hasTrap' | 'hasHole' | 'hasDoubleAnswer'> = {
  trap: 'hasTrap',
  hole: 'hasHole',
  double_answer: 'hasDoubleAnswer',
};

@Component({
  selector: 'app-game-setup',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl bg-bg px-4 py-10">
      <h1 class="nb-heading animate-fade-in-up text-3xl text-ink">{{ 'game.setup.title' | translate }}</h1>
      <p class="animate-fade-in-up mt-1 text-sm text-ink-soft" style="animation-delay: 0.05s">
        {{ 'game.setup.subtitle' | translate }}
      </p>

      @if (!isEmailVerified()) {
        <div class="nb-card animate-fade-in-up mt-6 flex flex-wrap items-center justify-between gap-3 bg-secondary-soft p-4">
          <div class="flex items-center gap-3">
            <span class="text-xl">✉️</span>
            <p class="text-sm font-semibold text-ink">{{ 'game.setup.verifyEmailBanner' | translate }}</p>
          </div>
          <button type="button" class="nb-btn nb-btn-outline px-3 py-1.5 text-xs" [disabled]="resendingVerification()" (click)="resendVerification()">
            @if (resendingVerification()) {
              <app-loading-spinner [size]="14" />
            }
            {{ 'game.setup.resendVerification' | translate }}
          </button>
        </div>
      }

      @if (activeSession(); as session) {
        <div class="nb-card animate-fade-in-up mt-6 flex flex-wrap items-center justify-between gap-3 bg-primary-soft p-4">
          <div class="flex items-center gap-3">
            <span class="text-xl">🎮</span>
            <p class="text-sm font-semibold text-primary-dark">
              {{ 'game.setup.activeGameBanner' | translate: { name: session.name } }}
            </p>
          </div>
          <a [routerLink]="['/play', session.id]" class="nb-btn nb-btn-primary px-3 py-1.5 text-xs">
            {{ 'game.setup.resumeGame' | translate }}
          </a>
        </div>
      }

      <form class="mt-8 space-y-8" [formGroup]="form" (ngSubmit)="submit()">
        <div class="nb-card animate-fade-in-up p-6" style="animation-delay: 0.1s">
          <label class="block text-sm font-semibold text-ink">{{ 'game.setup.name' | translate }}</label>
          <input type="text" formControlName="name" class="nb-input mt-1" />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <p class="mt-1 text-xs font-semibold text-primary">{{ 'common.required' | translate }}</p>
          }
        </div>

        <div class="nb-card animate-fade-in-up p-6" style="animation-delay: 0.15s">
          <div class="flex items-center justify-between">
            <h2 class="nb-heading text-base text-ink">{{ 'game.setup.categories' | translate }}</h2>
            <span
              class="nb-badge normal-case"
              [class]="
                selectedCategoryIds().length === categoriesCount ? 'nb-badge-secondary' : 'nb-badge-soft'
              "
            >
              {{ selectedCategoryIds().length }} / {{ categoriesCount }}
            </span>
          </div>

          @if (loadingCategories()) {
            <app-loading-spinner [size]="28" />
          } @else {
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              @for (category of categories(); track category.id; let i = $index) {
                <button
                  type="button"
                  class="animate-pop-in flex flex-col items-center gap-2 rounded-lg border-2 border-ink p-3 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  [style.animation-delay.ms]="i * 40"
                  [class]="isCategorySelected(category.id) ? 'bg-primary-soft shadow-[3px_3px_0_var(--color-ink)]' : 'bg-surface'"
                  [disabled]="!isCategorySelected(category.id) && selectedCategoryIds().length >= categoriesCount"
                  [attr.aria-pressed]="isCategorySelected(category.id)"
                  (click)="toggleCategory(category.id)"
                >
                  <img [src]="categoryImage(category)" alt="" class="h-14 w-14 rounded-lg border-2 border-ink object-cover" />
                  <span>{{ translateService.lang() === 'ar' ? category.nameAr : category.nameEn }}</span>
                </button>
              }
            </div>
            @if (selectedCategoryIds().length !== categoriesCount) {
              <p class="mt-3 text-sm font-semibold text-secondary-dark">
                {{ 'game.setup.selectExactlyCategories' | translate: { count: categoriesCount } }}
              </p>
            }
          }
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          @for (teamKey of teamKeys; track teamKey; let ti = $index) {
            <div
              class="nb-card animate-fade-in-up p-6"
              [style.animation-delay.ms]="200 + ti * 60"
              [formGroupName]="teamKey"
            >
              <h2 class="nb-heading text-sm" [class]="teamKey === 'teamA' ? 'text-team-a' : 'text-team-b'">
                {{ 'game.setup.team' | translate }} {{ teamLabel(teamKey) }}
              </h2>

              <div class="mt-3">
                <label class="block text-xs font-semibold text-ink-soft">{{ 'game.setup.teamName' | translate }}</label>
                <input type="text" formControlName="name" class="nb-input mt-1" />
                @if (teamNameControl(teamKey).invalid && teamNameControl(teamKey).touched) {
                  <p class="mt-1 text-xs font-semibold text-primary">{{ 'common.required' | translate }}</p>
                }
              </div>

              <div class="mt-4">
                <label class="block text-xs font-semibold text-ink-soft">{{ 'game.setup.helperTools' | translate }}</label>
                <div class="mt-2 grid grid-cols-3 gap-2">
                  @for (tool of helperTools(); track tool.key) {
                    <label
                      class="group relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-ink bg-surface p-2.5 text-center transition has-checked:bg-secondary-soft has-checked:shadow-[3px_3px_0_var(--color-ink)] hover:-translate-y-0.5"
                    >
                      <input type="checkbox" [formControlName]="controlName(tool.key)" class="peer sr-only" />
                      <span
                        class="absolute -inset-e-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full border border-ink bg-secondary-dark text-[9px] font-bold text-white peer-checked:flex"
                      >
                        ✓
                      </span>
                      <img [src]="toolIcon(tool)" alt="" class="h-9 w-9 rounded-full border-2 border-ink object-cover transition group-has-checked:scale-110" />
                      <span class="text-[11px] font-bold text-ink">{{ toolName(tool) }}</span>
                      <span class="line-clamp-2 text-[9px] leading-tight text-ink-soft">{{ toolDescription(tool) }}</span>
                    </label>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <div class="animate-fade-in-up flex justify-center" style="animation-delay: 0.4s">
          <button type="submit" [disabled]="starting() || !canStart()" class="nb-btn nb-btn-primary px-8 py-3 text-sm">
            @if (starting()) {
              <app-loading-spinner [size]="16" variant="white" />
            }
            {{ 'game.setup.start' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class SetupComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly gameService = inject(GameService);
  private readonly gameState = inject(GameStateService);
  private readonly helperToolService = inject(HelperToolService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly translateService = inject(TranslateService);

  protected readonly teamKeys = ['teamA', 'teamB'] as const;
  protected readonly categoriesCount = GAME_CATEGORIES_COUNT;

  protected readonly loadingCategories = signal(true);
  protected readonly categories = signal<Category[]>([]);
  protected readonly selectedCategoryIds = signal<string[]>([]);
  protected readonly starting = signal(false);
  protected readonly resendingVerification = signal(false);
  protected readonly activeSession = signal<GameSessionSummary | null>(null);

  // Only the tools with real gameplay behavior are selectable here — see
  // CONTROL_NAME_BY_KEY. A future catalog-only entry (no backend mechanic
  // yet) shows up on the landing page but not in this picker.
  protected readonly helperTools = signal<HelperTool[]>([]);

  protected readonly isEmailVerified = computed(() => this.authService.currentUser()?.emailVerified ?? false);
  protected readonly hasCredits = computed(() => (this.authService.currentUser()?.credits ?? 0) > 0);

  // Requires exactly categoriesCount selected AND a verified email — the
  // backend enforces the same verification gate (requireVerifiedEmail on
  // POST /game-sessions), this is purely the earlier, friendlier UI
  // rejection with the banner explaining why the button is disabled.
  protected readonly canStart = computed(
    () => this.selectedCategoryIds().length === this.categoriesCount && this.isEmailVerified() && this.hasCredits(),
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    teamA: this.createTeamGroup('Team A'),
    teamB: this.createTeamGroup('Team B'),
  });

  ngOnInit(): void {
    // No credits — send the player to the shop instead of rendering a setup
    // form they can't submit (the backend enforces this too, but this is
    // the earlier, friendlier redirect rather than a failed POST).
    if (!this.hasCredits()) {
      this.router.navigateByUrl('/shop');
      return;
    }

    this.gameService.getCategoriesForSetup().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loadingCategories.set(false);
      },
      error: (err: unknown) => {
        this.loadingCategories.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load categories.'));
      },
    });

    this.helperToolService.getHelperTools().subscribe({
      next: (tools) =>
        this.helperTools.set(
          tools.filter((t): t is HelperTool & { key: WiredHelperToolKey } =>
            (WIRED_HELPER_TOOL_KEYS as readonly string[]).includes(t.key),
          ),
        ),
      error: () => {
        // Best-effort only — teams simply won't see lifeline opt-ins if this fails.
      },
    });

    // A player has at most one active session at a time (the backend
    // auto-finishes an older one the moment they start a new one) — find it
    // in their history so the resume banner can point at it directly.
    this.gameService.getHistory().subscribe({
      next: (sessions) => this.activeSession.set(sessions.find((s) => s.finishedAt === null) ?? null),
      error: () => {
        // Best-effort only — the resume banner just won't show if this fails.
      },
    });
  }

  protected controlName(key: string): 'hasTrap' | 'hasHole' | 'hasDoubleAnswer' {
    return CONTROL_NAME_BY_KEY[key as WiredHelperToolKey];
  }

  protected toolIcon(tool: HelperTool): string {
    return helperToolIconUrl(tool);
  }

  protected toolName(tool: HelperTool): string {
    return this.translateService.lang() === 'ar' ? tool.nameAr : tool.nameEn;
  }

  protected toolDescription(tool: HelperTool): string {
    return this.translateService.lang() === 'ar' ? tool.descriptionAr : tool.descriptionEn;
  }

  protected teamLabel(teamKey: 'teamA' | 'teamB'): string {
    return teamKey === 'teamA' ? 'A' : 'B';
  }

  protected teamNameControl(teamKey: 'teamA' | 'teamB') {
    return this.form.controls[teamKey].controls.name;
  }

  protected isCategorySelected(id: string): boolean {
    return this.selectedCategoryIds().includes(id);
  }

  protected toggleCategory(id: string): void {
    this.selectedCategoryIds.update((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= this.categoriesCount) return ids;
      return [...ids, id];
    });
  }

  protected categoryImage(category: Category): string {
    return categoryImageUrl(category);
  }

  protected resendVerification(): void {
    if (this.resendingVerification()) return;

    this.resendingVerification.set(true);
    this.authService.resendVerificationEmail().subscribe({
      next: () => {
        this.resendingVerification.set(false);
        this.toastService.success(this.translateService.t('game.setup.verificationEmailSent'));
      },
      error: (err: unknown) => {
        this.resendingVerification.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not resend the verification email.'));
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || !this.canStart() || this.starting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.starting.set(true);
    const value = this.form.getRawValue();
    const payload: CreateGameSessionRequest = {
      name: value.name,
      teams: [
        {
          name: value.teamA.name,
          hasTrap: value.teamA.hasTrap,
          hasHole: value.teamA.hasHole,
          hasDoubleAnswer: value.teamA.hasDoubleAnswer,
        },
        {
          name: value.teamB.name,
          hasTrap: value.teamB.hasTrap,
          hasHole: value.teamB.hasHole,
          hasDoubleAnswer: value.teamB.hasDoubleAnswer,
        },
      ],
      categoryIds: this.selectedCategoryIds(),
    };

    this.gameService.createSession(payload).subscribe({
      next: (session) => {
        this.gameState.setSession(session);
        this.router.navigate(['/play', session.id]);
      },
      error: (err: unknown) => {
        this.starting.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not start the game.'));
      },
    });
  }

  private createTeamGroup(defaultName: string) {
    return this.fb.nonNullable.group({
      name: [defaultName, Validators.required],
      hasTrap: [false],
      hasHole: [false],
      hasDoubleAnswer: [false],
    });
  }
}

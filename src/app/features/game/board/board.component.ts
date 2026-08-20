import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../../../core/models/category.model';
import { POINTS_BY_DIFFICULTY, RevealTileResponse, Tile, TileQuestion } from '../../../core/models/game.model';
import { Difficulty } from '../../../core/models/question.model';
import { TranslateService } from '../../../core/services/translate.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { categoryImageUrl } from '../../../shared/utils/category-image';
import { formatElapsed } from '../../../shared/utils/format-elapsed';
import { GameStateService } from '../services/game-state.service';
import { GameService } from '../services/game.service';

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
type ModalPhase = 'pre' | 'question' | 'revealed';

@Component({
  selector: 'app-board',
  imports: [TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading-spinner [fullPage]="true" [size]="40" />
    } @else if (gameState.session(); as session) {
      <div class="mx-auto max-w-5xl px-4 py-6">
        <div
          class="animate-fade-in-up mx-auto max-w-2xl rounded-2xl bg-linear-to-l from-primary via-primary to-secondary p-[2px] shadow-lg shadow-primary/20"
        >
          <div class="grid grid-cols-3 items-center rounded-2xl bg-white p-4 text-center">
            <div>
              <p class="truncate text-sm font-bold text-team-a" [title]="session.teams[0]?.name ?? ''">{{ session.teams[0]?.name }}</p>
              <p class="text-2xl font-black text-team-a">{{ session.teams[0]?.score }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-400">{{ 'game.board.turn' | translate }}</p>
              <p
                class="mt-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                [class]="session.currentTeamIndex === 0 ? 'bg-team-a-soft text-team-a' : 'bg-team-b-soft text-team-b'"
              >
                {{ 'game.board.turnOf' | translate: { team: gameState.activeTeam()?.name ?? '' } }}
              </p>
            </div>
            <div>
              <p class="truncate text-sm font-bold text-team-b" [title]="session.teams[1]?.name ?? ''">{{ session.teams[1]?.name }}</p>
              <p class="text-2xl font-black text-team-b">{{ session.teams[1]?.score }}</p>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          @for (categoryId of categoryIds(); track categoryId; let ci = $index) {
            <div
              class="animate-fade-in-up flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
              [style.animation-delay.ms]="ci * 50"
            >
              <div class="flex flex-col gap-1.5">
                @for (difficulty of difficulties; track difficulty) {
                  @if (tileFor(categoryId, difficulty, 0); as tile) {
                    <button
                      type="button"
                      class="flex h-11 w-14 items-center justify-center rounded-lg border-2 text-xs font-bold transition hover:not-disabled:scale-105"
                      [class]="tileClasses(tile, session.currentTeamIndex, 0)"
                      [disabled]="!isPickable(tile, session.currentTeamIndex)"
                      (click)="openTile(tile)"
                    >
                      {{ tile.answered ? '✓' : pointsByDifficulty[difficulty] }}
                    </button>
                  }
                }
              </div>

              <div class="flex flex-col items-center gap-1 px-1 text-center">
                <img [src]="categoryImage(categoryId)" alt="" class="h-10 w-10 rounded-lg object-cover" />
                <span class="line-clamp-2 text-xs font-semibold text-slate-700" [title]="categoryLabel(categoryId)">{{ categoryLabel(categoryId) }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                @for (difficulty of difficulties; track difficulty) {
                  @if (tileFor(categoryId, difficulty, 1); as tile) {
                    <button
                      type="button"
                      class="flex h-11 w-14 items-center justify-center rounded-lg border-2 text-xs font-bold transition hover:not-disabled:scale-105"
                      [class]="tileClasses(tile, session.currentTeamIndex, 1)"
                      [disabled]="!isPickable(tile, session.currentTeamIndex)"
                      (click)="openTile(tile)"
                    >
                      {{ tile.answered ? '✓' : pointsByDifficulty[difficulty] }}
                    </button>
                  }
                }
              </div>
            </div>
          }
        </div>
      </div>

      @if (selectedTile(); as tile) {
        <div class="animate-fade-in fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div class="animate-pop-in w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{{ categoryLabel(tile.categoryId) }} · {{ pointsByDifficulty[tile.difficulty] }} {{ 'game.board.pointsSuffix' | translate }}</span>
              @if (phase() === 'question') {
                <span class="animate-pulse-ring rounded-full bg-primary-soft px-3 py-1 text-primary-dark">
                  {{ 'game.board.elapsed' | translate }}: {{ elapsedLabel() }}
                </span>
              }
            </div>

            @if (phase() === 'pre') {
              <h2 class="mt-4 text-base font-semibold text-slate-800">{{ pickingTeamName() }}</h2>

              <div class="mt-4 flex flex-wrap gap-2">
                @if (canInvokeHole()) {
                  <button
                    type="button"
                    class="max-w-40 truncate rounded-full border border-secondary/40 px-3 py-1.5 text-xs font-semibold text-secondary-dark transition hover:bg-secondary-soft disabled:opacity-50"
                    [title]="translateService.t('game.board.holeHint')"
                    [disabled]="invokingHole()"
                    (click)="useHole()"
                  >
                    {{ 'game.board.useHole' | translate }}
                  </button>
                }
                @if (holeInvokedForTile()) {
                  <span
                    class="rounded-full bg-secondary-soft px-3 py-1.5 text-xs font-semibold text-secondary-dark"
                    [title]="translateService.t('game.board.holeHint')"
                  >
                    {{ 'game.board.holeActive' | translate }}
                  </span>
                }
                @if (canInvokeDoubleAnswer()) {
                  <button
                    type="button"
                    class="max-w-40 truncate rounded-full border border-accent-dark/40 px-3 py-1.5 text-xs font-semibold text-accent-dark transition hover:bg-accent-soft disabled:opacity-50"
                    [title]="translateService.t('game.board.doubleAnswerHint')"
                    [disabled]="invokingDoubleAnswer()"
                    (click)="useDoubleAnswer()"
                  >
                    {{ 'game.board.useDoubleAnswer' | translate }}
                  </button>
                }
                @if (doubleAnswerInvokedForTile()) {
                  <span
                    class="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-dark"
                    [title]="translateService.t('game.board.doubleAnswerHint')"
                  >
                    {{ 'game.board.doubleAnswerActive' | translate }}
                  </span>
                }
                @if (canInvokeTrap()) {
                  <button
                    type="button"
                    class="max-w-40 truncate rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    [title]="translateService.t('game.board.trapHint')"
                    [disabled]="invokingTrap()"
                    (click)="useTrap()"
                  >
                    {{ 'game.board.useTrap' | translate }}
                  </button>
                }
                @if (trapInvokedForTile()) {
                  <span
                    class="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"
                    [title]="translateService.t('game.board.trapHint')"
                  >
                    {{ 'game.board.trapActive' | translate }}
                  </span>
                }
              </div>

              <div class="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  (click)="closeModal()"
                >
                  {{ 'common.cancel' | translate }}
                </button>
                <button
                  type="button"
                  class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                  [disabled]="openingQuestion()"
                  (click)="openQuestion()"
                >
                  {{ 'game.board.openQuestion' | translate }}
                </button>
              </div>
            }

            @if (phase() === 'question' && tileQuestion(); as question) {
              <div class="mt-3 flex flex-wrap gap-2">
                @if (canInvokeHole()) {
                  <button
                    type="button"
                    class="max-w-40 truncate rounded-full border border-secondary/40 px-3 py-1.5 text-xs font-semibold text-secondary-dark transition hover:bg-secondary-soft disabled:opacity-50"
                    [title]="translateService.t('game.board.holeHint')"
                    [disabled]="invokingHole()"
                    (click)="useHole()"
                  >
                    {{ 'game.board.useHole' | translate }}
                  </button>
                }
                @if (holeInvokedForTile()) {
                  <span
                    class="rounded-full bg-secondary-soft px-3 py-1.5 text-xs font-semibold text-secondary-dark"
                    [title]="translateService.t('game.board.holeHint')"
                  >
                    {{ 'game.board.holeActive' | translate }}
                  </span>
                }
                @if (canInvokeDoubleAnswer()) {
                  <button
                    type="button"
                    class="max-w-40 truncate rounded-full border border-accent-dark/40 px-3 py-1.5 text-xs font-semibold text-accent-dark transition hover:bg-accent-soft disabled:opacity-50"
                    [title]="translateService.t('game.board.doubleAnswerHint')"
                    [disabled]="invokingDoubleAnswer()"
                    (click)="useDoubleAnswer()"
                  >
                    {{ 'game.board.useDoubleAnswer' | translate }}
                  </button>
                }
                @if (doubleAnswerInvokedForTile()) {
                  <span
                    class="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-dark"
                    [title]="translateService.t('game.board.doubleAnswerHint')"
                  >
                    {{ 'game.board.doubleAnswerActive' | translate }}
                  </span>
                }
              </div>

              <h2 class="mt-4 text-lg font-bold text-slate-900">{{ question.text }}</h2>

              <div class="mt-6 flex justify-end">
                <button
                  type="button"
                  class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                  [disabled]="revealing()"
                  (click)="revealAnswer()"
                >
                  {{ 'game.board.next' | translate }}
                </button>
              </div>
            }

            @if (phase() === 'revealed' && reveal(); as revealData) {
              <div class="animate-fade-in-up mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p class="text-sm font-semibold text-emerald-800">{{ 'game.board.correctAnswer' | translate }}:</p>
                <p class="mt-1 font-bold text-emerald-900">{{ correctOptionText(revealData) }}</p>
                @if (revealData.explanation) {
                  <p class="mt-2 text-sm text-emerald-800">{{ 'game.board.explanation' | translate }}: {{ revealData.explanation }}</p>
                }
              </div>

              <p class="mt-4 text-sm font-semibold text-slate-700">{{ 'game.board.whoAnswered' | translate }}</p>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="rounded-lg border-2 border-slate-200 px-3 py-2.5 text-xs font-semibold text-team-a transition hover:border-team-a disabled:opacity-50"
                  [disabled]="resolving()"
                  (click)="resolve(0)"
                >
                  {{ gameState.session()?.teams?.[0]?.name }} ✓
                </button>
                <button
                  type="button"
                  class="rounded-lg border-2 border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-400 disabled:opacity-50"
                  [disabled]="resolving()"
                  (click)="resolve(null)"
                >
                  {{ 'game.board.noOneAnswered' | translate }}
                </button>
                <button
                  type="button"
                  class="rounded-lg border-2 border-slate-200 px-3 py-2.5 text-xs font-semibold text-team-b transition hover:border-team-b disabled:opacity-50"
                  [disabled]="resolving()"
                  (click)="resolve(1)"
                >
                  {{ gameState.session()?.teams?.[1]?.name }} ✓
                </button>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class BoardComponent implements OnInit, OnDestroy {
  protected readonly gameState = inject(GameStateService);
  private readonly gameService = inject(GameService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly translateService = inject(TranslateService);

  protected readonly loading = signal(true);
  protected readonly categories = signal<Category[]>([]);

  protected readonly selectedTile = signal<Tile | null>(null);
  protected readonly phase = signal<ModalPhase>('pre');
  protected readonly tileQuestion = signal<TileQuestion | null>(null);
  protected readonly reveal = signal<RevealTileResponse | null>(null);
  protected readonly elapsedSeconds = signal(0);

  protected readonly holeInvokedForTile = signal(false);
  protected readonly trapInvokedForTile = signal(false);
  protected readonly doubleAnswerInvokedForTile = signal(false);
  protected readonly openingQuestion = signal(false);
  protected readonly invokingHole = signal(false);
  protected readonly invokingTrap = signal(false);
  protected readonly invokingDoubleAnswer = signal(false);
  protected readonly revealing = signal(false);
  protected readonly resolving = signal(false);

  protected readonly elapsedLabel = computed(() => formatElapsed(this.elapsedSeconds()));

  protected readonly difficulties = DIFFICULTIES;
  protected readonly pointsByDifficulty = POINTS_BY_DIFFICULTY;

  private sessionId = '';
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly categoryIds = computed(() => {
    const session = this.gameState.session();
    if (!session) return [];
    return [...new Set(session.tiles.map((t) => t.categoryId))];
  });

  protected readonly allAnswered = computed(() => {
    const session = this.gameState.session();
    return !!session && session.tiles.every((t) => t.answered);
  });

  private readonly pickingTeam = computed(() => {
    const session = this.gameState.session();
    const tile = this.selectedTile();
    if (!session || !tile) return null;
    return session.teams.find((team) => team.index === tile.ownerTeamIndex) ?? null;
  });

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    if (!this.sessionId) {
      this.router.navigateByUrl('/play');
      return;
    }

    this.loadSession();
    this.gameService.getCategoriesForSetup().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => {
        // Best-effort only — the board still works with bare category ids.
      },
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  protected categoryLabel(categoryId: string): string {
    const category = this.categories().find((c) => c.id === categoryId);
    if (!category) return categoryId.slice(0, 8);
    return this.translateService.lang() === 'ar' ? category.nameAr : category.nameEn;
  }

  protected categoryImage(categoryId: string): string {
    const category = this.categories().find((c) => c.id === categoryId);
    return categoryImageUrl({ imageUrl: category?.imageUrl ?? null });
  }

  protected tileFor(categoryId: string, difficulty: Difficulty, ownerTeamIndex: number): Tile | undefined {
    return this.gameState
      .session()
      ?.tiles.find((t) => t.categoryId === categoryId && t.difficulty === difficulty && t.ownerTeamIndex === ownerTeamIndex);
  }

  protected isPickable(tile: Tile, currentTeamIndex: number): boolean {
    return !tile.answered && tile.ownerTeamIndex === currentTeamIndex;
  }

  protected tileClasses(tile: Tile, currentTeamIndex: number, ownerTeamIndex: 0 | 1): string {
    if (tile.answered) return 'cursor-default border-slate-100 bg-slate-50 text-slate-300';
    if (tile.ownerTeamIndex !== currentTeamIndex) return 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300';
    return ownerTeamIndex === 0
      ? 'border-team-a/40 bg-team-a-soft text-team-a hover:border-team-a'
      : 'border-team-b/40 bg-team-b-soft text-team-b hover:border-team-b';
  }

  protected pickingTeamName(): string {
    return this.pickingTeam()?.name ?? '';
  }

  protected canInvokeHole(): boolean {
    const team = this.pickingTeam();
    return !!team && team.hasHole && !team.holeUsed && !this.holeInvokedForTile();
  }

  protected canInvokeDoubleAnswer(): boolean {
    const team = this.pickingTeam();
    return !!team && team.hasDoubleAnswer && !team.doubleAnswerUsed && !this.doubleAnswerInvokedForTile();
  }

  /** الفخ works on any tile now, but only before the question is opened — see openTile/openQuestion. */
  protected canInvokeTrap(): boolean {
    const team = this.pickingTeam();
    return !!team && team.hasTrap && !team.trapUsed && !this.trapInvokedForTile();
  }

  protected openTile(tile: Tile): void {
    if (!this.isPickable(tile, this.gameState.session()?.currentTeamIndex ?? -1)) return;

    this.selectedTile.set(tile);
    this.phase.set('pre');
    this.tileQuestion.set(null);
    this.reveal.set(null);
    this.holeInvokedForTile.set(tile.holeInvoked);
    this.trapInvokedForTile.set(tile.trapInvoked);
    this.doubleAnswerInvokedForTile.set(tile.doubleAnswerInvoked);
  }

  protected closeModal(): void {
    this.stopTimer();
    this.selectedTile.set(null);
    this.tileQuestion.set(null);
    this.reveal.set(null);
  }

  protected useHole(): void {
    const tile = this.selectedTile();
    if (!tile || this.invokingHole()) return;

    this.invokingHole.set(true);
    this.gameService.invokeHole(this.sessionId, tile.id).subscribe({
      next: () => {
        this.invokingHole.set(false);
        this.holeInvokedForTile.set(true);
      },
      error: (err: unknown) => {
        this.invokingHole.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not use الحفرة.'));
      },
    });
  }

  protected useTrap(): void {
    const tile = this.selectedTile();
    if (!tile || this.invokingTrap()) return;

    this.invokingTrap.set(true);
    this.gameService.invokeTrap(this.sessionId, tile.id).subscribe({
      next: () => {
        this.invokingTrap.set(false);
        this.trapInvokedForTile.set(true);
      },
      error: (err: unknown) => {
        this.invokingTrap.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not use الفخ.'));
      },
    });
  }

  protected useDoubleAnswer(): void {
    const tile = this.selectedTile();
    if (!tile || this.invokingDoubleAnswer()) return;

    this.invokingDoubleAnswer.set(true);
    this.gameService.invokeDoubleAnswer(this.sessionId, tile.id).subscribe({
      next: () => {
        this.invokingDoubleAnswer.set(false);
        this.doubleAnswerInvokedForTile.set(true);
      },
      error: (err: unknown) => {
        this.invokingDoubleAnswer.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not use محاولتين.'));
      },
    });
  }

  protected openQuestion(): void {
    const tile = this.selectedTile(); 
    if (!tile || this.openingQuestion()) return;

    this.openingQuestion.set(true);
    this.gameService.getTileQuestion(this.sessionId, tile.id).subscribe({
      next: (question) => {
        this.openingQuestion.set(false);
        this.tileQuestion.set(question);
        this.phase.set('question');
        this.startTimer(question.pickedAt);
      },
      error: (err: unknown) => {
        this.openingQuestion.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not open this question.'));
      },
    });
  }

  protected revealAnswer(): void {
    const tile = this.selectedTile();
    if (!tile || this.revealing()) return;

    this.revealing.set(true);
    this.stopTimer();
    this.gameService.revealTile(this.sessionId, tile.id).subscribe({
      next: (data) => {
        this.revealing.set(false);
        this.reveal.set(data);
        this.phase.set('revealed');
      },
      error: (err: unknown) => {
        this.revealing.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not reveal the answer.'));
      },
    });
  }

  protected correctOptionText(revealData: RevealTileResponse): string {
    return this.tileQuestion()?.options[revealData.correctOptionIndex] ?? '';
  }

  protected resolve(awardedTeamIndex: number | null): void {
    const tile = this.selectedTile();
    if (!tile || this.resolving()) return;

    this.resolving.set(true);
    this.gameService.resolveTile(this.sessionId, tile.id, { awardedTeamIndex }).subscribe({
      next: () => {
        this.resolving.set(false);
        this.closeModal();
        this.refreshSession(() => {
          if (this.allAnswered()) {
            this.router.navigate(['/play', this.sessionId, 'results']);
          }
        });
      },
      error: (err: unknown) => {
        this.resolving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save this result.'));
      },
    });
  }

  private startTimer(pickedAt: string): void {
    const compute = () => {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(pickedAt).getTime()) / 1000));
      this.elapsedSeconds.set(elapsedSeconds);
    };

    compute();
    this.stopTimer();
    this.timerHandle = setInterval(compute, 1000);
  }

  private stopTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private loadSession(): void {
    this.loading.set(true);
    this.gameService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.gameState.setSession(session);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load this game.'));
        this.router.navigateByUrl('/play');
      },
    });
  }

  private refreshSession(after?: () => void): void {
    this.gameService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.gameState.setSession(session);
        after?.();
      },
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not refresh the game state.')),
    });
  }
}

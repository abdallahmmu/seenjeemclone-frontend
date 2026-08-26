import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../../../core/models/category.model';
import { POINTS_BY_DIFFICULTY, RevealTileResponse, Tile, TileQuestion } from '../../../core/models/game.model';
import { HelperTool, WiredHelperToolKey } from '../../../core/models/helper-tool.model';
import { Difficulty } from '../../../core/models/question.model';
import { HelperToolService } from '../../../core/services/helper-tool.service';
import { TranslateService } from '../../../core/services/translate.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { categoryImageUrl } from '../../../shared/utils/category-image';
import { formatElapsed } from '../../../shared/utils/format-elapsed';
import { helperToolIconUrl } from '../../../shared/utils/helper-tool-icon';
import { resolveVideoEmbed } from '../../../shared/utils/media-embed';
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
        <div class="animate-fade-in fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div class="animate-pop-in w-full max-w-xl rounded-3xl bg-linear-to-br from-primary via-secondary to-accent p-[3px] shadow-2xl shadow-primary/30">
            <div class="rounded-[calc(1.5rem-1px)] bg-white p-6">
              <div class="flex items-center justify-between gap-3">
                <div class="flex min-w-0 items-center gap-2">
                  <img
                    [src]="categoryImage(tile.categoryId)"
                    alt=""
                    class="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-primary-soft"
                  />
                  <span class="truncate text-sm font-bold text-slate-700">{{ categoryLabel(tile.categoryId) }}</span>
                </div>
                <span
                  class="animate-glow-pulse shrink-0 rounded-full bg-linear-to-l from-accent-dark to-accent px-4 py-1.5 text-sm font-black text-white"
                >
                  {{ pointsByDifficulty[tile.difficulty] }} {{ 'game.board.pointsSuffix' | translate }}
                </span>
              </div>

              @if (phase() === 'question') {
                <div class="mt-3 flex justify-center">
                  <span
                    class="animate-pulse-ring inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-dark"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    {{ 'game.board.elapsed' | translate }}: {{ elapsedLabel() }}
                  </span>
                </div>
              }

              @if (phase() === 'pre') {
                <h2 class="mt-5 text-center text-lg font-black" [class]="tile.ownerTeamIndex === 0 ? 'text-team-a' : 'text-team-b'">
                  {{ pickingTeamName() }}
                </h2>

                <div class="mt-4 flex flex-wrap justify-center gap-2">
                  @if (canInvokeHole()) {
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 py-1.5 ps-1.5 pe-3 text-xs font-semibold text-secondary-dark transition hover:scale-105 hover:bg-secondary-soft disabled:opacity-50 disabled:hover:scale-100"
                      [title]="translateService.t('game.board.holeHint')"
                      [disabled]="invokingHole()"
                      (click)="useHole()"
                    >
                      @if (invokingHole()) {
                        <app-loading-spinner [size]="16" />
                      } @else {
                        <img [src]="toolIcon('hole')" alt="" class="h-6 w-6 rounded-full bg-white object-contain ring-1 ring-secondary/30" />
                      }
                      {{ 'game.board.useHole' | translate }}
                    </button>
                  }
                  @if (holeInvokedForTile()) {
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full bg-secondary-soft py-1.5 ps-1.5 pe-3 text-xs font-semibold text-secondary-dark"
                      [title]="translateService.t('game.board.holeHint')"
                    >
                      <img [src]="toolIcon('hole')" alt="" class="h-6 w-6 rounded-full bg-white object-contain ring-1 ring-secondary/30" />
                      {{ 'game.board.holeActive' | translate }}
                    </span>
                  }
                </div>

                <div class="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    (click)="closeModal()"
                  >
                    {{ 'common.cancel' | translate }}
                  </button>
                  <button
                    type="button"
                    class="animate-glow-pulse inline-flex items-center gap-2 rounded-full bg-linear-to-l from-primary to-secondary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:scale-105 disabled:animate-none disabled:opacity-50 disabled:hover:scale-100"
                    [disabled]="openingQuestion()"
                    (click)="openQuestion()"
                  >
                    @if (openingQuestion()) {
                      <app-loading-spinner [size]="16" variant="white" />
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 7.5-2" stroke-linecap="round" />
                      </svg>
                    }
                    {{ 'game.board.openQuestion' | translate }}
                  </button>
                </div>
              }

              @if (phase() === 'question' && tileQuestion(); as question) {
                <div class="mt-3 flex flex-wrap justify-center gap-2">
                  @if (canInvokeDoubleAnswer()) {
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-full border border-accent-dark/40 py-1.5 ps-1.5 pe-3 text-xs font-semibold text-accent-dark transition hover:scale-105 hover:bg-accent-soft disabled:opacity-50 disabled:hover:scale-100"
                      [title]="translateService.t('game.board.doubleAnswerHint')"
                      [disabled]="invokingDoubleAnswer()"
                      (click)="useDoubleAnswer()"
                    >
                      @if (invokingDoubleAnswer()) {
                        <app-loading-spinner [size]="16" />
                      } @else {
                        <img [src]="toolIcon('double_answer')" alt="" class="h-6 w-6 rounded-full bg-white object-contain ring-1 ring-accent-dark/30" />
                      }
                      {{ 'game.board.useDoubleAnswer' | translate }}
                    </button>
                  }
                  @if (doubleAnswerInvokedForTile()) {
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full bg-accent-soft py-1.5 ps-1.5 pe-3 text-xs font-semibold text-accent-dark"
                      [title]="translateService.t('game.board.doubleAnswerHint')"
                    >
                      <img [src]="toolIcon('double_answer')" alt="" class="h-6 w-6 rounded-full bg-white object-contain ring-1 ring-accent-dark/30" />
                      {{ 'game.board.doubleAnswerActive' | translate }}
                    </span>
                  }
                  @if (canInvokeTrap()) {
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-full border border-red-300 py-1.5 ps-1.5 pe-3 text-xs font-semibold text-red-700 transition hover:scale-105 hover:bg-red-50 disabled:opacity-50 disabled:hover:scale-100"
                      [title]="translateService.t('game.board.trapHint')"
                      [disabled]="invokingTrap()"
                      (click)="useTrap()"
                    >
                      @if (invokingTrap()) {
                        <app-loading-spinner [size]="16" />
                      } @else {
                        <img [src]="toolIcon('trap')" alt="" class="h-6 w-6 rounded-full bg-white object-contain ring-1 ring-red-200" />
                      }
                      {{ 'game.board.useTrap' | translate }}
                    </button>
                  }
                  @if (trapInvokedForTile()) {
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full bg-red-100 py-1.5 ps-1.5 pe-3 text-xs font-semibold text-red-700"
                      [title]="translateService.t('game.board.trapHint')"
                    >
                      <img [src]="toolIcon('trap')" alt="" class="h-6 w-6 rounded-full bg-white object-contain ring-1 ring-red-200" />
                      {{ 'game.board.trapActive' | translate }}
                    </span>
                  }
                </div>

                <div class="animate-fade-in-up mt-5 rounded-2xl bg-linear-to-br from-slate-50 to-primary-soft p-6 text-center shadow-inner">
                  @if (question.mediaType === 'AUDIO' && question.mediaUrl) {
                    <div class="mb-4 flex justify-center">
                      <audio [src]="question.mediaUrl" controls autoplay class="w-full max-w-sm"></audio>
                    </div>
                  }
                  @if (question.mediaType === 'VIDEO' && videoEmbed(); as embed) {
                    <div class="mb-4">
                      @if (!videoStarted()) {
                        <button
                          type="button"
                          class="mx-auto inline-flex items-center gap-2 rounded-full bg-linear-to-l from-primary to-secondary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:scale-105"
                          (click)="startVideo()"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          {{ 'game.board.playVideo' | translate }}
                        </button>
                      } @else if (videoEnded()) {
                        <div
                          class="mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 p-6 text-sm font-semibold text-slate-500"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
                            <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                          {{ 'game.board.videoAlreadyPlayed' | translate }}
                        </div>
                      } @else if (embed.kind === 'file') {
                        <video
                          [src]="embed.src"
                          controls
                          autoplay
                          playsinline
                          (ended)="onVideoEnded()"
                          class="mx-auto w-full max-w-md rounded-xl shadow-lg"
                        ></video>
                      } @else {
                        <iframe
                          [src]="safeUrl(embed.src)"
                          allow="autoplay; encrypted-media"
                          allowfullscreen
                          frameborder="0"
                          class="mx-auto aspect-video w-full max-w-md rounded-xl shadow-lg"
                        ></iframe>
                      }
                    </div>
                  }
                  @if (question.mediaType === 'IMAGE' && question.mediaUrl) {
                    <div class="mb-4 flex justify-center">
                      <div class="relative w-full max-w-sm overflow-hidden rounded-xl shadow-lg">
                        <img
                          [src]="question.mediaUrl"
                          alt=""
                          class="w-full transition-[filter] duration-500"
                          [class.blur-2xl]="!imageRevealed()"
                        />
                        @if (!imageRevealed()) {
                          <button
                            type="button"
                            class="absolute inset-0 flex items-center justify-center bg-slate-900/30 text-sm font-bold text-white transition hover:bg-slate-900/40"
                            (click)="revealImage()"
                          >
                            <span class="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-primary to-secondary px-5 py-2.5 shadow-lg">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" stroke-linecap="round" stroke-linejoin="round" />
                                <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                              {{ 'game.board.revealImage' | translate }}
                            </span>
                          </button>
                        }
                      </div>
                    </div>
                  }
                  <h2 class="text-xl leading-snug font-black text-slate-900">{{ question.text }}</h2>
                </div>

                <div class="mt-6 flex justify-center">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-primary to-secondary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    [disabled]="revealing()"
                    (click)="revealAnswer()"
                  >
                    {{ 'game.board.next' | translate }}
                    @if (revealing()) {
                      <app-loading-spinner [size]="16" variant="white" />
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    }
                  </button>
                </div>
              }

              @if (phase() === 'revealed' && reveal(); as revealData) {
                <div class="animate-pop-in mt-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p class="text-xs font-bold tracking-wide text-emerald-700 uppercase">{{ 'game.board.correctAnswer' | translate }}</p>
                  <p class="mt-1 text-lg font-black text-emerald-900">{{ correctOptionText(revealData) }}</p>
                  @if (revealData.explanation) {
                    <p class="mt-2 text-sm text-emerald-800">{{ revealData.explanation }}</p>
                  }
                </div>

                <p class="mt-5 text-center text-sm font-semibold text-slate-700">{{ 'game.board.whoAnswered' | translate }}</p>
                <div class="mt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-slate-200 px-3 py-2.5 text-xs font-semibold text-team-a transition hover:border-team-a hover:bg-team-a-soft disabled:opacity-50"
                    [disabled]="resolving()"
                    (click)="resolve(0)"
                  >
                    @if (resolving()) {
                      <app-loading-spinner [size]="14" />
                    }
                    {{ gameState.session()?.teams?.[0]?.name }} ✓
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                    [disabled]="resolving()"
                    (click)="resolve(null)"
                  >
                    @if (resolving()) {
                      <app-loading-spinner [size]="14" />
                    }
                    {{ 'game.board.noOneAnswered' | translate }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-slate-200 px-3 py-2.5 text-xs font-semibold text-team-b transition hover:border-team-b hover:bg-team-b-soft disabled:opacity-50"
                    [disabled]="resolving()"
                    (click)="resolve(1)"
                  >
                    @if (resolving()) {
                      <app-loading-spinner [size]="14" />
                    }
                    {{ gameState.session()?.teams?.[1]?.name }} ✓
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class BoardComponent implements OnInit, OnDestroy {
  protected readonly gameState = inject(GameStateService);
  private readonly gameService = inject(GameService);
  private readonly helperToolService = inject(HelperToolService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly translateService = inject(TranslateService);

  protected readonly loading = signal(true);
  protected readonly categories = signal<Category[]>([]);
  protected readonly helperTools = signal<HelperTool[]>([]);

  protected readonly selectedTile = signal<Tile | null>(null);
  protected readonly phase = signal<ModalPhase>('pre');
  protected readonly tileQuestion = signal<TileQuestion | null>(null);
  protected readonly reveal = signal<RevealTileResponse | null>(null);
  protected readonly elapsedSeconds = signal(0);

  // Single-play video is enforced client-side only (this component's own
  // state, reset per tile in openTile) — a page refresh resets it, which is
  // an accepted tradeoff for a game that's always host-supervised on one
  // screen rather than something that needs server-side anti-cheat.
  protected readonly videoStarted = signal(false);
  protected readonly videoEnded = signal(false);
  // Same client-side-only reasoning as video — clicking reveal removes the
  // blur for the rest of this view; a refresh brings it back blurred.
  protected readonly imageRevealed = signal(false);

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

  protected readonly videoEmbed = computed(() => {
    const question = this.tileQuestion();
    if (!question || question.mediaType !== 'VIDEO' || !question.mediaUrl) return null;
    return resolveVideoEmbed(question.mediaUrl, true);
  });

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
    this.helperToolService.getHelperTools().subscribe({
      next: (tools) => this.helperTools.set(tools),
      error: () => {
        // Best-effort only — toolIcon() falls back to the per-key default icon.
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

  protected toolIcon(key: WiredHelperToolKey): string {
    const tool = this.helperTools().find((t) => t.key === key);
    return helperToolIconUrl({ iconUrl: tool?.iconUrl ?? null, key });
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

  /** الحفرة must be committed to before the question is opened — the team steals blind. Rendered in the 'pre' phase only. */
  protected canInvokeHole(): boolean {
    const team = this.pickingTeam();
    return !!team && team.hasHole && !team.holeUsed && !this.holeInvokedForTile();
  }

  /** محاولتين, like الفخ, only makes sense once the team has read the question. Rendered in the 'question' phase only. */
  protected canInvokeDoubleAnswer(): boolean {
    const team = this.pickingTeam();
    return !!team && team.hasDoubleAnswer && !team.doubleAnswerUsed && !this.doubleAnswerInvokedForTile();
  }

  /** الفخ works on any tile, but only once the question is open — the owning team reads it first, then decides. Rendered in the 'question' phase only. */
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
    this.videoStarted.set(false);
    this.videoEnded.set(false);
    this.imageRevealed.set(false);
  }

  protected startVideo(): void {
    this.videoStarted.set(true);
  }

  protected onVideoEnded(): void {
    this.videoEnded.set(true);
  }

  protected revealImage(): void {
    this.imageRevealed.set(true);
  }

  protected safeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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

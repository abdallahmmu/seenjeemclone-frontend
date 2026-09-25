import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameSessionSummary } from '../../core/models/game.model';
import { TranslateService } from '../../core/services/translate.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/api-error';
import { GameService } from '../game/services/game.service';

@Component({
  selector: 'app-game-history',
  imports: [RouterLink, TranslatePipe, LoadingSpinnerComponent, ConfirmModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl bg-bg px-4 py-10">
      <h1 class="nb-heading text-3xl text-ink">{{ 'history.title' | translate }}</h1>
      <p class="mt-1 text-sm text-ink-soft">{{ 'history.subtitle' | translate }}</p>

      @if (loading()) {
        <app-loading-spinner [size]="32" />
      } @else if (sessions().length === 0) {
        <p class="mt-8 text-center text-sm text-ink-soft">{{ 'history.empty' | translate }}</p>
      } @else {
        <div class="mt-6 space-y-3">
          @for (session of sessions(); track session.id) {
            <div class="nb-card p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <p class="font-bold text-ink">{{ session.name }}</p>
                  <span class="nb-badge normal-case" [class]="session.finishedAt ? 'nb-badge-soft' : 'nb-badge-secondary'">
                    {{ (session.finishedAt ? 'history.finished' : 'history.active') | translate }}
                  </span>
                </div>
                <p class="text-xs font-medium text-ink-soft">{{ formatDate(session.createdAt) }}</p>
              </div>

              <div class="mt-3 flex items-center justify-between gap-4">
                <div class="flex flex-1 items-center justify-around gap-3 text-center">
                  @for (team of session.teams; track team.id) {
                    <div>
                      <p class="text-xs text-ink-soft" [class.font-bold]="winnerId(session) === team.id">{{ team.name }}</p>
                      <p class="text-lg font-black" [class]="winnerId(session) === team.id ? 'text-primary' : 'text-ink'">
                        {{ team.score }}
                      </p>
                    </div>
                  }
                </div>

                <div class="flex shrink-0 gap-2">
                  @if (!session.finishedAt) {
                    <a [routerLink]="['/play', session.id]" class="nb-btn nb-btn-primary px-3 py-1.5 text-xs">
                      {{ 'game.setup.resumeGame' | translate }}
                    </a>
                    <button type="button" class="nb-btn nb-btn-outline px-3 py-1.5 text-xs" (click)="confirmFinish(session)">
                      {{ 'game.board.finishGame' | translate }}
                    </button>
                  } @else {
                    <a [routerLink]="['/play', session.id, 'results']" class="nb-btn nb-btn-outline px-3 py-1.5 text-xs">
                      {{ 'game.board.viewResults' | translate }}
                    </a>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-confirm-modal
      [open]="!!pendingFinish()"
      [title]="'game.board.finishGame' | translate"
      [message]="'game.board.finishGameConfirm' | translate"
      [danger]="true"
      [confirmLabel]="'game.board.finishGame' | translate"
      (confirmed)="finishConfirmed()"
      (cancelled)="pendingFinish.set(null)"
    />
  `,
})
export class GameHistoryComponent implements OnInit {
  private readonly gameService = inject(GameService);
  private readonly toastService = inject(ToastService);
  protected readonly translateService = inject(TranslateService);

  protected readonly loading = signal(true);
  protected readonly sessions = signal<GameSessionSummary[]>([]);
  protected readonly pendingFinish = signal<GameSessionSummary | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(this.translateService.lang() === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /** Null on a tie or a session with no scored tiles yet — neither team is highlighted. */
  protected winnerId(session: GameSessionSummary): string | null {
    if (session.teams.length !== 2) return null;
    const [a, b] = session.teams;
    if (a.score === b.score) return null;
    return a.score > b.score ? a.id : b.id;
  }

  protected confirmFinish(session: GameSessionSummary): void {
    this.pendingFinish.set(session);
  }

  protected finishConfirmed(): void {
    const session = this.pendingFinish();
    if (!session) return;

    this.gameService.finishSession(session.id).subscribe({
      next: () => {
        this.pendingFinish.set(null);
        this.load();
      },
      error: (err: unknown) => {
        this.pendingFinish.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not finish the game.'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.gameService.getHistory().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load your game history.'));
      },
    });
  }
}

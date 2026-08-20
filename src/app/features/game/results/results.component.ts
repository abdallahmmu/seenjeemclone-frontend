import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameSessionResults } from '../../../core/models/game.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { GameStateService } from '../services/game-state.service';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-results',
  imports: [TranslatePipe, LoadingSpinnerComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading-spinner [fullPage]="true" [size]="40" />
    } @else if (results(); as r) {
      <div class="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 class="text-3xl font-extrabold text-slate-900">{{ 'game.results.title' | translate }}</h1>

        @if (isTie()) {
          <p class="mt-3 text-lg font-semibold text-slate-600">{{ 'game.results.tie' | translate }}</p>
        } @else if (winnerName(); as winner) {
          <p class="mt-3 text-lg font-semibold text-primary">🏆 {{ 'game.results.winner' | translate }}: {{ winner }}</p>
        }

        <div class="mt-6 grid grid-cols-2 gap-4">
          @for (team of r.teams; track team.id) {
            <div class="rounded-xl border border-slate-200 bg-white p-5">
              <p class="text-sm font-semibold text-slate-700">{{ team.name }}</p>
              <p class="mt-2 text-4xl font-black text-primary">{{ team.score }}</p>

              @if (team.breakdownByCategory.length) {
                <ul class="mt-4 space-y-1 text-start text-xs text-slate-500">
                  @for (entry of team.breakdownByCategory; track entry.categoryId) {
                    <li class="flex justify-between">
                      <span>{{ entry.categoryNameEn }}</span>
                      <span class="font-medium text-slate-700">{{ entry.points }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>

        <div class="mt-8 flex justify-center gap-3">
          <button
            type="button"
            class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            (click)="playAgain()"
          >
            {{ 'game.results.playAgain' | translate }}
          </button>
          <a
            routerLink="/"
            class="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {{ 'game.results.backHome' | translate }}
          </a>
        </div>
      </div>
    }
  `,
})
export class ResultsComponent implements OnInit {
  private readonly gameService = inject(GameService);
  private readonly gameState = inject(GameStateService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly results = signal<GameSessionResults | null>(null);

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    this.gameService.getResults(sessionId).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load results.'));
      },
    });
  }

  protected winnerName(): string | null {
    const results = this.results();
    if (!results || results.teams.length !== 2) return null;
    const [a, b] = results.teams;
    if (a.score === b.score) return null;
    return a.score > b.score ? a.name : b.name;
  }

  protected isTie(): boolean {
    const results = this.results();
    if (!results || results.teams.length !== 2) return false;
    return results.teams[0].score === results.teams[1].score;
  }

  protected playAgain(): void {
    this.gameState.reset();
    this.router.navigateByUrl('/play');
  }
}

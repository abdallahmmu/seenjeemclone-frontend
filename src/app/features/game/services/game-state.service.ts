import { Injectable, computed, signal } from '@angular/core';
import { GameSession } from '../../../core/models/game.model';

/** Holds the current in-progress game session, refetched in full after each mutation. */
@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly sessionSignal = signal<GameSession | null>(null);

  readonly session = this.sessionSignal.asReadonly();

  readonly activeTeam = computed(() => {
    const session = this.sessionSignal();
    return session ? (session.teams.find((team) => team.index === session.currentTeamIndex) ?? null) : null;
  });

  setSession(session: GameSession): void {
    this.sessionSignal.set(session);
  }

  reset(): void {
    this.sessionSignal.set(null);
  }
}

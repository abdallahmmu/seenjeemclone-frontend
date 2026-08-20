import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../../core/models/api.model';
import { Category } from '../../../core/models/category.model';
import {
  CreateGameSessionRequest,
  GameSession,
  GameSessionResults,
  ResolveTileRequest,
  ResolveTileResponse,
  RevealTileResponse,
  Tile,
  TileQuestion,
} from '../../../core/models/game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /**
   * Player-facing browse endpoint — any logged-in user, active packs only,
   * no question/answer content. Separate from /admin/categories, which
   * stays the ADMIN/SUPER_ADMIN authoring surface.
   */
  getCategoriesForSetup(): Observable<Category[]> {
    return this.http.get<ApiEnvelope<Category[]>>(`${this.base}/categories`).pipe(map((res) => res.data));
  }

  createSession(payload: CreateGameSessionRequest): Observable<GameSession> {
    return this.http
      .post<ApiEnvelope<GameSession>>(`${this.base}/game-sessions`, payload)
      .pipe(map((res) => res.data));
  }

  getSession(id: string): Observable<GameSession> {
    return this.http.get<ApiEnvelope<GameSession>>(`${this.base}/game-sessions/${id}`).pipe(map((res) => res.data));
  }

  getResults(id: string): Observable<GameSessionResults> {
    return this.http
      .get<ApiEnvelope<GameSessionResults>>(`${this.base}/game-sessions/${id}/results`)
      .pipe(map((res) => res.data));
  }

  /** Starts the client-visible elapsed-time count the first time it's called for a tile. */
  getTileQuestion(sessionId: string, tileId: string): Observable<TileQuestion> {
    return this.http
      .get<ApiEnvelope<TileQuestion>>(`${this.base}/game-sessions/${sessionId}/tiles/${tileId}/question`)
      .pipe(map((res) => res.data));
  }

  /** Reveals the correct answer + explanation — call after "Next", before resolving. */
  revealTile(sessionId: string, tileId: string): Observable<RevealTileResponse> {
    return this.http
      .get<ApiEnvelope<RevealTileResponse>>(`${this.base}/game-sessions/${sessionId}/tiles/${tileId}/reveal`)
      .pipe(map((res) => res.data));
  }

  /** الفخ — any tile, for the owning team, only valid BEFORE the question is opened. */
  invokeTrap(sessionId: string, tileId: string): Observable<Tile> {
    return this.http
      .post<ApiEnvelope<Tile>>(`${this.base}/game-sessions/${sessionId}/tiles/${tileId}/trap`, {})
      .pipe(map((res) => res.data));
  }

  /** الحفرة — valid before or during the question, for the owning team. */
  invokeHole(sessionId: string, tileId: string): Observable<Tile> {
    return this.http
      .post<ApiEnvelope<Tile>>(`${this.base}/game-sessions/${sessionId}/tiles/${tileId}/hole`, {})
      .pipe(map((res) => res.data));
  }

  /** محاولتين — valid before or during the question, for the owning team. */
  invokeDoubleAnswer(sessionId: string, tileId: string): Observable<Tile> {
    return this.http
      .post<ApiEnvelope<Tile>>(`${this.base}/game-sessions/${sessionId}/tiles/${tileId}/double-answer`, {})
      .pipe(map((res) => res.data));
  }

  /** Host-judged resolution: names the team (if any) that gets the point value. */
  resolveTile(sessionId: string, tileId: string, payload: ResolveTileRequest): Observable<ResolveTileResponse> {
    return this.http
      .post<ApiEnvelope<ResolveTileResponse>>(
        `${this.base}/game-sessions/${sessionId}/tiles/${tileId}/resolve`,
        payload,
      )
      .pipe(map((res) => res.data));
  }
}

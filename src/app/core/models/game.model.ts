import { Difficulty, QuestionMediaType } from './question.model';

export interface Team {
  id: string;
  sessionId: string;
  index: number;
  name: string;
  hasTrap: boolean;
  hasHole: boolean;
  /** محاولتين — gives the team a second attempt at a question. */
  hasDoubleAnswer: boolean;
  score: number;
  trapUsed: boolean;
  holeUsed: boolean;
  doubleAnswerUsed: boolean;
}

export interface Tile {
  id: string;
  sessionId: string;
  categoryId: string;
  difficulty: Difficulty;
  questionId: string;
  /** Whose board slot this is — only this team may pick it, only on their turn. */
  ownerTeamIndex: number;
  answered: boolean;
  pickedAt: string | null;
  /**
   * The team actually credited at resolution time — set by the host, not
   * always ownerTeamIndex. Under الفخ this is the FORCED (redirected) team,
   * and it stays set even when the credit is a penalty (pointsAwarded < 0).
   */
  answeringTeamIndex: number | null;
  /** Before the question opens only — forces the other team to be the only one who can be credited. */
  trapInvoked: boolean;
  /** Before or during the question — steals the awarded points from the opposing team on a correct answer. */
  holeInvoked: boolean;
  /** Before or during the question — gives the owning team a second attempt. */
  doubleAnswerInvoked: boolean;
  wasCorrect: boolean | null;
  /** Negative when الفخ's forced team failed to answer (a penalty, not a no-op). */
  pointsAwarded: number | null;
  resolvedAt: string | null;
}

export interface GameSession {
  id: string;
  name: string;
  createdBy: string;
  currentTeamIndex: number;
  createdAt: string;
  teams: Team[];
  tiles: Tile[];
}

export interface TeamSetupInput {
  name: string;
  hasTrap?: boolean;
  hasHole?: boolean;
  hasDoubleAnswer?: boolean;
}

/** Exactly two teams, and at least 6 categories (2 rows x 3+ columns board). */
export interface CreateGameSessionRequest {
  name: string;
  teams: [TeamSetupInput, TeamSetupInput];
  categoryIds: string[];
}

/** Never carries correctOptionIndex/explanation — those leak only via the reveal endpoint. */
export interface TileQuestion {
  id: string;
  difficulty: Difficulty;
  ownerTeamIndex: number;
  text: string;
  options: string[];
  mediaType: QuestionMediaType | null;
  mediaUrl: string | null;
  pickedAt: string;
}

export interface RevealTileResponse {
  correctOptionIndex: number;
  explanation: string | null;
}

/** Host-judged: names which team (if either) gets the point value after reading the revealed answer aloud. */
export interface ResolveTileRequest {
  awardedTeamIndex: number | null;
}

export interface ResolveTileResponse {
  tile: Tile;
  nextTeamIndex: number;
}

export interface TeamResultBreakdownEntry {
  categoryId: string;
  categoryNameEn: string;
  points: number;
}

export interface TeamResult {
  id: string;
  name: string;
  score: number;
  breakdownByCategory: TeamResultBreakdownEntry[];
}

export interface GameSessionResults {
  teams: TeamResult[];
}

/** Mirrors the backend's POINTS_BY_DIFFICULTY — point values live in app code, not the schema. */
export const POINTS_BY_DIFFICULTY: Record<Difficulty, number> = { EASY: 200, MEDIUM: 400, HARD: 600 };

/** The board requires exactly this many category packs (2 rows x 3 columns) — not a minimum. */
export const GAME_CATEGORIES_COUNT = 6;

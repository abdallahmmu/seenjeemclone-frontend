/** Question content is Arabic-only by design — no bilingual fields here. */
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

/** An optional clip alongside the question text. Never both set to different truthiness — see mediaUrl. */
export type QuestionMediaType = 'AUDIO' | 'VIDEO' | 'IMAGE';

export interface Question {
  id: string;
  categoryId: string;
  difficulty: Difficulty;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string | null;
  /** Never uploaded/stored by this app — an external link only (direct file or a YouTube/Vimeo-style embed). */
  mediaType: QuestionMediaType | null;
  mediaUrl: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateQuestionRequest {
  categoryId: string;
  difficulty: Difficulty;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
  mediaType?: QuestionMediaType | null;
  mediaUrl?: string | null;
  active?: boolean;
}

export type UpdateQuestionRequest = Partial<CreateQuestionRequest>;

export interface BulkImportSummary {
  total: number;
  valid: number;
  invalid: number;
}

export interface BulkImportRow {
  rowIndex: number;
  valid: boolean;
  errors?: string[];
  data?: CreateQuestionRequest;
}

export interface BulkImportPreviewResponse {
  mode: 'PREVIEW';
  summary: BulkImportSummary;
  rows: BulkImportRow[];
}

export interface BulkImportCommitResponse {
  mode: 'COMMIT';
  summary: BulkImportSummary;
  imported: Question[];
}

export type BulkImportResponse = BulkImportPreviewResponse | BulkImportCommitResponse;

/** When a helper tool may be invoked, relative to a tile's question opening. */
export type HelperToolTiming = 'BEFORE_ONLY' | 'BEFORE_OR_DURING';

/**
 * Content-managed catalog row — shown on the landing page and the game
 * setup screen. `key` binds a row to real gameplay behavior (only "trap",
 * "hole", and "double_answer" have that today — see game.model.ts).
 */
export interface HelperTool {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconUrl: string | null;
  timing: HelperToolTiming;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface CreateHelperToolRequest {
  key: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  timing?: HelperToolTiming;
  order?: number;
  active?: boolean;
}

export type UpdateHelperToolRequest = Partial<
  Pick<CreateHelperToolRequest, 'nameEn' | 'nameAr' | 'descriptionEn' | 'descriptionAr' | 'timing' | 'order' | 'active'>
>;

/** The three keys with real, wired-up scoring behavior — see game.model.ts's Team/Tile flags. */
export const WIRED_HELPER_TOOL_KEYS = ['trap', 'hole', 'double_answer'] as const;
export type WiredHelperToolKey = (typeof WIRED_HELPER_TOOL_KEYS)[number];

import { User } from './user.model';

export type PromoCodeType = 'PERCENTAGE' | 'FLAT_CREDITS';

export interface PromoCode {
  id: string;
  code: string;
  type: PromoCodeType;
  discountPercent: number | null;
  creditAmount: number | null;
  /** Admin-chosen cap of 1 or 2 — how many times a single user may redeem this code. */
  maxRedemptionsPerUser: number;
  expiresAt: string | null;
  targetUserId: string | null;
  /** Populated by the backend for display — null means any user may redeem it. */
  targetUser: { handle: string } | null;
  active: boolean;
  createdAt: string;
}

export interface CreatePromoCodeRequest {
  code: string;
  type: PromoCodeType;
  discountPercent?: number;
  creditAmount?: number;
  maxRedemptionsPerUser?: number;
  expiresAt?: string | null;
  /** Admin enters the target account's handle, not its id — the backend resolves it. */
  targetUserHandle?: string | null;
  active?: boolean;
}

export interface UpdatePromoCodeRequest {
  discountPercent?: number;
  creditAmount?: number;
  maxRedemptionsPerUser?: number;
  expiresAt?: string | null;
  targetUserHandle?: string | null;
  active?: boolean;
}

export interface PromoRedemption {
  id: string;
  promoCodeId: string;
  userId: string;
  creditsGranted: number | null;
  discountPercent: number | null;
  /** Null means a PERCENTAGE discount is still banked, waiting to auto-apply to the next purchase order. */
  discountUsedAt: string | null;
  createdAt: string;
}

export interface RedeemPromoCodeResponse {
  user: User;
  redemption: PromoRedemption;
}

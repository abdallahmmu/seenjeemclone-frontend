import { CreditPackage } from './credit-package.model';
import { PaymentMethod } from './payment-method.model';

export type PurchaseOrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PurchaseOrder {
  id: string;
  userId: string;
  packageId: string;
  paymentMethodId: string;
  creditsRequested: number;
  originalPriceEgp: number;
  priceEgp: number;
  promoCodeId: string | null;
  proofImageUrl: string;
  status: PurchaseOrderStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  /** Included by both the player's own list and the admin review queue. */
  package?: CreditPackage;
  paymentMethod?: PaymentMethod;
  /** Included only in the admin review queue. */
  user?: { id: string; email: string; handle: string };
}

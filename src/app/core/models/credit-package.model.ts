export interface CreditPackage {
  id: string;
  credits: number;
  priceEgp: number;
  imageUrl: string | null;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface CreateCreditPackageRequest {
  credits: number;
  priceEgp: number;
  order?: number;
  active?: boolean;
}

export type UpdateCreditPackageRequest = Partial<CreateCreditPackageRequest>;

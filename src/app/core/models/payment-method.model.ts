export interface PaymentMethod {
  id: string;
  name: string;
  imageUrl: string | null;
  instructions: string | null;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface CreatePaymentMethodRequest {
  name: string;
  instructions?: string | null;
  order?: number;
  active?: boolean;
}

export type UpdatePaymentMethodRequest = Partial<CreatePaymentMethodRequest>;

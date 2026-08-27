import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../../core/models/api.model';
import { CreditPackage } from '../../../core/models/credit-package.model';
import { PaymentMethod } from '../../../core/models/payment-method.model';
import { PurchaseOrder } from '../../../core/models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** Player-facing browse — active packages only, no admin fields. */
  getCreditPackages(): Observable<CreditPackage[]> {
    return this.http.get<ApiEnvelope<CreditPackage[]>>(`${this.base}/credit-packages`).pipe(map((res) => res.data));
  }

  /** Player-facing browse — active payment methods only. */
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<ApiEnvelope<PaymentMethod[]>>(`${this.base}/payment-methods`).pipe(map((res) => res.data));
  }

  /**
   * Submits a buy request: the chosen package + payment method, plus a
   * screenshot proving the manual transfer — there is no live payment
   * integration, an admin verifies this by eye and approves it later.
   */
  submitPurchaseOrder(packageId: string, paymentMethodId: string, proof: File): Observable<PurchaseOrder> {
    const formData = new FormData();
    formData.append('packageId', packageId);
    formData.append('paymentMethodId', paymentMethodId);
    formData.append('proof', proof);
    return this.http
      .post<ApiEnvelope<PurchaseOrder>>(`${this.base}/purchase-orders`, formData)
      .pipe(map((res) => res.data));
  }

  /** The caller's own buy requests, newest first. */
  getMyPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http.get<ApiEnvelope<PurchaseOrder[]>>(`${this.base}/purchase-orders`).pipe(map((res) => res.data));
  }
}

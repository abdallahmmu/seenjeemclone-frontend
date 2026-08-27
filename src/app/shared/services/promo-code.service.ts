import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../../core/models/api.model';
import { RedeemPromoCodeResponse } from '../../core/models/promo-code.model';

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /**
   * FLAT_CREDITS codes add credits immediately (reflected in the returned
   * user); PERCENTAGE codes bank a pending discount that auto-applies to
   * the caller's next purchase order — see purchase-order.model.ts.
   */
  redeem(code: string): Observable<RedeemPromoCodeResponse> {
    return this.http
      .post<ApiEnvelope<RedeemPromoCodeResponse>>(`${this.base}/promo-codes/redeem`, { code })
      .pipe(map((res) => res.data));
  }
}

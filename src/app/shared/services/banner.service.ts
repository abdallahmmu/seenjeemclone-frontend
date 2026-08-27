import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../../core/models/api.model';
import { Banner } from '../../core/models/banner.model';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /**
   * Which active banners are due to show the caller right now — the backend
   * records an impression for each one returned in this same call, so
   * calling this IS "marking them shown." Call it once per app session
   * (e.g. on login), not on every navigation.
   */
  getActiveBanners(): Observable<Banner[]> {
    return this.http.get<ApiEnvelope<Banner[]>>(`${this.base}/banners/active`).pipe(map((res) => res.data));
  }
}

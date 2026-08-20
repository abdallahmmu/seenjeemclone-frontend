import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../models/api.model';
import { HelperTool } from '../models/helper-tool.model';

/**
 * Public, unauthenticated catalog read — used by both the anonymous landing
 * page and the (logged-in) game setup screen, so it lives in core, not
 * under features/game like GameService's other calls.
 */
@Injectable({ providedIn: 'root' })
export class HelperToolService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getHelperTools(): Observable<HelperTool[]> {
    return this.http.get<ApiEnvelope<HelperTool[]>>(`${this.base}/helper-tools`).pipe(map((res) => res.data));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SendContactMessageRequest } from '../models/contact.model';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  send(payload: SendContactMessageRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/contact`, payload);
  }
}

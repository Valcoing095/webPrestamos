import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Settlement, SettlementPreview } from '../models';
import { Page } from '../api/page';

/** Liquidaciones: el cálculo vive en el backend */
@Injectable({ providedIn: 'root' })
export class SettlementService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/settlements`;

  preview(from: string, to: string): Observable<SettlementPreview> {
    return this.http.get<SettlementPreview>(`${this.url}/preview`, { params: { from, to } });
  }

  close(lenderId: string, from: string, to: string): Observable<Settlement> {
    return this.http.post<Settlement>(`${this.url}/close`, { lenderId, from, to });
  }

  list(query: Record<string, string | number> = {}): Observable<Page<Settlement>> {
    return this.http.get<Page<Settlement>>(this.url, { params: query });
  }
}

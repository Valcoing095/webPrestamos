import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary, FollowUpFilters, FollowUpItem } from '../models';

/** Dashboard y seguimiento calculados en el backend */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/reports`;

  dashboard(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.url}/dashboard`);
  }

  /** Seguimiento filtrado en el backend; los filtros vacíos no se envían */
  followUp(filters: FollowUpFilters = {}): Observable<FollowUpItem[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<FollowUpItem[]>(`${this.url}/follow-up`, { params });
  }
}

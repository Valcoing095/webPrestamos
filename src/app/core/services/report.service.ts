import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary, FollowUpItem } from '../models';

/** Dashboard y seguimiento calculados en el backend */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/reports`;

  dashboard(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.url}/dashboard`);
  }

  followUp(): Observable<FollowUpItem[]> {
    return this.http.get<FollowUpItem[]>(`${this.url}/follow-up`);
  }
}

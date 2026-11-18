import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Loan, MoraAlertDto, MoraSeverity } from '../models';
import { LoanService } from './loan.service';
import { PersonService } from './person.service';

export type { MoraSeverity };

export interface MoraAlert extends MoraAlertDto {
  loan: Loan;
  personName: string;
}

/**
 * La mora se calcula en el backend (GET /collections/alerts).
 * Aquí solo se guarda el resultado y se enlaza con préstamo y cliente.
 */
@Injectable({ providedIn: 'root' })
export class MoraService {
  private http = inject(HttpClient);
  private loanService = inject(LoanService);
  private personService = inject(PersonService);

  private raw = signal<MoraAlertDto[]>([]);
  loading = signal(false);

  /** Alertas (vencidas y que vencen hoy), ya ordenadas por gravedad desde el backend */
  alerts = computed<MoraAlert[]>(() => {
    const loansById = new Map(this.loanService.getDataSignal()().map((l) => [l.id, l]));
    const personsById = new Map(this.personService.getDataSignal()().map((p) => [p.id, p]));
    return this.raw()
      .filter((a) => loansById.has(a.loanId))
      .map((a) => ({
        ...a,
        loan: loansById.get(a.loanId)!,
        personName: personsById.get(a.personId)?.name || 'Desconocido',
      }));
  });

  overdueAlerts = computed(() => this.alerts().filter((a) => !a.isDueToday));
  overdueCount = computed(() => this.overdueAlerts().length);

  load(): Observable<MoraAlertDto[]> {
    this.loading.set(true);
    return this.http.get<MoraAlertDto[]>(`${environment.apiUrl}/collections/alerts`).pipe(
      tap({
        next: (items) => {
          this.raw.set(items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }

  getAlerts(): MoraAlert[] {
    return this.alerts();
  }

  getOverdueAlerts(): MoraAlert[] {
    return this.overdueAlerts();
  }

  getOverdueCount(): number {
    return this.overdueCount();
  }

  /** Alerta de un préstamo concreto, o null si está al día */
  getLoanAlert(loan: Loan): MoraAlert | null {
    return this.alerts().find((a) => a.loanId === loan.id) ?? null;
  }

  clear(): void {
    this.raw.set([]);
  }
}

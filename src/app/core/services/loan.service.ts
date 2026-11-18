import { Injectable, Injector, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiDataService } from './api-data.service';
import { MoraService } from './mora.service';
import { PaymentService } from './payment.service';
import { Loan, LoanInput, LoanSchedule, PaymentFrequency, TrackingNote } from '../models';
import { Page } from '../api/page';

@Injectable({
  providedIn: 'root',
})
export class LoanService extends ApiDataService<Loan, LoanInput> {
  protected readonly path = '/loans';
  private injector = inject(Injector);

  // La mora depende de los préstamos: tras cualquier cambio se vuelve a pedir al backend
  private syncMora = () => this.injector.get(MoraService).load().subscribe();

  override create(data: LoanInput): Observable<Loan> {
    return super.create(data).pipe(tap(this.syncMora));
  }

  override update(id: string, data: Partial<LoanInput>): Observable<Loan> {
    return super.update(id, data).pipe(tap(this.syncMora));
  }

  /** Alias con el nombre que usaban los componentes */
  updateLoan(id: string, data: Partial<LoanInput>): Observable<Loan> {
    return this.update(id, data);
  }

  /** Elimina el préstamo (el backend borra también sus notas) */
  override delete(id: string): Observable<void> {
    return super.delete(id).pipe(
      tap(() => {
        this.injector.get(PaymentService).load().subscribe();
        this.syncMora();
      }),
    );
  }

  deleteCascade(loanId: string): Observable<void> {
    return this.delete(loanId);
  }

  /** Reemplaza un préstamo de la caché (p. ej. tras registrar un pago) */
  patchCache(loan: Loan): void {
    this.dataSignal.update((items) => items.map((l) => (l.id === loan.id ? loan : l)));
  }

  getByPersonId(personId: string): Loan[] {
    return this.filter((l) => l.personId === personId);
  }

  getByLenderId(lenderId: string): Loan[] {
    return this.filter((l) => l.lenderId === lenderId);
  }

  getByRouteId(routeId: string): Loan[] {
    return this.filter((l) => l.routeId === routeId);
  }

  // Préstamos de gestión propia (sin prestamista asignado)
  getOwnLoans(): Loan[] {
    return this.filter((l) => l.loanType === 'own' || !l.lenderId);
  }

  // Préstamos gestionados por prestamistas
  getLenderLoans(): Loan[] {
    return this.filter((l) => l.loanType === 'lender' && !!l.lenderId);
  }

  getActiveOwnLoans(): Loan[] {
    return this.getOwnLoans().filter((l) => l.status !== 'completed');
  }

  getActiveLoansByLender(lenderId: string): Loan[] {
    return this.getByLenderId(lenderId).filter((l) => l.status !== 'completed');
  }

  getActiveLoans(): Loan[] {
    return this.filter((l) => l.status !== 'completed');
  }

  getCompletedLoans(): Loan[] {
    return this.filter((l) => l.status === 'completed');
  }

  getOverdueLoans(): Loan[] {
    return this.filter((l) => l.status === 'overdue');
  }

  // --- Notas de seguimiento (recurso /loans/:id/notes) ---

  getNotes(loanId: string): Observable<TrackingNote[]> {
    return this.http.get<TrackingNote[]>(`${this.url}/${loanId}/notes`);
  }

  addNote(loanId: string, text: string): Observable<TrackingNote> {
    return this.http.post<TrackingNote>(`${this.url}/${loanId}/notes`, { text });
  }

  deleteNote(loanId: string, noteId: string): Observable<void> {
    return this.http.delete<unknown>(`${this.url}/${loanId}/notes/${noteId}`).pipe(map(() => undefined));
  }

  // --- Calendario de cuotas (calculado en el backend) ---

  getSchedule(loanId: string): Observable<LoanSchedule> {
    return this.http.get<LoanSchedule>(`${this.url}/${loanId}/schedule`);
  }

  /** Listado paginado (la caché usa /all; esto sirve para pantallas con filtros del servidor) */
  getPage(query: Record<string, string | number> = {}): Observable<Page<Loan>> {
    return this.http.get<Page<Loan>>(this.url, { params: query });
  }
}

/**
 * Normaliza los datos de un formulario de préstamo al contrato del backend:
 * `totalToCollect` solo se envía si es > 0 (el backend lo calcula con el interés si falta).
 */
export function toLoanPayload(form: {
  personId: string;
  date: string;
  amount: number;
  interest: number;
  totalToCollect: number;
  paymentFrequency: PaymentFrequency;
  notes: string;
}): LoanInput {
  const payload: LoanInput = {
    personId: form.personId,
    date: form.date,
    amount: Number(form.amount),
    interest: Number(form.interest) || 0,
    paymentFrequency: form.paymentFrequency,
    notes: form.notes ?? '',
  };
  if (Number(form.totalToCollect) > 0) payload.totalToCollect = Number(form.totalToCollect);
  return payload;
}

export class LoanCalculator {
  /** Solo para previsualizar en formularios; el backend calcula el valor definitivo */
  static calculateTotalWithInterest(amount: number, interest: number, totalToCollect?: number): number {
    if (totalToCollect && totalToCollect > 0) {
      return totalToCollect;
    }
    if (!interest || interest === 0) {
      return amount;
    }
    return amount + (amount * interest) / 100;
  }

  static getFrequencyLabel(frequency: PaymentFrequency): string {
    switch (frequency) {
      case 'daily':
        return 'Diario';
      case 'weekly':
        return 'Semanal';
      case 'biweekly':
        return 'Quincenal';
      case 'monthly':
      default:
        return 'Mensual';
    }
  }

  /** Resumen de una lista de préstamos usando el `paidAmount` que mantiene el backend */
  static getSummary(loans: Loan[]) {
    const totalLoaned = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalToCollect = loans.reduce((sum, l) => sum + (l.totalToCollect || l.amount), 0);
    const totalCollected = loans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
    const totalPending = Math.max(0, totalToCollect - totalCollected);
    const activeCount = loans.filter((l) => l.status !== 'completed').length;

    return { totalLoaned, totalCollected, totalPending, activeCount };
  }

  static formatCurrency(amount: number): string {
    // Sin decimales: montos más cortos que no desbordan las tarjetas
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static formatDate(dateStr: string): string {
    if (!dateStr) return '';
    // Parsear como fecha local: con `new Date('2026-10-15')` (UTC) en
    // zonas UTC- la fecha se mostraba un día antes
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    const date = year && month && day ? new Date(year, month - 1, day) : new Date(dateStr);
    return date.toLocaleDateString('es-MX');
  }
}

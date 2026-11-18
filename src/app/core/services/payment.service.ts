import { Injectable, Injector, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiDataService } from './api-data.service';
import { LoanService } from './loan.service';
import { MoraService } from './mora.service';
import { Payment, PaymentInput } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PaymentService extends ApiDataService<Payment, PaymentInput> {
  protected readonly path = '/payments';
  private injector = inject(Injector);

  // Registrar/borrar un pago cambia paidAmount/status del préstamo y la mora
  private syncDependents = () => {
    this.injector.get(LoanService).load().subscribe();
    this.injector.get(MoraService).load().subscribe();
  };

  override create(data: PaymentInput): Observable<Payment> {
    return super.create(data).pipe(tap(this.syncDependents));
  }

  override delete(id: string): Observable<void> {
    return super.delete(id).pipe(tap(this.syncDependents));
  }

  /** El backend no permite editar pagos (solo crear/eliminar) */

  getByLoanId(loanId: string): Payment[] {
    return this.filter((p) => p.loanId === loanId);
  }

  /** Total abonado según el backend (`loan.paidAmount`) */
  getTotalPaidForLoan(loanId: string): number {
    return this.injector.get(LoanService).getById(loanId)?.paidAmount ?? 0;
  }

  getPaymentsByDateRange(startDate: string, endDate: string): Payment[] {
    return this.filter((p) => p.date >= startDate && p.date <= endDate);
  }
}

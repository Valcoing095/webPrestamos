import { Injectable, inject } from '@angular/core';
import { Loan, Payment, PaymentFrequency } from '../models';
import { LoanService } from './loan.service';
import { PaymentService } from './payment.service';
import { PersonService } from './person.service';

export type MoraSeverity = 'today' | 'low' | 'medium' | 'high';

export interface MoraAlert {
  loan: Loan;
  personId: string;
  personName: string;
  /** Fecha en que debía hacerse el siguiente pago */
  nextDueDate: string;
  /** Días de atraso (0 si vence hoy) */
  daysOverdue: number;
  /** Cuántas cuotas han vencido sin pagarse */
  missedPayments: number;
  /** Saldo pendiente de la deuda */
  pendingAmount: number;
  /** Fecha del último pago, o null si nunca ha pagado */
  lastPaymentDate: string | null;
  severity: MoraSeverity;
  isDueToday: boolean;
}

/**
 * Calcula la mora a partir de los datos que ya existen:
 * la fecha del préstamo, su frecuencia y su último pago.
 * No depende del campo `status` (que nunca se actualizaba solo).
 */
@Injectable({ providedIn: 'root' })
export class MoraService {
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private personService = inject(PersonService);

  /** Alertas del usuario: vencidas primero (mayor gravedad), luego las que vencen hoy */
  getAlerts(userId: string): MoraAlert[] {
    if (!userId) return [];
    const loans = this.loanService.getLoansSignal(userId)();
    const alerts = loans
      .map(loan => this.getLoanAlert(loan))
      .filter((a): a is MoraAlert => a !== null);

    const weight: Record<MoraSeverity, number> = { high: 0, medium: 1, low: 2, today: 3 };
    return alerts.sort((a, b) =>
      weight[a.severity] - weight[b.severity] || b.daysOverdue - a.daysOverdue,
    );
  }

  /** Solo las deudas ya vencidas (sin contar las que vencen hoy) */
  getOverdueAlerts(userId: string): MoraAlert[] {
    return this.getAlerts(userId).filter(a => !a.isDueToday);
  }

  getOverdueCount(userId: string): number {
    return this.getOverdueAlerts(userId).length;
  }

  /**
   * Alerta de una deuda concreta, o null si está al día o ya se pagó.
   * Lee los signals de datos: si se llama dentro de un computed,
   * se recalcula automáticamente al registrar pagos o préstamos.
   */
  getLoanAlert(loan: Loan): MoraAlert | null {
    const total = loan.totalToCollect || loan.amount;
    const payments = this.paymentService.getByLoanId(loan.id);
    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (total > 0 && paid >= total) return null; // deuda saldada

    const lastPaymentDate = payments.length
      ? payments.map(p => p.date).sort().at(-1)!
      : null;

    // El siguiente pago se espera un periodo después del préstamo o del último abono
    const baseDate = lastPaymentDate ?? loan.date;
    const nextDue = this.addPeriod(this.parseLocal(baseDate), loan.paymentFrequency);
    const today = this.startOfDay(new Date());

    const daysOverdue = Math.round((today.getTime() - this.startOfDay(nextDue).getTime()) / 86_400_000);
    const isDueToday = daysOverdue === 0;
    const markedOverdue = loan.status === 'overdue';

    if (daysOverdue < 0) return null; // aún no vence
    if (daysOverdue === 0 && !markedOverdue) {
      // Vence hoy: aviso preventivo
      return this.buildAlert(loan, payments, nextDue, 0, 0, 'today', true, lastPaymentDate, total - paid);
    }
    if (daysOverdue === 0 && markedOverdue) {
      return this.buildAlert(loan, payments, nextDue, 0, 1, 'low', false, lastPaymentDate, total - paid);
    }

    // Cuotas vencidas: periodos completos desde la fecha debida hasta hoy
    let missed = 0;
    let cursor = new Date(nextDue);
    while (cursor <= today && missed < 500) {
      missed++;
      cursor = this.addPeriod(cursor, loan.paymentFrequency);
    }

    const severity: MoraSeverity =
      daysOverdue > 30 || missed >= 4 ? 'high'
      : daysOverdue > 7 || missed >= 2 ? 'medium'
      : 'low';

    return this.buildAlert(loan, payments, nextDue, daysOverdue, missed, severity, false, lastPaymentDate, total - paid);
  }

  private buildAlert(
    loan: Loan,
    _payments: Payment[],
    nextDue: Date,
    daysOverdue: number,
    missedPayments: number,
    severity: MoraSeverity,
    isDueToday: boolean,
    lastPaymentDate: string | null,
    pendingAmount: number,
  ): MoraAlert {
    return {
      loan,
      personId: loan.personId,
      personName: this.personService.getById(loan.personId)?.name || 'Desconocido',
      nextDueDate: this.toISODate(nextDue),
      daysOverdue,
      missedPayments,
      pendingAmount: Math.max(0, pendingAmount),
      lastPaymentDate,
      severity,
      isDueToday,
    };
  }

  /** Suma un periodo según la frecuencia (mensual = mes calendario) */
  private addPeriod(date: Date, frequency: PaymentFrequency): Date {
    const d = new Date(date);
    switch (frequency) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'biweekly':
        d.setDate(d.getDate() + 15);
        break;
      case 'monthly':
      default:
        d.setMonth(d.getMonth() + 1);
        break;
    }
    return d;
  }

  private parseLocal(dateStr: string): Date {
    const [y, m, d] = (dateStr || '').split('T')[0].split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d) : new Date(dateStr);
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private toISODate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}

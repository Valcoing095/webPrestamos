import { Injectable, signal, computed, Signal } from '@angular/core';
import { DataService } from './data.service';
import { StorageService } from './storage.service';
import { Loan, PaymentFrequency, LoanType } from '../models';
import { PaymentService } from './payment.service';

@Injectable({
  providedIn: 'root',
})
export class LoanService extends DataService<Loan> {
  private paymentServiceSignal = signal<PaymentService | null>(null);

  constructor(storageService: StorageService) {
    super('loans', storageService);
  }

  setPaymentService(paymentService: PaymentService): void {
    this.paymentServiceSignal.set(paymentService);
  }

  private getPaymentService(): PaymentService | null {
    return this.paymentServiceSignal();
  }

  create(data: Partial<Loan>): Loan {
    const loan = new Loan(data);

    if (!loan.isValid()) {
      throw new Error(loan.validate().join(', '));
    }

    return this.add(loan.toJSON() as Loan);
  }

  updateLoan(id: string, data: Partial<Loan>): Loan | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const loan = new Loan(existing);
    loan.update(data);

    if (!loan.isValid()) {
      throw new Error(loan.validate().join(', '));
    }

    return this.update(id, loan.toJSON() as Loan);
  }

  getByUserId(userId: string): Loan[] {
    return this.filter((l) => l.userId === userId);
  }

  getLoansSignal(userId: string): Signal<Loan[]> {
    return computed(() => {
      const allLoans = this.getDataSignal()();
      return allLoans.filter((l) => l.userId === userId);
    });
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

  // Prestamos de gestion propia (sin prestamista asignado)
  getOwnLoans(userId: string): Loan[] {
    return this.filter((l) => l.userId === userId && (l.loanType === 'own' || !l.lenderId));
  }

  getOwnLoansSignal(userId: string): Signal<Loan[]> {
    return computed(() => {
      const allLoans = this.getDataSignal()();
      return allLoans.filter((l) => l.userId === userId && (l.loanType === 'own' || !l.lenderId));
    });
  }

  // Prestamos gestionados por prestamistas
  getLenderLoans(userId: string): Loan[] {
    return this.filter((l) => l.userId === userId && l.loanType === 'lender' && l.lenderId);
  }

  getLenderLoansSignal(userId: string): Signal<Loan[]> {
    return computed(() => {
      const allLoans = this.getDataSignal()();
      return allLoans.filter((l) => l.userId === userId && l.loanType === 'lender' && l.lenderId);
    });
  }

  // Prestamos activos de gestion propia
  getActiveOwnLoans(userId: string): Loan[] {
    const paymentService = this.getPaymentService();
    return this.getOwnLoans(userId).filter((loan) => {
      const totalPaid = paymentService ? paymentService.getTotalPaidForLoan(loan.id) : 0;
      const total = loan.totalToCollect || loan.amount;
      return totalPaid < total;
    });
  }

  // Prestamos activos por prestamista
  getActiveLoansByLender(lenderId: string): Loan[] {
    const paymentService = this.getPaymentService();
    return this.getByLenderId(lenderId).filter((loan) => {
      const totalPaid = paymentService ? paymentService.getTotalPaidForLoan(loan.id) : 0;
      const total = loan.totalToCollect || loan.amount;
      return totalPaid < total;
    });
  }

  getActiveLoans(userId: string): Loan[] {
    const paymentService = this.getPaymentService();
    return this.getByUserId(userId).filter((loan) => {
      const totalPaid = paymentService ? paymentService.getTotalPaidForLoan(loan.id) : 0;
      const total = loan.totalToCollect || loan.amount;
      return totalPaid < total;
    });
  }

  getActiveLoansSignal(userId: string, paymentService: PaymentService): Signal<Loan[]> {
    return computed(() => {
      return this.getByUserId(userId).filter((loan) => {
        const totalPaid = paymentService.getTotalPaidForLoan(loan.id);
        const total = loan.totalToCollect || loan.amount;
        return totalPaid < total;
      });
    });
  }

  getCompletedLoans(userId: string): Loan[] {
    const paymentService = this.getPaymentService();
    return this.getByUserId(userId).filter((loan) => {
      const totalPaid = paymentService ? paymentService.getTotalPaidForLoan(loan.id) : 0;
      const total = loan.totalToCollect || loan.amount;
      return totalPaid >= total;
    });
  }

  getOverdueLoans(userId: string): Loan[] {
    return this.getByUserId(userId).filter((loan) => {
      const l = new Loan(loan);
      return l.isOverdue();
    });
  }

  deleteCascade(loanId: string): boolean {
    const paymentService = this.getPaymentService();
    if (paymentService) {
      paymentService.deleteByLoanId(loanId);
    }
    return this.delete(loanId);
  }
}

export class LoanCalculator {
  static calculateTotalWithInterest(amount: number, interest: number, totalToCollect?: number): number {
    if (totalToCollect && totalToCollect > 0) {
      return totalToCollect;
    }
    if (!interest || interest === 0) {
      return amount;
    }
    return amount + (amount * interest) / 100;
  }

  static calculateMonthlyPayment(amount: number, interest: number, months: number): number {
    if (!interest || interest === 0 || months === 0) {
      return amount / months;
    }
    const total = this.calculateTotalWithInterest(amount, interest);
    return total / months;
  }

  static getPaymentsPerFrequency(frequency: PaymentFrequency): number {
    switch (frequency) {
      case 'daily':
        return 30;
      case 'weekly':
        return 4;
      case 'biweekly':
        return 2;
      case 'monthly':
      default:
        return 1;
    }
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

  static calculatePaymentByFrequency(
    amount: number,
    interest: number,
    frequency: PaymentFrequency,
    termMonths: number = 1,
  ): number {
    const total = this.calculateTotalWithInterest(amount, interest);
    if (!interest || interest === 0) {
      return total / (termMonths * this.getPaymentsPerFrequency(frequency));
    }
    const paymentsPerMonth = this.getPaymentsPerFrequency(frequency);
    const totalPayments = termMonths * paymentsPerMonth;
    return total / totalPayments;
  }

  static calculateNextPaymentDate(
    loanDate: string,
    frequency: PaymentFrequency,
    paymentsCount: number,
  ): string {
    const date = new Date(loanDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + paymentsCount);
        break;
      case 'weekly':
        date.setDate(date.getDate() + paymentsCount * 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + paymentsCount * 15);
        break;
      case 'monthly':
      default:
        date.setMonth(date.getMonth() + paymentsCount);
        break;
    }
    return date.toISOString().split('T')[0];
  }

  static calculateAutoInterest(amount: number, frequency: PaymentFrequency): number {
    switch (frequency) {
      case 'daily':
        return 3;
      case 'biweekly':
        return 10;
      case 'monthly':
      default:
        return 5;
    }
  }

  static getSummary(loans: Loan[], payments: { loanId: string; amount: number }[]) {
    const totalLoaned = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalToCollect = loans.reduce((sum, l) => sum + (l.totalToCollect || l.amount), 0);
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = totalToCollect - totalCollected;

    const paidByLoan = new Map<string, number>();
    payments.forEach((p) => {
      paidByLoan.set(p.loanId, (paidByLoan.get(p.loanId) || 0) + p.amount);
    });

    const activeCount = loans.filter((loan) => {
      const totalPaid = paidByLoan.get(loan.id) || 0;
      const total = loan.totalToCollect || loan.amount;
      return totalPaid < total;
    }).length;

    return { totalLoaned, totalCollected, totalPending, activeCount };
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  static formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX');
  }
}

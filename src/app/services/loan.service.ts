import { Injectable, signal } from '@angular/core';
import { DataService } from './data.service';
import { StorageService } from './storage.service';
import { Loan } from '../models';
import { PaymentService } from './payment.service';

@Injectable({
  providedIn: 'root'
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
    return this.filter(l => l.userId === userId);
  }

  getByPersonId(personId: string): Loan[] {
    return this.filter(l => l.personId === personId);
  }

  getActiveLoans(userId: string): Loan[] {
    const paymentService = this.getPaymentService();
    return this.getByUserId(userId).filter(loan => {
      const totalPaid = paymentService ? paymentService.getTotalPaidForLoan(loan.id) : 0;
      const total = LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
      return totalPaid < total;
    });
  }

  getCompletedLoans(userId: string): Loan[] {
    const paymentService = this.getPaymentService();
    return this.getByUserId(userId).filter(loan => {
      const totalPaid = paymentService ? paymentService.getTotalPaidForLoan(loan.id) : 0;
      const total = LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
      return totalPaid >= total;
    });
  }

  getOverdueLoans(userId: string): Loan[] {
    return this.getByUserId(userId).filter(loan => {
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
  static calculateTotalWithInterest(amount: number, interest: number): number {
    if (!interest || interest === 0) {
      return amount;
    }
    return amount + (amount * interest / 100);
  }

  static calculateMonthlyPayment(amount: number, interest: number, months: number): number {
    if (!interest || interest === 0 || months === 0) {
      return amount / months;
    }
    const total = this.calculateTotalWithInterest(amount, interest);
    return total / months;
  }

  static getSummary(loans: Loan[], payments: { loanId: string; amount: number }[]) {
    const totalLoaned = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = totalLoaned - totalCollected;

    const paidByLoan = new Map<string, number>();
    payments.forEach(p => {
      paidByLoan.set(p.loanId, (paidByLoan.get(p.loanId) || 0) + p.amount);
    });

    const activeCount = loans.filter(loan => {
      const totalPaid = paidByLoan.get(loan.id) || 0;
      const total = this.calculateTotalWithInterest(loan.amount, loan.interest);
      return totalPaid < total;
    }).length;

    return { totalLoaned, totalCollected, totalPending, activeCount };
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  static formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX');
  }
}

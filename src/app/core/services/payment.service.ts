import { Injectable, computed, Signal } from '@angular/core';
import { DataService } from './data.service';
import { StorageService } from './storage.service';
import { Payment } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PaymentService extends DataService<Payment> {
  constructor(storageService: StorageService) {
    super('payments', storageService);
  }

  create(data: Partial<Payment>): Payment {
    const payment = new Payment(data);

    if (!payment.isValid()) {
      throw new Error(payment.validate().join(', '));
    }

    return this.add(payment.toJSON() as Payment);
  }

  getByUserId(userId: string): Payment[] {
    return this.filter((p) => p.userId === userId);
  }

  getPaymentsSignal(userId: string): Signal<Payment[]> {
    return computed(() => {
      const allPayments = this.getDataSignal()();
      return allPayments.filter((p) => p.userId === userId);
    });
  }

  getByLoanId(loanId: string): Payment[] {
    return this.filter((p) => p.loanId === loanId);
  }

  getTotalPaidForLoan(loanId: string): number {
    const payments = this.getByLoanId(loanId);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  getPaymentsByDateRange(userId: string, startDate: string, endDate: string): Payment[] {
    return this.getByUserId(userId).filter((p) => {
      const date = new Date(p.date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  }

  deleteByLoanId(loanId: string): void {
    const payments = this.getByLoanId(loanId);
    payments.forEach((p) => this.delete(p.id));
  }
}

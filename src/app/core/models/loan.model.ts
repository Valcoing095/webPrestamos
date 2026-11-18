import { BaseModel } from './base.model';

export type PaymentFrequency = 'daily' | 'monthly' | 'biweekly' | 'weekly';
export type LoanStatus = 'active' | 'completed' | 'overdue';
export type LoanType = 'own' | 'lender'; // 'own' = gestión propia, 'lender' = gestionado por prestamista

export interface Loan extends BaseModel {
  personId: string;
  lenderId: string | null; // Si es null, es gestión propia
  routeId: string | null;
  amount: number;
  /** Porcentaje de interés */
  interest: number;
  date: string;
  paymentFrequency: PaymentFrequency;
  totalToCollect: number;
  /** Total abonado (lo mantiene el backend al registrar/revertir pagos) */
  paidAmount: number;
  notes: string;
  status: LoanStatus;
  loanType: LoanType;
}

export interface LoanInput {
  personId?: string;
  lenderId?: string | null;
  routeId?: string | null;
  loanType?: LoanType;
  amount?: number;
  interest?: number;
  totalToCollect?: number;
  date?: string;
  paymentFrequency?: PaymentFrequency;
  notes?: string;
}

/** Nota de seguimiento: recurso aparte /loans/:id/notes */
export interface TrackingNote {
  id: string;
  loanId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoanSchedule {
  loanId: string;
  paymentFrequency: PaymentFrequency;
  paymentsPerMonth: number;
  perPayment: number;
  totalToCollect: number;
  paidAmount: number;
  remaining: number;
  nextDueDate: string;
}

import { BaseModel } from './base.model';

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'mixed';

export interface Payment extends BaseModel {
  loanId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes: string;
}

export interface PaymentInput {
  loanId: string;
  amount: number;
  date?: string;
  method?: PaymentMethod;
  notes?: string;
}

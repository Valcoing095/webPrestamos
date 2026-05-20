import { BaseModel } from './base.model';

export class Payment extends BaseModel {
  loanId: string;
  userId: string | null;
  amount: number;
  date: string;
  notes: string;

  constructor(data: Partial<Payment> = {}) {
    super(data);
    this.loanId = data.loanId || '';
    this.userId = data.userId || null;
    this.amount = data.amount || 0;
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.notes = data.notes || '';
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.loanId) errors.push('El prestamo es requerido');
    if (!this.amount || this.amount <= 0) errors.push('El monto debe ser mayor a 0');
    if (!this.date) errors.push('La fecha es requerida');
    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }
}

export type PaymentFrequency = 'daily' | 'monthly' | 'biweekly' | 'weekly';

import { BaseModel } from './base.model';

export class Loan extends BaseModel {
  personId: string;
  userId: string | null;
  amount: number;
  date: string;
  paymentFrequency: PaymentFrequency;
  totalToCollect: number;
  notes: string;
  trackingNotes: Array<{ id: string; text: string; createdAt: string }>;

  constructor(data: Partial<Loan> = {}) {
    super(data);
    this.personId = data.personId || '';
    this.userId = data.userId || null;
    this.amount = data.amount || 0;
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.paymentFrequency = data.paymentFrequency || 'monthly';
    this.totalToCollect = data.totalToCollect || 0;
    this.notes = data.notes || '';
    this.trackingNotes = data.trackingNotes || [];
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.personId) errors.push('La persona es requerida');
    if (!this.amount || this.amount <= 0) errors.push('El monto debe ser mayor a 0');
    if (!this.date) errors.push('La fecha es requerida');
    if (!this.totalToCollect || this.totalToCollect <= 0) errors.push('El total a cobrar es requerido');
    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  update(data: Partial<Loan>): void {
    if (data.personId !== undefined) this.personId = data.personId;
    if (data.amount !== undefined) this.amount = data.amount;
    if (data.date !== undefined) this.date = data.date;
    if (data.paymentFrequency !== undefined) this.paymentFrequency = data.paymentFrequency;
    if (data.totalToCollect !== undefined) this.totalToCollect = data.totalToCollect;
    if (data.notes !== undefined) this.notes = data.notes;
    if (data.trackingNotes !== undefined) this.trackingNotes = data.trackingNotes;
  }

  isOverdue(): boolean {
    return false;
  }

  getDaysOverdue(): number {
    return 0;
  }

  addTrackingNote(text: string): void {
    this.trackingNotes.push({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      text,
      createdAt: new Date().toISOString(),
    });
  }

  removeTrackingNote(noteId: string): void {
    this.trackingNotes = this.trackingNotes.filter((n) => n.id !== noteId);
  }
}

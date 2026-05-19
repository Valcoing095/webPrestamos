import { BaseModel } from './base.model';

export class Lender extends BaseModel {
  name: string;
  phone: string;
  email: string;
  availableCapital: number;
  commissionPercentage: number;
  routeId: string | null;
  userId: string | null;
  notes: string;
  isActive: boolean;

  constructor(data: Partial<Lender> = {}) {
    super(data);
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.availableCapital = data.availableCapital || 0;
    this.commissionPercentage = data.commissionPercentage ?? 10;
    this.routeId = data.routeId || null;
    this.userId = data.userId || null;
    this.notes = data.notes || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.name || this.name.trim().length === 0) errors.push('El nombre es requerido');
    if (this.availableCapital < 0) errors.push('El capital disponible no puede ser negativo');
    if (this.commissionPercentage < 0 || this.commissionPercentage > 100)
      errors.push('El porcentaje de comision debe estar entre 0 y 100');
    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  update(data: Partial<Lender>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.email !== undefined) this.email = data.email;
    if (data.availableCapital !== undefined) this.availableCapital = data.availableCapital;
    if (data.commissionPercentage !== undefined) this.commissionPercentage = data.commissionPercentage;
    if (data.routeId !== undefined) this.routeId = data.routeId;
    if (data.notes !== undefined) this.notes = data.notes;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }
}

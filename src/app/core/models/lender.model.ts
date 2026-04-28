import { BaseModel } from './base.model';

export class Lender extends BaseModel {
  name: string;
  phone: string;
  email: string;
  availableCapital: number;
  userId: string | null;
  routeIds: string[];
  notes: string;

  constructor(data: Partial<Lender> = {}) {
    super(data);
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.availableCapital = data.availableCapital || 0;
    this.userId = data.userId || null;
    this.routeIds = data.routeIds || [];
    this.notes = data.notes || '';
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.name || this.name.trim().length === 0) {
      errors.push('El nombre es requerido');
    }
    if (this.name && this.name.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
    if (this.availableCapital < 0) {
      errors.push('El capital disponible no puede ser negativo');
    }
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
    if (data.routeIds !== undefined) this.routeIds = data.routeIds;
    if (data.notes !== undefined) this.notes = data.notes;
  }

  addRoute(routeId: string): void {
    if (!this.routeIds.includes(routeId)) {
      this.routeIds.push(routeId);
    }
  }

  removeRoute(routeId: string): void {
    this.routeIds = this.routeIds.filter(id => id !== routeId);
  }
}

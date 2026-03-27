import { BaseModel } from './base.model';

export class Person extends BaseModel {
  name: string;
  phone: string;
  address: string;
  notes: string;
  userId: string | null;

  constructor(data: Partial<Person> = {}) {
    super(data);
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.address = data.address || '';
    this.notes = data.notes || '';
    this.userId = data.userId || null;
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.name || this.name.trim().length === 0) {
      errors.push('El nombre es requerido');
    }
    if (this.name && this.name.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  update(data: Partial<Person>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.address !== undefined) this.address = data.address;
    if (data.notes !== undefined) this.notes = data.notes;
  }
}

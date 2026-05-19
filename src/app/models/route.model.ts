import { BaseModel } from './base.model';

export class Route extends BaseModel {
  name: string;
  description: string;
  zone: string;
  lenderId: string | null;
  userId: string | null;
  isActive: boolean;

  constructor(data: Partial<Route> = {}) {
    super(data);
    this.name = data.name || '';
    this.description = data.description || '';
    this.zone = data.zone || '';
    this.lenderId = data.lenderId || null;
    this.userId = data.userId || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.name || this.name.trim().length === 0) errors.push('El nombre de la ruta es requerido');
    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  update(data: Partial<Route>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.zone !== undefined) this.zone = data.zone;
    if (data.lenderId !== undefined) this.lenderId = data.lenderId;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }
}

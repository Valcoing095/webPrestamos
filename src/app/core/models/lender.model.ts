import { BaseModel } from './base.model';

export interface Lender extends BaseModel {
  name: string;
  phone: string;
  email: string;
  availableCapital: number;
  routeId: string | null; // Ruta asignada al prestamista
  commissionPercentage: number; // Porcentaje de comisión para liquidación
  notes: string;
  isActive: boolean;
}

export type LenderInput = Partial<
  Pick<
    Lender,
    'name' | 'phone' | 'email' | 'availableCapital' | 'routeId' | 'commissionPercentage' | 'notes' | 'isActive'
  >
>;

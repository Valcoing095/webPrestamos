import { BaseModel } from './base.model';

export interface Person extends BaseModel {
  name: string;
  phone: string;
  address: string;
  notes: string;
  routeId: string | null;
}

/** Body de POST/PATCH /persons (el userId lo toma el backend del JWT) */
export type PersonInput = Partial<Pick<Person, 'name' | 'phone' | 'address' | 'notes' | 'routeId'>>;

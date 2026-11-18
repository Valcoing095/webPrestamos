import { BaseModel } from './base.model';

export interface Route extends BaseModel {
  name: string;
  description: string;
  zone: string;
  lenderId: string | null; // Prestamista asignado a esta ruta
  isActive: boolean;
}

export type RouteInput = Partial<Pick<Route, 'name' | 'description' | 'zone' | 'lenderId' | 'isActive'>>;

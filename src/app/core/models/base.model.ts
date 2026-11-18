/** Campos comunes que devuelve el backend en toda entidad */
export interface BaseModel {
  id: string; // UUID
  createdAt: string;
  updatedAt: string;
}

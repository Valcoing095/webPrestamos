import { HttpErrorResponse } from '@angular/common/http';

/** Forma de error del backend: {statusCode, code, message, details?, timestamp, path} */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  /** Errores por campo (validación Zod aplanada) */
  fieldErrors: Record<string, string[]>;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  email: 'Correo',
  password: 'Contraseña',
  amount: 'Monto',
  interest: 'Interés',
  totalToCollect: 'Total a cobrar',
  date: 'Fecha',
  phone: 'Teléfono',
  address: 'Dirección',
  notes: 'Notas',
  text: 'Nota',
  personId: 'Cliente',
  lenderId: 'Prestamista',
  routeId: 'Ruta',
  loanId: 'Préstamo',
  availableCapital: 'Capital disponible',
  commissionPercentage: 'Comisión',
  description: 'Descripción',
  zone: 'Zona',
  from: 'Desde',
  to: 'Hasta',
};

export function parseApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    const body = (err.error ?? {}) as Record<string, any>;
    const details = body['details'];
    const fieldErrors: Record<string, string[]> =
      details && typeof details === 'object' && details.fieldErrors ? details.fieldErrors : {};
    return {
      status: err.status,
      code: typeof body['code'] === 'string' ? body['code'] : 'HTTP_ERROR',
      message: Array.isArray(body['message']) ? body['message'].join(', ') : (body['message'] ?? ''),
      fieldErrors,
    };
  }
  return {
    status: -1,
    code: 'UNKNOWN',
    message: err instanceof Error ? err.message : '',
    fieldErrors: {},
  };
}

/** Mensaje en español listo para mostrar en formularios o toasts */
export function apiErrorMessage(err: unknown, fallback = 'Ocurrió un error inesperado'): string {
  const e = parseApiError(err);

  if (e.status === 0) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }

  if (e.status === 400 && Object.keys(e.fieldErrors).length) {
    return Object.entries(e.fieldErrors)
      .map(([field, msgs]) => `${FIELD_LABELS[field] ?? field}: ${msgs.join(', ')}`)
      .join(' · ');
  }

  switch (e.status) {
    case 400:
      return e.message || 'Los datos enviados no son válidos';
    case 401:
      return e.message || 'Credenciales incorrectas o sesión vencida';
    case 403:
      return e.message || 'No tienes permisos para realizar esta acción';
    case 404:
      return e.message || 'El recurso solicitado no existe';
    case 409:
      return e.message || 'Ya existe un registro con esos datos';
    case 422:
      // Reglas de negocio (p. ej. pago mayor al saldo): el backend ya manda el texto
      return e.message || 'La operación no es válida';
    case 429:
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  if (e.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
  return e.message || fallback;
}

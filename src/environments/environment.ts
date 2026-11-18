// PRODUCCION (ng build usa este archivo; en desarrollo lo reemplaza environment.development.ts).
// Antes de compilar para produccion, cambiar apiUrl por la URL publica del gateway
// (dominio del servidor back, con HTTPS y terminando en /api). Se hornea en el bundle:
// cambiarla exige volver a compilar. Debe coincidir con un origen listado en CORS_ORIGINS del back.
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com/api',
};

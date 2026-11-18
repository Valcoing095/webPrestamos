// PRODUCCION (ng build usa este archivo; en desarrollo lo reemplaza environment.development.ts).
// apiUrl = URL publica del gateway desplegado en Render (HTTPS, terminando en /api).
// Se hornea en el bundle: cambiarla exige volver a compilar (Vercel recompila en cada push).
// El dominio del front en Vercel debe estar en CORS_ORIGINS del back (Render -> Environment).
export const environment = {
  production: true,
  apiUrl: 'https://backwebprestamos.onrender.com/api',
};

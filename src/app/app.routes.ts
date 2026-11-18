import { Routes } from '@angular/router';
import { adminGuard, authGuard, loginGuard } from './core/guards/auth.guard';

/**
 * Flujo de la app:
 *  1. Acceso       → login / register
 *  2. Panel        → resumen general
 *  3. Mi cartera   → préstamos propios, pagos y clientes
 *  4. Red de cobro → prestamistas, rutas, préstamos por ruta y liquidación
 *  5. Análisis     → seguimiento
 *
 * `data.title` / `data.section` alimentan el encabezado y el rastro
 * de navegación del layout principal.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // --- Acceso ---
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard],
    title: 'Iniciar sesión · PrestaFlow',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [loginGuard],
    title: 'Crear cuenta · PrestaFlow',
  },

  // --- Área privada ---
  {
    path: '',
    loadComponent: () => import('./layouts/classic-layout/classic-layout').then(m => m.ClassicLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Panel · PrestaFlow',
        data: { title: 'Panel', subtitle: 'Resumen de tu cartera de préstamos', section: 'Panel' },
      },
      // Mi cartera
      {
        path: 'mis-prestamos',
        loadComponent: () => import('./features/mis-prestamos/mis-prestamos.component').then(m => m.MisPrestamosComponent),
        title: 'Mis préstamos · PrestaFlow',
        data: { title: 'Mis préstamos', subtitle: 'Préstamos de tu gestión propia', section: 'Mi cartera' },
      },
      {
        path: 'mis-pagos',
        loadComponent: () => import('./features/mis-pagos/mis-pagos.component').then(m => m.MisPagosComponent),
        title: 'Mis pagos · PrestaFlow',
        data: { title: 'Mis pagos', subtitle: 'Pagos recibidos de tus préstamos', section: 'Mi cartera' },
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/personas/personas.component').then(m => m.PersonasComponent),
        title: 'Clientes · PrestaFlow',
        data: { title: 'Clientes', subtitle: 'Personas a las que prestas', section: 'Mi cartera' },
      },
      // Red de cobro
      {
        path: 'prestamistas',
        loadComponent: () => import('./features/prestamistas/prestamistas.component').then(m => m.PrestamistasComponent),
        title: 'Prestamistas · PrestaFlow',
        data: { title: 'Prestamistas', subtitle: 'Personas que cobran en tu red', section: 'Red de cobro' },
      },
      {
        path: 'rutas',
        loadComponent: () => import('./features/rutas/rutas.component').then(m => m.RutasComponent),
        title: 'Rutas · PrestaFlow',
        data: { title: 'Rutas', subtitle: 'Zonas y recorridos de cobro', section: 'Red de cobro' },
      },
      {
        path: 'prestamos-prestamistas',
        loadComponent: () => import('./features/prestamos-prestamistas/prestamos-prestamistas.component').then(m => m.PrestamosPrestamistasComponent),
        title: 'Préstamos por ruta · PrestaFlow',
        data: { title: 'Préstamos por ruta', subtitle: 'Préstamos gestionados por prestamistas', section: 'Red de cobro' },
      },
      {
        path: 'liquidacion',
        loadComponent: () => import('./features/liquidacion/liquidacion.component').then(m => m.LiquidacionComponent),
        title: 'Liquidación · PrestaFlow',
        data: { title: 'Liquidación', subtitle: 'Cierre y cuentas con cada prestamista', section: 'Red de cobro' },
      },
      {
        path: 'alertas',
        loadComponent: () => import('./features/alertas/alertas.component').then(m => m.AlertasComponent),
        title: 'Alertas de mora · PrestaFlow',
        data: { title: 'Alertas de mora', subtitle: 'Deudas con pagos vencidos', section: 'Panel' },
      },
      // Análisis
      {
        path: 'seguimiento',
        loadComponent: () => import('./features/seguimiento/seguimiento.component').then(m => m.SeguimientoComponent),
        title: 'Seguimiento · PrestaFlow',
        data: { title: 'Seguimiento', subtitle: 'Notas y avance de cada préstamo', section: 'Análisis' },
      },
      // Administración (solo admin)
      {
        path: 'usuarios',
        loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [adminGuard],
        title: 'Usuarios · PrestaFlow',
        data: { title: 'Usuarios', subtitle: 'Roles y acceso', section: 'Administración' },
      },
      // Alias heredados
      { path: 'personas', redirectTo: 'clientes', pathMatch: 'full' },
      { path: 'prestamos', redirectTo: 'mis-prestamos', pathMatch: 'full' },
      { path: 'pagos', redirectTo: 'mis-pagos', pathMatch: 'full' },
      {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
        title: 'No encontrado · PrestaFlow',
        data: { title: 'No encontrado', subtitle: '', section: '' },
      },
    ],
  },
];

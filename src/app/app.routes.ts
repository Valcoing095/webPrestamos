import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent),
    canActivate: [loginGuard]
  },
  {
    path: '',
    loadComponent: () => import('./layouts/classic-layout/classic-layout').then(m => m.ClassicLayout),
    canActivate: [authGuard],
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      // Gestion Propia
      {
        path: 'mis-prestamos',
        loadComponent: () => import('./features/mis-prestamos/mis-prestamos.component').then(m => m.MisPrestamosComponent)
      },
      {
        path: 'mis-pagos',
        loadComponent: () => import('./features/mis-pagos/mis-pagos.component').then(m => m.MisPagosComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/personas/personas.component').then(m => m.PersonasComponent)
      },
      // Prestamistas y Rutas
      {
        path: 'prestamistas',
        loadComponent: () => import('./features/prestamistas/prestamistas.component').then(m => m.PrestamistasComponent)
      },
      {
        path: 'rutas',
        loadComponent: () => import('./features/rutas/rutas.component').then(m => m.RutasComponent)
      },
      {
        path: 'prestamos-prestamistas',
        loadComponent: () => import('./features/prestamos-prestamistas/prestamos-prestamistas.component').then(m => m.PrestamosPrestamistasComponent)
      },
      {
        path: 'liquidacion',
        loadComponent: () => import('./features/liquidacion/liquidacion.component').then(m => m.LiquidacionComponent)
      },
      // Reportes
      {
        path: 'seguimiento',
        loadComponent: () => import('./features/seguimiento/seguimiento.component').then(m => m.SeguimientoComponent)
      },
      // Legacy redirects
      {
        path: 'personas',
        redirectTo: 'clientes',
        pathMatch: 'full'
      },
      {
        path: 'prestamos',
        redirectTo: 'mis-prestamos',
        pathMatch: 'full'
      },
      {
        path: 'pagos',
        redirectTo: 'mis-pagos',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

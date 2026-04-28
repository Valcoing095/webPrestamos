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
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'personas',
        loadComponent: () => import('./features/personas/personas.component').then(m => m.PersonasComponent)
      },
      {
        path: 'prestamos',
        loadComponent: () => import('./features/prestamos/prestamos.component').then(m => m.PrestamosComponent)
      },
      {
        path: 'pagos',
        loadComponent: () => import('./features/pagos/pagos.component').then(m => m.PagosComponent)
      },
      {
        path: 'prestamistas',
        loadComponent: () => import('./features/prestamistas/prestamistas.component').then(m => m.PrestamistasComponent)
      },
      {
        path: 'rutas',
        loadComponent: () => import('./features/rutas/rutas.component').then(m => m.RutasComponent)
      },
      {
        path: 'seguimiento',
        loadComponent: () => import('./features/seguimiento/seguimiento.component').then(m => m.SeguimientoComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

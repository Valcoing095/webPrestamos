import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

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
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'personas',
        loadComponent: () => import('./components/personas/personas.component').then(m => m.PersonasComponent)
      },
      {
        path: 'prestamos',
        loadComponent: () => import('./components/prestamos/prestamos.component').then(m => m.PrestamosComponent)
      },
      {
        path: 'pagos',
        loadComponent: () => import('./components/pagos/pagos.component').then(m => m.PagosComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

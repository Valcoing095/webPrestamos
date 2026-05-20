import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 class="text-xl font-semibold text-slate-800">Prestamos</h1>
          <p class="text-sm text-slate-500 mt-1">Inicia sesion para continuar</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          @if (error()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p class="text-sm text-red-600">{{ error() }}</p>
            </div>
          }
          
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Correo Electronico</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Contrasena</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Tu contrasena"
                required
              />
            </div>
            
            <button 
              type="submit" 
              class="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="loading()"
            >
              {{ loading() ? 'Iniciando...' : 'Iniciar Sesion' }}
            </button>
          </form>
        </div>

        <!-- Footer -->
        <p class="text-center text-sm text-slate-500 mt-6">
          No tienes cuenta? 
          <a (click)="goToRegister()" class="text-slate-900 font-medium hover:underline cursor-pointer">Registrate</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    this.error.set('');
    this.loading.set(true);

    try {
      this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}

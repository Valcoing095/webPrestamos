import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </div>
          <h1 class="text-xl font-semibold text-slate-800">Crear Cuenta</h1>
          <p class="text-sm text-slate-500 mt-1">Registrate para comenzar</p>
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
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
              <input 
                type="text" 
                [(ngModel)]="name" 
                name="name" 
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Tu nombre"
                required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Correo Electronico</label>
              <input 
                type="email" 
                [(ngModel)]="email" 
                name="email" 
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="correo@ejemplo.com"
                required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Contrasena</label>
              <input 
                type="password" 
                [(ngModel)]="password" 
                name="password" 
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Tu contrasena"
                required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Confirmar Contrasena</label>
              <input 
                type="password" 
                [(ngModel)]="confirmPassword" 
                name="confirmPassword" 
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Confirmar contrasena"
                required>
            </div>
            
            <button 
              type="submit" 
              class="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="loading()"
            >
              {{ loading() ? 'Creando cuenta...' : 'Crear Cuenta' }}
            </button>
          </form>
        </div>

        <!-- Footer -->
        <p class="text-center text-sm text-slate-500 mt-6">
          Ya tienes cuenta? 
          <a routerLink="/login" class="text-slate-900 font-medium hover:underline">Inicia sesion</a>
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
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error.set('');

    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 4) {
      this.error.set('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    this.loading.set(true);

    try {
      this.authService.register(this.name, this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}

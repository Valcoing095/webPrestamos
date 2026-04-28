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
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div class="card border-0 shadow" style="width: 100%; max-width: 400px;">
        <div class="card-body p-4">
          <div class="text-center mb-4">
            <h2 class="h4 mb-2">Crear Cuenta</h2>
            <p class="text-muted mb-0">Regístrate para comenzar</p>
          </div>
          
          @if (error()) {
            <div class="alert alert-danger" role="alert">
              {{ error() }}
            </div>
          }
          
          <form (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="name" class="form-label">Nombre Completo</label>
              <input 
                type="text" 
                id="name" 
                [(ngModel)]="name" 
                name="name" 
                class="form-control"
                placeholder="Tu nombre"
                required>
            </div>
            
            <div class="mb-3">
              <label for="email" class="form-label">Correo Electrónico</label>
              <input 
                type="email" 
                id="email" 
                [(ngModel)]="email" 
                name="email" 
                class="form-control"
                placeholder="correo@ejemplo.com"
                required>
            </div>
            
            <div class="mb-3">
              <label for="password" class="form-label">Contraseña</label>
              <input 
                type="password" 
                id="password" 
                [(ngModel)]="password" 
                name="password" 
                class="form-control"
                placeholder="Tu contraseña"
                required>
            </div>
            
            <div class="mb-3">
              <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
              <input 
                type="password" 
                id="confirmPassword" 
                [(ngModel)]="confirmPassword" 
                name="confirmPassword" 
                class="form-control"
                placeholder="Confirmar contraseña"
                required>
            </div>
            
            <button type="submit" class="btn btn-primary w-100" [disabled]="loading()">
              {{ loading() ? 'Creando cuenta...' : 'Crear Cuenta' }}
            </button>
          </form>
          
          <div class="text-center mt-3">
            <p class="text-muted mb-0">
              ¿Ya tienes cuenta? <a routerLink="/login" class="text-decoration-none">Inicia sesión</a>
            </p>
          </div>
        </div>
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

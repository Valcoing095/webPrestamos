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
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div class="card border-0 shadow" style="width: 100%; max-width: 400px;">
        <div class="card-body p-4">
          <div class="text-center mb-4">
            <h2 class="h4 mb-2">Gestor de Préstamos</h2>
            <p class="text-muted mb-0">Inicia sesión para continuar</p>
          </div>
          
          @if (error()) {
            <div class="alert alert-danger" role="alert">
              {{ error() }}
            </div>
          }
          
          <form (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="email" class="form-label">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                class="form-control"
                placeholder="correo@ejemplo.com"
                required
              />
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
                required
              />
            </div>
            
            <button type="submit" class="btn btn-primary w-100" [disabled]="loading()">
              {{ loading() ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            </button>
          </form>
          
          <div class="text-center mt-3">
            <p class="text-muted mb-0">
              ¿No tienes cuenta? <a href="javascript:void(0)" (click)="goToRegister()" class="text-decoration-none">Regístrate</a>
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

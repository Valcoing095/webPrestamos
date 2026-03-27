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
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-icon">📋</span>
          <h1>Gestor de Préstamos</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
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

          <div class="form-group">
            <label for="password">Contraseña</label>
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

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
            {{ loading() ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>
            ¿No tienes cuenta? <a href="javascript:void(0)" (click)="goToRegister()">Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }
      .auth-card {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }
      .auth-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      .auth-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
      }
      .auth-header h1 {
        font-size: 1.5rem;
        color: #1a1a2e;
        margin: 0 0 0.5rem 0;
      }
      .auth-header p {
        color: #666;
        margin: 0;
      }
      .form-group {
        margin-bottom: 1.5rem;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }
      .form-control {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e1e1e1;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.3s;
      }
      .form-control:focus {
        outline: none;
        border-color: #667eea;
      }
      .btn {
        width: 100%;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
      }
      .btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .btn-block {
        display: block;
        width: 100%;
      }
      .auth-footer {
        margin-top: 1.5rem;
        text-align: center;
        color: #666;
      }
      .auth-footer a {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
      }
      .alert {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .alert-error {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fca5a5;
      }
    `,
  ],
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

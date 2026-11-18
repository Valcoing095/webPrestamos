import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorMessage } from '../../../core/api/api-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <!-- Panel de marca -->
      <aside class="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
             style="background: linear-gradient(160deg, #171233 0%, #1e1b4b 55%, #312e81 100%);">
        <div class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl animate-float"></div>
        <div class="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl animate-float" style="animation-delay:-3.5s"></div>

        <a routerLink="/login" class="relative flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-xl font-bold shadow-glow">$</span>
          <span class="text-lg font-bold tracking-tight">PrestaFlow</span>
        </a>

        <div class="relative max-w-md animate-fadeIn">
          <h2 class="text-4xl font-extrabold leading-tight tracking-tight">Tu cartera de préstamos, bajo control.</h2>
          <p class="mt-4 text-indigo-200/85">Presta, cobra y liquida sin perder el rastro de un solo peso.</p>
          <ol class="mt-10 space-y-4">
            @for (step of flow; track step.title; let i = $index) {
              <li class="flex items-start gap-3.5">
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-brand-200">{{ i + 1 }}</span>
                <span>
                  <span class="block text-sm font-semibold">{{ step.title }}</span>
                  <span class="block text-sm text-indigo-200/70">{{ step.text }}</span>
                </span>
              </li>
            }
          </ol>
        </div>

        <p class="relative text-xs text-indigo-200/50">Tus datos se guardan de forma segura en tu cuenta.</p>
      </aside>

      <!-- Formulario -->
      <main class="flex items-center justify-center px-4 py-10 sm:px-8">
        <div class="w-full max-w-md stagger">
          <div class="mb-8 text-center lg:hidden">
            <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-glow">$</span>
            <h1 class="mt-3 text-xl font-bold text-slate-900">PrestaFlow</h1>
          </div>

          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-900">Bienvenido de nuevo</h2>
            <p class="mt-1.5 text-sm text-slate-500">Inicia sesión para ver tu panel, tus préstamos y cobros del día.</p>
          </div>

          @if (error()) {
            <div class="alert alert-danger animate-scaleIn" role="alert">{{ error() }}</div>
          }

          <form (ngSubmit)="onSubmit()" class="mt-8 space-y-4" novalidate>
            <div>
              <label class="form-label" for="email">Correo electrónico</label>
              <input id="email" type="email" [(ngModel)]="email" name="email" class="form-input"
                     placeholder="correo@ejemplo.com" autocomplete="email" required />
            </div>

            <div>
              <label class="form-label" for="password">Contraseña</label>
              <div class="relative">
                <input id="password" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password"
                       class="form-input pr-12" placeholder="Tu contraseña" autocomplete="current-password" required />
                <button type="button" (click)="showPassword.update(v => !v)"
                        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  {{ showPassword() ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full !py-3 text-base" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> Iniciando… } @else { Iniciar sesión }
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            ¿No tienes cuenta?
            <a routerLink="/register" class="font-semibold text-brand-600 hover:text-brand-700 hover:underline">Crear cuenta gratis</a>
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);
  showPassword = signal(false);

  flow = [
    { title: 'Registra', text: 'Clientes, préstamos propios y por ruta en segundos.' },
    { title: 'Cobra', text: 'Anota cada pago y mira el saldo pendiente al instante.' },
    { title: 'Liquida', text: 'Cierra el día con cada prestamista sin cuentas pendientes.' },
  ];

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    this.error.set('');
    if (!this.email.trim() || !this.password) {
      this.error.set('Ingresa tu correo y contraseña');
      return;
    }

    this.loading.set(true);
    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'No fue posible iniciar sesión'));
      },
    });
  }
}

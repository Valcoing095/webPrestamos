import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <!-- Panel de marca -->
      <aside class="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
             style="background: linear-gradient(160deg, #171233 0%, #1e1b4b 55%, #312e81 100%);">
        <div class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl animate-float"></div>
        <div class="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl animate-float" style="animation-delay:-3.5s"></div>

        <a routerLink="/register" class="relative flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-xl font-bold shadow-glow">$</span>
          <span class="text-lg font-bold tracking-tight">PrestaFlow</span>
        </a>

        <div class="relative max-w-md animate-fadeIn">
          <h2 class="text-4xl font-extrabold leading-tight tracking-tight">Empieza a prestar con orden desde hoy.</h2>
          <p class="mt-4 text-indigo-200/85">Crea tu cuenta en menos de un minuto. Sin tarjetas y sin instalaciones: todo queda en tu dispositivo.</p>
          <ul class="mt-10 space-y-3.5 text-sm">
            <li class="flex gap-3"><span class="text-emerald-300">✓</span> Préstamos propios y de prestamistas por ruta</li>
            <li class="flex gap-3"><span class="text-emerald-300">✓</span> Pagos, saldos y liquidación diaria al instante</li>
            <li class="flex gap-3"><span class="text-emerald-300">✓</span> Seguimiento de préstamos vencidos</li>
          </ul>
        </div>

        <p class="relative text-xs text-indigo-200/50">Tus datos se guardan localmente en este dispositivo.</p>
      </aside>

      <!-- Formulario -->
      <main class="flex items-center justify-center px-4 py-10 sm:px-8">
        <div class="w-full max-w-md stagger">
          <div class="mb-8 text-center lg:hidden">
            <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-glow">$</span>
            <h1 class="mt-3 text-xl font-bold text-slate-900">PrestaFlow</h1>
          </div>

          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-900">Crear tu cuenta</h2>
            <p class="mt-1.5 text-sm text-slate-500">Con ella podrás registrar clientes, préstamos y cobros.</p>
          </div>

          @if (error()) {
            <div class="alert alert-danger animate-scaleIn" role="alert">{{ error() }}</div>
          }

          <form (ngSubmit)="onSubmit()" class="mt-8 space-y-4" novalidate>
            <div>
              <label class="form-label" for="name">Nombre</label>
              <input id="name" type="text" [(ngModel)]="name" name="name" class="form-input"
                     placeholder="Tu nombre" autocomplete="name" required />
            </div>
            <div>
              <label class="form-label" for="email">Correo electrónico</label>
              <input id="email" type="email" [(ngModel)]="email" name="email" class="form-input"
                     placeholder="correo@ejemplo.com" autocomplete="email" required />
            </div>
            <div>
              <label class="form-label" for="password">Contraseña</label>
              <div class="relative">
                <input id="password" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password"
                       class="form-input pr-12" placeholder="Mínimo 4 caracteres" autocomplete="new-password" required />
                <button type="button" (click)="showPassword.update(v => !v)"
                        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  {{ showPassword() ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>
            <div>
              <label class="form-label" for="confirmPassword">Confirmar contraseña</label>
              <input id="confirmPassword" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPassword"
                     class="form-input" placeholder="Repite tu contraseña" autocomplete="new-password" required />
            </div>

            <button type="submit" class="btn btn-primary w-full !py-3 text-base" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> Creando cuenta… } @else { Crear cuenta y entrar }
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="font-semibold text-brand-600 hover:text-brand-700 hover:underline">Inicia sesión</a>
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  loading = signal(false);
  showPassword = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    this.error.set('');

    if (!this.name.trim()) {
      this.error.set('El nombre es requerido');
      return;
    }
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
      this.authService.register(this.name.trim(), this.email.trim(), this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err.message || 'No fue posible crear la cuenta');
    } finally {
      this.loading.set(false);
    }
  }
}

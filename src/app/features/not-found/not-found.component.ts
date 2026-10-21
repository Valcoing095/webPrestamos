import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[60vh] grid place-items-center px-4">
      <div class="text-center animate-fadeIn">
        <p class="text-7xl font-extrabold bg-gradient-to-br from-brand-500 to-brand-700 bg-clip-text text-transparent">404</p>
        <h1 class="mt-4 text-xl font-semibold text-slate-800">Esta página no existe</h1>
        <p class="mt-2 text-sm text-slate-500">Es posible que el enlace haya cambiado o que la ruta ya no esté disponible.</p>
        <a routerLink="/dashboard" class="btn btn-primary mt-6">Volver al panel</a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}

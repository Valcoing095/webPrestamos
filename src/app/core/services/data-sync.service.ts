import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService } from './auth.service';
import { PersonService } from './person.service';
import { LoanService } from './loan.service';
import { PaymentService } from './payment.service';
import { LenderService } from './lender.service';
import { RouteService } from './route.service';
import { MoraService } from './mora.service';

/**
 * Carga todas las listas del backend al iniciar sesión y las vacía al salir.
 * Debe instanciarse al arrancar la app (la inyecta el componente raíz).
 */
@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private auth = inject(AuthService);
  private persons = inject(PersonService);
  private loans = inject(LoanService);
  private payments = inject(PaymentService);
  private lenders = inject(LenderService);
  private routes = inject(RouteService);
  private mora = inject(MoraService);

  loading = signal(false);
  error = signal(false);

  private userId = computed(() => this.auth.currentUser()?.id ?? null);

  constructor() {
    effect(() => {
      const id = this.userId();
      untracked(() => (id ? this.loadAll() : this.reset()));
    });
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set(false);
    // Refresca rol/estado del usuario (puede haber cambiado desde el último login)
    this.auth.me().subscribe({ error: () => undefined });
    forkJoin([
      this.persons.load(),
      this.loans.load(),
      this.payments.load(),
      this.lenders.load(),
      this.routes.load(),
      this.mora.load(),
    ]).subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  private reset(): void {
    this.persons.clear();
    this.loans.clear();
    this.payments.clear();
    this.lenders.clear();
    this.routes.clear();
    this.mora.clear();
    this.loading.set(false);
    this.error.set(false);
  }
}

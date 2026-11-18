import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService, PaymentService, LenderService, PersonService, ReportService } from '../../core/services';
import { MoraService } from '../../core/services/mora.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary } from '../../core/models';

interface QuickAction {
  path: string;
  title: string;
  description: string;
  icon: string;
  chip: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Saludo -->
      <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-fadeIn">
        <div>
          <p class="text-sm font-medium text-brand-600">{{ getCurrentDate() }}</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {{ greeting() }}{{ userName() ? ', ' + userName() : '' }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">Así va tu cartera hoy. Esto es lo que puedes hacer ahora:</p>
        </div>
        <a routerLink="/mis-pagos" class="btn btn-primary shrink-0">
          Registrar un pago
          <span aria-hidden="true">→</span>
        </a>
      </section>

      <!-- KPIs -->
      <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4 stagger" aria-label="Indicadores principales">
        <article class="card card-hover p-5">
          <div class="flex items-start justify-between">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
            <span class="badge badge-primary">Total</span>
          </div>
          <p class="amount mt-4 text-2xl font-bold text-slate-900">{{ formatCurrency(totalLoaned()) }}</p>
          <p class="mt-0.5 text-sm text-slate-500">Capital desembolsado</p>
        </article>

        <article class="card card-hover p-5">
          <div class="flex items-start justify-between">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
            <span class="badge badge-success">{{ collectPercentage() }}%</span>
          </div>
          <p class="amount mt-4 text-2xl font-bold text-slate-900">{{ formatCurrency(totalCollected()) }}</p>
          <p class="mt-0.5 text-sm text-slate-500">Recuperado</p>
          <div class="progress mt-3"><div class="progress-bar" [style.width.%]="collectPercentage()"></div></div>
        </article>

        <article class="card card-hover p-5">
          <div class="flex items-start justify-between">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
            <span class="badge badge-warning">Por cobrar</span>
          </div>
          <p class="amount mt-4 text-2xl font-bold text-slate-900">{{ formatCurrency(pendingCapital()) }}</p>
          <p class="mt-0.5 text-sm text-slate-500">Pendiente de cobro</p>
        </article>

        <article class="card card-hover p-5">
          <div class="flex items-start justify-between">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 text-white">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </span>
            <span class="badge" style="background:#f5f3ff;color:#6d28d9">{{ totalLoansCount() }} en total</span>
          </div>
          <p class="mt-4 text-2xl font-bold text-slate-900">{{ activeLoansCount() }}</p>
          <p class="mt-0.5 text-sm text-slate-500">Préstamos activos</p>
        </article>
      </section>

      <!-- Alertas de mora -->
      @if (overdueAlerts().length > 0) {
        <section class="animate-fadeIn overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/90 via-white to-white shadow-sm" aria-label="Alertas de mora">
          <div class="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500 text-white shadow-sm">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.94 4h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/></svg>
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-bold text-slate-900">
                {{ overdueAlerts().length }} deuda{{ overdueAlerts().length === 1 ? '' : 's' }} en mora
                <span class="font-semibold text-red-600">· {{ formatCurrency(moraAmount()) }} en riesgo</span>
              </h3>
              <p class="truncate text-sm text-slate-500">
                @for (alert of overdueAlerts().slice(0, 3); track alert.loan.id; let last = $last) {
                  {{ alert.personName }} ({{ alert.daysOverdue }}d){{ last ? '' : ' · ' }}
                }
                @if (overdueAlerts().length > 3) { · y {{ overdueAlerts().length - 3 }} más }
              </p>
            </div>
            <a routerLink="/alertas" class="btn btn-danger shrink-0">Ver alertas</a>
          </div>
        </section>
      }

      <!-- Accesos rápidos: el flujo en un clic -->
      <section aria-label="Accesos rápidos">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Flujo rápido</h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 stagger">
          @for (action of quickActions; track action.path) {
            <a [routerLink]="action.path" class="card card-hover group flex items-center gap-3.5 p-4">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg" [class]="action.chip">
                <span aria-hidden="true">{{ action.icon }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-slate-800">{{ action.title }}</span>
                <span class="block truncate text-xs text-slate-400">{{ action.description }}</span>
              </span>
              <span class="text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-500" aria-hidden="true">→</span>
            </a>
          }
        </div>
      </section>

      <!-- Gestión propia vs prestamistas -->
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6 stagger" aria-label="Resumen por tipo de gestión">
        <article class="card overflow-hidden">
          <div class="card-header flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">Mi cartera propia</h3>
            <a routerLink="/mis-prestamos" class="text-sm font-medium text-brand-600 hover:text-brand-700">Ver préstamos →</a>
          </div>
          <div class="p-6">
            <div class="mb-6 grid grid-cols-2 gap-4">
              <div class="rounded-xl bg-slate-50 p-4 text-center">
                <p class="text-2xl font-bold text-brand-600">{{ ownLoansCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Préstamos</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-4 text-center">
                <p class="truncate text-2xl font-bold text-emerald-600">{{ formatCurrency(ownCapital()) }}</p>
                <p class="mt-1 text-xs text-slate-500">Capital</p>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Recuperación</span>
                <span class="font-semibold text-slate-700">{{ ownCollectPercentage() }}%</span>
              </div>
              <div class="progress"><div class="progress-bar" [style.width.%]="ownCollectPercentage()"></div></div>
              <p class="text-xs text-slate-400">{{ formatCurrency(ownCollected()) }} de {{ formatCurrency(ownCapital()) }}</p>
            </div>
          </div>
        </article>

        <article class="card overflow-hidden">
          <div class="card-header flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">Red de prestamistas</h3>
            <a routerLink="/liquidacion" class="text-sm font-medium text-brand-600 hover:text-brand-700">Liquidar →</a>
          </div>
          <div class="p-6">
            <div class="mb-6 grid grid-cols-2 gap-4">
              <div class="rounded-xl bg-slate-50 p-4 text-center">
                <p class="text-2xl font-bold text-brand-600">{{ lenderLoansCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Préstamos</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-4 text-center">
                <p class="text-2xl font-bold text-amber-600">{{ lendersCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">Prestamistas</p>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Recuperación</span>
                <span class="font-semibold text-slate-700">{{ lenderCollectPercentage() }}%</span>
              </div>
              <div class="progress"><div class="progress-bar" [style.width.%]="lenderCollectPercentage()"></div></div>
              <p class="text-xs text-slate-400">{{ formatCurrency(lenderCollected()) }} de {{ formatCurrency(lenderCapital()) }}</p>
            </div>
          </div>
        </article>
      </section>

      <!-- Últimos pagos + estado -->
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6 stagger">
        <article class="card overflow-hidden lg:col-span-2">
          <div class="card-header flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">Últimos pagos</h3>
            <a routerLink="/mis-pagos" class="text-sm font-medium text-brand-600 hover:text-brand-700">Ver todos →</a>
          </div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th class="hidden sm:table-cell">Préstamo</th>
                  <th class="text-right">Monto</th>
                  <th class="hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (payment of recentPayments(); track payment.id) {
                  <tr>
                    <td class="font-medium text-slate-800">{{ getPersonNameForLoan(payment.loanId) }}</td>
                    <td class="hidden sm:table-cell"><span class="badge badge-secondary">{{ getLoanId(payment.loanId) }}</span></td>
                    <td class="text-right font-semibold text-emerald-600">{{ formatCurrency(payment.amount) }}</td>
                    <td class="hidden text-slate-500 sm:table-cell">{{ formatDate(payment.date) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-10 text-center">
                      <p class="text-sm font-medium text-slate-500">Aún no hay pagos registrados</p>
                      <p class="mt-1 text-xs text-slate-400">Cuando registres el primer pago aparecerá aquí.</p>
                      <a routerLink="/mis-pagos" class="btn btn-primary btn-sm mt-4">Registrar pago</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>

        <article class="card overflow-hidden">
          <div class="card-header"><h3 class="text-base font-semibold text-slate-800">Estado de préstamos</h3></div>
          <div class="space-y-5 p-6">
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm text-slate-600">Activos</span>
                <span class="text-sm font-bold text-brand-600">{{ activeLoansCount() }}</span>
              </div>
              <div class="progress"><div class="progress-bar" [style.width.%]="totalLoansCount() > 0 ? (activeLoansCount() / totalLoansCount() * 100) : 0"></div></div>
            </div>
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm text-slate-600">Completados</span>
                <span class="text-sm font-bold text-emerald-600">{{ completedLoansCount() }}</span>
              </div>
              <div class="progress"><div class="h-full rounded-full bg-emerald-500 progress-grow" [style.width.%]="totalLoansCount() > 0 ? (completedLoansCount() / totalLoansCount() * 100) : 0"></div></div>
            </div>
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm text-slate-600">Vencidos</span>
                <span class="text-sm font-bold text-red-600">{{ overdueLoansCount() }}</span>
              </div>
              <div class="progress"><div class="h-full rounded-full bg-red-500 progress-grow" [style.width.%]="totalLoansCount() > 0 ? (overdueLoansCount() / totalLoansCount() * 100) : 0"></div></div>
            </div>
            <p class="border-t border-slate-100 pt-4 text-sm text-slate-500">
              Total: <span class="font-semibold text-slate-700">{{ totalLoansCount() }} préstamos</span>
            </p>
            @if (overdueLoansCount() > 0) {
              <a routerLink="/alertas" class="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100">
                <span aria-hidden="true">⚠</span> Tienes {{ overdueLoansCount() }} préstamo(s) en mora. Ver alertas →
              </a>
            }
          </div>
        </article>
      </section>
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class DashboardComponent implements OnInit {
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private lenderService = inject(LenderService);
  private personService = inject(PersonService);
  private authService = inject(AuthService);
  private moraService = inject(MoraService);
  private reportService = inject(ReportService);

  loans = this.loanService.getDataSignal();
  payments = this.paymentService.getDataSignal();
  lenders = this.lenderService.getDataSignal();
  persons = this.personService.getDataSignal();

  /** Resumen general calculado por el backend (GET /reports/dashboard) */
  summary = signal<DashboardSummary | null>(null);
  summaryError = signal(false);

  userName = computed(() => this.authService.currentUser()?.name?.split(' ')[0] ?? '');
  greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  });

  quickActions: QuickAction[] = [
    { path: '/mis-prestamos', title: 'Nuevo préstamo', description: 'Presta de tu cartera propia', icon: '＋', chip: 'bg-brand-50 text-brand-600' },
    { path: '/mis-pagos', title: 'Registrar pago', description: 'Abona a un préstamo activo', icon: '✓', chip: 'bg-emerald-50 text-emerald-600' },
    { path: '/clientes', title: 'Nuevo cliente', description: 'Añade una persona', icon: '＠', chip: 'bg-amber-50 text-amber-600' },
    { path: '/liquidacion', title: 'Liquidar ruta', description: 'Cierra cuentas con prestamistas', icon: '▤', chip: 'bg-violet-50 text-violet-600' },
  ];

  // Gestión propia y prestamistas: desglose calculado en el backend (`bySegment`)
  private own = computed(() => this.summary()?.bySegment.own);
  private lender = computed(() => this.summary()?.bySegment.lender);

  ownLoansCount = computed(() => this.own()?.count ?? 0);
  ownCapital = computed(() => this.own()?.totalToCollect ?? 0);
  ownCollected = computed(() => this.own()?.collected ?? 0);
  ownCollectPercentage = computed(() => Math.round(this.own()?.collectPercentage ?? 0));

  // Prestamistas
  lenderLoansCount = computed(() => this.lender()?.count ?? 0);
  lendersCount = computed(() => this.lenders().filter(l => l.isActive).length);
  lenderCapital = computed(() => this.lender()?.totalToCollect ?? 0);
  lenderCollected = computed(() => this.lender()?.collected ?? 0);
  lenderCollectPercentage = computed(() => Math.round(this.lender()?.collectPercentage ?? 0));

  // Generales: vienen del endpoint /reports/dashboard
  totalLoaned = computed(() => this.summary()?.totalLoaned ?? 0);
  totalCollected = computed(() => this.summary()?.totalCollected ?? 0);
  pendingCapital = computed(() => this.summary()?.pendingCapital ?? 0);
  collectPercentage = computed(() => Math.round(this.summary()?.collectPercentage ?? 0));

  activeLoansCount = computed(() => this.summary()?.activeCount ?? 0);
  completedLoansCount = computed(() => this.summary()?.completedCount ?? 0);
  totalLoansCount = computed(() => this.summary()?.totalLoansCount ?? 0);

  // Mora calculada en el backend (/collections/alerts)
  moraAlerts = this.moraService.alerts;
  overdueAlerts = this.moraService.overdueAlerts;
  overdueLoansCount = computed(() => this.summary()?.overdueCount ?? this.moraService.overdueCount());
  moraAmount = computed(() => this.overdueAlerts().reduce((sum, a) => sum + a.pendingAmount, 0));

  recentPayments = computed(() =>
    [...this.payments()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  );

  ngOnInit() {
    this.loadSummary();
    this.moraService.load().subscribe();
  }

  loadSummary() {
    this.summaryError.set(false);
    this.reportService.dashboard().subscribe({
      next: (d) => this.summary.set(d),
      error: () => this.summaryError.set(true),
    });
  }

  getPersonName(personId: string): string {
    return this.persons().find(p => p.id === personId)?.name ?? 'Desconocido';
  }

  getPersonNameForLoan(loanId: string): string {
    const loan = this.loans().find(l => l.id === loanId);
    return loan ? this.getPersonName(loan.personId) : 'Desconocido';
  }

  getLoanId(loanId: string): string {
    return loanId.substring(0, 8).toUpperCase();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return '';
    // Fecha local (evita que se muestre un día antes por la zona horaria)
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    const d = year && month && day ? new Date(year, month - 1, day) : new Date(date);
    return d.toLocaleDateString('es-CO');
  }

  getCurrentDate(): string {
    const text = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MoraService, MoraAlert, MoraSeverity } from '../../core/services/mora.service';
import { LoanCalculator } from '../../core/services/loan.service';
import { AuthService } from '../../core/services/auth.service';

type SeverityFilter = 'all' | MoraSeverity;

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Encabezado -->
      <section class="animate-fadeIn">
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Alertas de mora</h2>
        <p class="mt-1 text-sm text-slate-500">
          Deudas cuyo siguiente pago ya venció según su frecuencia y su último abono. Se actualizan solas al registrar pagos.
        </p>
      </section>

      <!-- Resumen -->
      <section class="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4 stagger" aria-label="Resumen de mora">
        <article class="card p-5">
          <p class="text-3xl font-extrabold text-red-600">{{ overdue().length }}</p>
          <p class="mt-1 text-sm text-slate-500">Deudas en mora</p>
        </article>
        <article class="card p-5">
          <p class="text-3xl font-extrabold text-amber-500">{{ dueToday().length }}</p>
          <p class="mt-1 text-sm text-slate-500">Vencen hoy</p>
        </article>
        <article class="card p-5">
          <p class="amount mt-1 text-2xl font-extrabold text-slate-900" [title]="formatCurrency(amountAtRisk())">{{ formatCurrency(amountAtRisk()) }}</p>
          <p class="mt-1 text-sm text-slate-500">Saldo en riesgo</p>
        </article>
        <article class="card p-5">
          <p class="text-3xl font-extrabold text-slate-900">{{ affectedClients() }}</p>
          <p class="mt-1 text-sm text-slate-500">Clientes afectados</p>
        </article>
      </section>

      <!-- Filtros por gravedad -->
      <section class="flex flex-wrap gap-2" aria-label="Filtrar por gravedad">
        @for (f of filters; track f.value) {
          <button
            class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition active:scale-95"
            [class]="severityFilter() === f.value
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
            (click)="severityFilter.set(f.value)"
          >
            {{ f.label }} · {{ countFor(f.value) }}
          </button>
        }
      </section>

      <!-- Lista de alertas -->
      <section class="space-y-3" aria-label="Lista de alertas">
        @for (alert of filteredAlerts(); track alert.loan.id) {
          <article class="card card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center animate-fadeIn">
            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-bold" [class]="severityStyles(alert.severity).chip">
              {{ alert.personName.charAt(0).toUpperCase() }}
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-base font-bold text-slate-900">{{ alert.personName }}</h3>
                <span class="badge whitespace-nowrap" [class]="severityStyles(alert.severity).badge">
                  {{ severityLabel(alert) }}
                </span>
                <span class="badge badge-secondary">{{ alert.loan.loanType === 'lender' ? 'Por ruta' : 'Propio' }}</span>
              </div>
              <p class="mt-1 text-sm text-slate-500">
                Debía pagar el <span class="font-medium text-slate-700">{{ formatDate(alert.nextDueDate) }}</span>
                · {{ frequencyLabel(alert.loan.paymentFrequency) }}
                @if (alert.lastPaymentDate) {
                  · Último abono: {{ formatDate(alert.lastPaymentDate) }}
                } @else {
                  · <span class="font-medium text-red-500">Sin abonos todavía</span>
                }
              </p>
              <p class="mt-0.5 text-xs text-slate-400">
                Préstamo {{ alert.loan.id.substring(0, 8).toUpperCase() }} del {{ formatDate(alert.loan.date) }}
                @if (alert.missedPayments > 0) {
                  · {{ alert.missedPayments }} cuota(s) vencida(s)
                }
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
              <div class="text-right">
                <p class="amount text-lg font-extrabold text-slate-900">{{ formatCurrency(alert.pendingAmount) }}</p>
                <p class="text-xs text-slate-400">pendiente</p>
              </div>
            </div>

            <div class="flex shrink-0 flex-wrap gap-2">
              <a [routerLink]="alert.loan.loanType === 'lender' ? '/prestamos-prestamistas' : '/mis-prestamos'" class="btn btn-outline btn-sm">Ver deuda</a>
              @if (alert.loan.loanType !== 'lender') {
                <a routerLink="/mis-pagos" class="btn btn-primary btn-sm">Registrar pago</a>
              }
            </div>
          </article>
        } @empty {
          <div class="card px-6 py-14 text-center animate-fadeIn">
            <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-500">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
            </span>
            <h3 class="mt-4 text-lg font-bold text-slate-900">Sin mora por aquí</h3>
            <p class="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Ninguna deuda coincide con este filtro. Cuando un pago se atrase según su frecuencia, aparecerá en esta lista.
            </p>
            <a routerLink="/dashboard" class="btn btn-primary btn-sm mt-5">Volver al panel</a>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class AlertasComponent {
  private moraService = inject(MoraService);
  private authService = inject(AuthService);

  severityFilter = signal<SeverityFilter>('all');

  filters: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'high', label: 'Graves' },
    { value: 'medium', label: 'Medias' },
    { value: 'low', label: 'Leves' },
    { value: 'today', label: 'Vencen hoy' },
  ];

  alerts = computed(() => this.moraService.getAlerts(this.authService.getUserId() || ''));
  overdue = computed(() => this.alerts().filter(a => !a.isDueToday));
  dueToday = computed(() => this.alerts().filter(a => a.isDueToday));
  amountAtRisk = computed(() => this.overdue().reduce((sum, a) => sum + a.pendingAmount, 0));
  affectedClients = computed(() => new Set(this.alerts().map(a => a.personId)).size);

  filteredAlerts = computed(() => {
    const f = this.severityFilter();
    return f === 'all' ? this.alerts() : this.alerts().filter(a => a.severity === f);
  });

  countFor(f: SeverityFilter): number {
    return f === 'all' ? this.alerts().length : this.alerts().filter(a => a.severity === f).length;
  }

  severityLabel(alert: MoraAlert): string {
    if (alert.isDueToday) return 'Vence hoy';
    const days = alert.daysOverdue;
    return `Mora · ${days} día${days === 1 ? '' : 's'}`;
  }

  severityStyles(severity: MoraSeverity): { chip: string; badge: string } {
    switch (severity) {
      case 'high':
        return { chip: 'bg-red-100 text-red-600', badge: 'bg-red-50 text-red-700' };
      case 'medium':
        return { chip: 'bg-orange-100 text-orange-600', badge: 'bg-orange-50 text-orange-700' };
      case 'low':
        return { chip: 'bg-amber-100 text-amber-600', badge: 'bg-amber-50 text-amber-700' };
      case 'today':
      default:
        return { chip: 'bg-sky-100 text-sky-600', badge: 'bg-sky-50 text-sky-700' };
    }
  }

  frequencyLabel(f: MoraAlert['loan']['paymentFrequency']): string {
    return LoanCalculator.getFrequencyLabel(f);
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(date: string): string {
    return LoanCalculator.formatDate(date);
  }
}

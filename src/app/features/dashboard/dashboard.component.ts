import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanService, PaymentService, LenderService, PersonService } from '../../core/services';
import { AuthService } from '../../core/services/auth.service';
import { Loan, Payment, Lender, Person } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p class="text-sm text-slate-500 mt-1">Resumen de tu cartera de prestamos</p>
        </div>
        <div class="text-sm text-slate-400">
          {{ getCurrentDate() }}
        </div>
      </div>

      <!-- KPIs Principales -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div class="bg-white rounded-xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center gap-3 mb-2 md:mb-3">
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-xs md:text-sm font-medium text-slate-500">Capital Total</span>
          </div>
          <p class="text-xl md:text-2xl font-bold text-slate-800">{{ formatCurrency(totalLoaned()) }}</p>
          <p class="text-xs text-slate-400 mt-1">Desembolsado total</p>
        </div>

        <div class="bg-white rounded-xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center gap-3 mb-2 md:mb-3">
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-xs md:text-sm font-medium text-slate-500">Recuperado</span>
          </div>
          <p class="text-xl md:text-2xl font-bold text-slate-800">{{ formatCurrency(totalCollected()) }}</p>
          <p class="text-xs text-emerald-500 mt-1">{{ collectPercentage() }}% del total</p>
        </div>

        <div class="bg-white rounded-xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center gap-3 mb-2 md:mb-3">
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-xs md:text-sm font-medium text-slate-500">Pendiente</span>
          </div>
          <p class="text-xl md:text-2xl font-bold text-slate-800">{{ formatCurrency(pendingCapital()) }}</p>
          <p class="text-xs text-slate-400 mt-1">Por cobrar</p>
        </div>

        <div class="bg-white rounded-xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center gap-3 mb-2 md:mb-3">
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <span class="text-xs md:text-sm font-medium text-slate-500">Prestamos Activos</span>
          </div>
          <p class="text-xl md:text-2xl font-bold text-slate-800">{{ activeLoansCount() }}</p>
          <p class="text-xs text-slate-400 mt-1">En proceso</p>
        </div>
      </div>

      <!-- Secciones Resumen -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gestion Propia -->
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100">
            <h3 class="text-base font-semibold text-slate-800">Gestion Propia</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-blue-600">{{ ownLoansCount() }}</p>
                <p class="text-xs text-slate-500 mt-1">Prestamos</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-emerald-600">{{ formatCurrency(ownCapital()) }}</p>
                <p class="text-xs text-slate-500 mt-1">Capital</p>
              </div>
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Progreso de recuperacion</span>
                <span class="font-medium text-slate-700">{{ ownCollectPercentage() }}%</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  [style.width.%]="ownCollectPercentage()"
                ></div>
              </div>
              <p class="text-xs text-slate-400">{{ formatCurrency(ownCollected()) }} de {{ formatCurrency(ownCapital()) }}</p>
            </div>
          </div>
        </div>

        <!-- Prestamistas -->
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100">
            <h3 class="text-base font-semibold text-slate-800">Gestion de Prestamistas</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-blue-600">{{ lenderLoansCount() }}</p>
                <p class="text-xs text-slate-500 mt-1">Prestamos</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-amber-600">{{ lendersCount() }}</p>
                <p class="text-xs text-slate-500 mt-1">Prestamistas</p>
              </div>
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Progreso de recuperacion</span>
                <span class="font-medium text-slate-700">{{ lenderCollectPercentage() }}%</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-blue-500 rounded-full transition-all duration-500"
                  [style.width.%]="lenderCollectPercentage()"
                ></div>
              </div>
              <p class="text-xs text-slate-400">{{ formatCurrency(lenderCollected()) }} de {{ formatCurrency(lenderCapital()) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla y Estado -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Ultimos Pagos -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100">
            <h3 class="text-base font-semibold text-slate-800">Ultimos Pagos</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50/80">
                <tr>
                  <th class="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th class="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Prestamo</th>
                  <th class="px-4 md:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th class="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let payment of recentPayments()" class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-4 md:px-6 py-4 text-sm font-medium text-slate-800">{{ getPersonNameForLoan(payment.loanId) }}</td>
                  <td class="px-4 md:px-6 py-4 hidden sm:table-cell">
                    <span class="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                      {{ getLoanId(payment.loanId) }}
                    </span>
                  </td>
                  <td class="px-4 md:px-6 py-4 text-sm text-right font-medium text-slate-800">{{ formatCurrency(payment.amount) }}</td>
                  <td class="px-4 md:px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{{ formatDate(payment.date) }}</td>
                </tr>
                <tr *ngIf="recentPayments().length === 0">
                  <td colspan="4" class="px-6 py-8 text-center text-sm text-slate-400">No hay pagos registrados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Estado de Prestamos -->
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100">
            <h3 class="text-base font-semibold text-slate-800">Estado</h3>
          </div>
          <div class="p-6 space-y-5">
            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-slate-600">Activos</span>
                <span class="text-sm font-semibold text-blue-600">{{ activeLoansCount() }}</span>
              </div>
              <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-blue-500 rounded-full transition-all duration-300"
                  [style.width.%]="totalLoansCount() > 0 ? (activeLoansCount() / totalLoansCount() * 100) : 0"
                ></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-slate-600">Completados</span>
                <span class="text-sm font-semibold text-emerald-600">{{ completedLoansCount() }}</span>
              </div>
              <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  [style.width.%]="totalLoansCount() > 0 ? (completedLoansCount() / totalLoansCount() * 100) : 0"
                ></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-slate-600">Vencidos</span>
                <span class="text-sm font-semibold text-red-600">{{ overdueLoansCount() }}</span>
              </div>
              <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-red-500 rounded-full transition-all duration-300"
                  [style.width.%]="totalLoansCount() > 0 ? (overdueLoansCount() / totalLoansCount() * 100) : 0"
                ></div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100">
              <p class="text-sm text-slate-500">Total: <span class="font-semibold text-slate-700">{{ totalLoansCount() }} prestamos</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private lenderService = inject(LenderService);
  private personService = inject(PersonService);
  private authService = inject(AuthService);

  loans = signal<Loan[]>([]);
  payments = signal<Payment[]>([]);
  lenders = signal<Lender[]>([]);
  persons = signal<Person[]>([]);
  userId: string = '';

  // Métrics para Gestión Propia
  ownLoans = computed(() => this.loans().filter(l => l.loanType === 'own' || !l.lenderId));
  ownLoansCount = computed(() => this.ownLoans().length);
  ownCapital = computed(() => this.ownLoans().reduce((sum, l) => sum + (l.totalToCollect || l.amount), 0));
  ownCollected = computed(() => {
    return this.ownLoans().reduce((sum, l) => {
      return sum + this.paymentService.getTotalPaidForLoan(l.id);
    }, 0);
  });
  ownCollectPercentage = computed(() => {
    const total = this.ownCapital();
    return total > 0 ? Math.round((this.ownCollected() / total) * 100) : 0;
  });

  // Métricas para Prestamistas
  lenderLoans = computed(() => this.loans().filter(l => l.loanType === 'lender' && l.lenderId));
  lenderLoansCount = computed(() => this.lenderLoans().length);
  lendersCount = computed(() => this.lenders().filter(l => l.isActive).length);
  lenderCapital = computed(() => this.lenderLoans().reduce((sum, l) => sum + (l.totalToCollect || l.amount), 0));
  lenderCollected = computed(() => {
    return this.lenderLoans().reduce((sum, l) => {
      return sum + this.paymentService.getTotalPaidForLoan(l.id);
    }, 0);
  });
  lenderCollectPercentage = computed(() => {
    const total = this.lenderCapital();
    return total > 0 ? Math.round((this.lenderCollected() / total) * 100) : 0;
  });

  // Métricas Generales
  totalLoaned = computed(() => this.ownCapital() + this.lenderCapital());
  totalCollected = computed(() => this.ownCollected() + this.lenderCollected());
  pendingCapital = computed(() => this.totalLoaned() - this.totalCollected());
  collectPercentage = computed(() => {
    const total = this.totalLoaned();
    return total > 0 ? Math.round((this.totalCollected() / total) * 100) : 0;
  });

  // Estado de Préstamos
  activeLoansCount = computed(() => {
    return this.loans().filter(l => l.status === 'active').length;
  });
  completedLoansCount = computed(() => {
    return this.loans().filter(l => l.status === 'completed').length;
  });
  overdueLoansCount = computed(() => {
    return this.loans().filter(l => l.status === 'overdue').length;
  });
  totalLoansCount = computed(() => this.loans().length);

  recentPayments = computed(() => {
    return this.payments()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  });

  ngOnInit() {
    this.userId = this.authService.getUserId() || '';
    this.loadData();
  }

  loadData() {
    this.loans.set(this.loanService.getByUserId(this.userId));
    this.payments.set(this.paymentService.getByUserId(this.userId));
    this.lenders.set(this.lenderService.getByUserId(this.userId));
    this.persons.set(this.personService.getByUserId(this.userId));
  }

  getPersonName(personId: string): string {
    const person = this.persons().find(p => p.id === personId);
    return person ? person.name : 'Desconocido';
  }

  getPersonNameForLoan(loanId: string): string {
    const loan = this.loans().find(l => l.id === loanId);
    if (!loan) return 'Desconocido';
    return this.getPersonName(loan.personId);
  }

  getLoanId(loanId: string): string {
    return loanId.substring(0, 8).toUpperCase();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO');
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

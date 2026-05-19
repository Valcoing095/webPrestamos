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
    <div class="container-fluid p-4">
      <div class="row mb-4">
        <div class="col-md-6">
          <h1 class="h3">Dashboard</h1>
          <p class="text-muted">Resumen de tu cartera de préstamos</p>
        </div>
        <div class="col-md-6 text-end">
          <small class="text-muted">Última actualización: {{ getCurrentDate() }}</small>
        </div>
      </div>

      <!-- KPIs Principales -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-primary text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Capital Total Desembolsado</h6>
              <h3 class="mb-2">{{ formatCurrency(totalLoaned()) }}</h3>
              <small class="opacity-75">Incluye gestion propia y prestamistas</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-success text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Capital Recuperado</h6>
              <h3 class="mb-2">{{ formatCurrency(totalCollected()) }}</h3>
              <small class="opacity-75">{{ collectPercentage() }}% recuperado</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-warning text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Capital Pendiente</h6>
              <h3 class="mb-2">{{ formatCurrency(pendingCapital()) }}</h3>
              <small class="opacity-75">Por cobrar</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-info text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Préstamos Activos</h6>
              <h3 class="mb-2">{{ activeLoansCount() }}</h3>
              <small class="opacity-75">En proceso de cobro</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Secciones Resumen -->
      <div class="row g-4 mb-4">
        <!-- Gestión Propia -->
        <div class="col-md-6">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light border-bottom">
              <h5 class="card-title mb-0">Gestión Propia</h5>
            </div>
            <div class="card-body">
              <div class="row text-center mb-3">
                <div class="col-6">
                  <div class="bg-light rounded p-3 mb-3">
                    <div class="h4 mb-1 text-primary">{{ ownLoansCount() }}</div>
                    <small class="text-muted">Préstamos Activos</small>
                  </div>
                </div>
                <div class="col-6">
                  <div class="bg-light rounded p-3 mb-3">
                    <div class="h4 mb-1 text-success">{{ formatCurrency(ownCapital()) }}</div>
                    <small class="text-muted">Capital Desembolsado</small>
                  </div>
                </div>
              </div>
              <div class="progress mb-3" style="height: 25px;">
                <div 
                  class="progress-bar bg-success" 
                  [style.width.%]="ownCollectPercentage()"
                  role="progressbar"
                >
                  {{ ownCollectPercentage() }}%
                </div>
              </div>
              <small class="text-muted">{{ formatCurrency(ownCollected()) }} recuperados de {{ formatCurrency(ownCapital()) }}</small>
            </div>
          </div>
        </div>

        <!-- Prestamistas -->
        <div class="col-md-6">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light border-bottom">
              <h5 class="card-title mb-0">Gestión de Prestamistas</h5>
            </div>
            <div class="card-body">
              <div class="row text-center mb-3">
                <div class="col-6">
                  <div class="bg-light rounded p-3 mb-3">
                    <div class="h4 mb-1 text-info">{{ lenderLoansCount() }}</div>
                    <small class="text-muted">Préstamos Gestionados</small>
                  </div>
                </div>
                <div class="col-6">
                  <div class="bg-light rounded p-3 mb-3">
                    <div class="h4 mb-1 text-warning">{{ lendersCount() }}</div>
                    <small class="text-muted">Prestamistas Activos</small>
                  </div>
                </div>
              </div>
              <div class="progress mb-3" style="height: 25px;">
                <div 
                  class="progress-bar bg-info" 
                  [style.width.%]="lenderCollectPercentage()"
                  role="progressbar"
                >
                  {{ lenderCollectPercentage() }}%
                </div>
              </div>
              <small class="text-muted">{{ formatCurrency(lenderCollected()) }} recuperados de {{ formatCurrency(lenderCapital()) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Últimos Pagos -->
      <div class="row">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light border-bottom">
              <h5 class="card-title mb-0">Últimos Pagos Registrados</h5>
            </div>
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Cliente</th>
                    <th>Préstamo</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let payment of recentPayments()">
                    <td><strong>{{ getPersonNameForLoan(payment.loanId) }}</strong></td>
                    <td><span class="badge bg-secondary">{{ getLoanId(payment.loanId) }}</span></td>
                    <td class="text-end">{{ formatCurrency(payment.amount) }}</td>
                    <td>{{ formatDate(payment.date) }}</td>
                    <td>
                      <span class="badge bg-info">Pago</span>
                    </td>
                  </tr>
                  <tr *ngIf="recentPayments().length === 0">
                    <td colspan="5" class="text-center text-muted py-3">No hay pagos registrados</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Estadísticas por Tipo -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light border-bottom">
              <h5 class="card-title mb-0">Estado de Préstamos</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Activos</span>
                  <span class="badge bg-info">{{ activeLoansCount() }}</span>
                </div>
                <div class="progress" style="height: 10px;">
                  <div 
                    class="progress-bar bg-info" 
                    [style.width.%]="(activeLoansCount() / totalLoansCount() * 100)"
                  ></div>
                </div>
              </div>

              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Completados</span>
                  <span class="badge bg-success">{{ completedLoansCount() }}</span>
                </div>
                <div class="progress" style="height: 10px;">
                  <div 
                    class="progress-bar bg-success" 
                    [style.width.%]="(completedLoansCount() / totalLoansCount() * 100)"
                  ></div>
                </div>
              </div>

              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Vencidos</span>
                  <span class="badge bg-danger">{{ overdueLoansCount() }}</span>
                </div>
                <div class="progress" style="height: 10px;">
                  <div 
                    class="progress-bar bg-danger" 
                    [style.width.%]="(overdueLoansCount() / totalLoansCount() * 100)"
                  ></div>
                </div>
              </div>

              <hr />
              <small class="text-muted">Total de préstamos: {{ totalLoansCount() }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background-color: #f5f5f5;
      min-height: 100vh;
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

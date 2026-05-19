import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { featherHome, featherUsers, featherDollarSign, featherCreditCard } from '@ng-icons/feather-icons';
import {
  AuthService,
  PersonService,
  LoanService,
  PaymentService,
  LoanCalculator,
} from '../../services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Dashboard</h1>
        <p class="text-muted mb-0">Resumen de tu actividad de préstamos</p>
      </header>
      
      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="rounded-3 bg-primary bg-opacity-10 p-3">
                <ng-icon name="featherDollarSign" class="text-primary" style="font-size: 1.5rem;"></ng-icon>
              </div>
              <div>
                <span class="text-muted small">Total Prestado</span>
                <h3 class="h4 mb-0">{{ formatCurrency(summary().totalLoaned) }}</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="rounded-3 bg-success bg-opacity-10 p-3">
                <ng-icon name="featherCreditCard" class="text-success" style="font-size: 1.5rem;"></ng-icon>
              </div>
              <div>
                <span class="text-muted small">Cobrado</span>
                <h3 class="h4 mb-0">{{ formatCurrency(summary().totalCollected) }}</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="rounded-3 bg-warning bg-opacity-10 p-3">
                <ng-icon name="featherDollarSign" class="text-warning" style="font-size: 1.5rem;"></ng-icon>
              </div>
              <div>
                <span class="text-muted small">Pendiente</span>
                <h3 class="h4 mb-0">{{ formatCurrency(summary().totalPending) }}</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="rounded-3 bg-info bg-opacity-10 p-3">
                <ng-icon name="featherHome" class="text-info" style="font-size: 1.5rem;"></ng-icon>
              </div>
              <div>
                <span class="text-muted small">Activos</span>
                <h3 class="h4 mb-0">{{ summary().activeCount }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Quick Actions -->
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent border-bottom">
              <h5 class="card-title mb-0">Accesos Rápidos</h5>
            </div>
            <div class="card-body d-flex flex-column gap-2">
              <a routerLink="/personas" class="btn btn-outline-primary d-flex align-items-center gap-2">
                <ng-icon name="featherUsers"></ng-icon> Agregar Persona
              </a>
              <a routerLink="/prestamos" class="btn btn-outline-success d-flex align-items-center gap-2">
                <ng-icon name="featherDollarSign"></ng-icon> Nuevo Préstamo
              </a>
              <a routerLink="/pagos" class="btn btn-outline-warning d-flex align-items-center gap-2">
                <ng-icon name="featherCreditCard"></ng-icon> Registrar Pago
              </a>
            </div>
          </div>
        </div>

        <!-- Recent Loans -->
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Últimos Préstamos</h5>
              <a routerLink="/prestamos" class="btn btn-sm btn-link">Ver todos</a>
            </div>
            <div class="card-body p-0">
              @for (loan of recentLoans(); track loan.id) {
                <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <div>
                    <span class="fw-medium">{{ getPersonName(loan.personId) }}</span>
                    <small class="text-muted d-block">{{ formatDate(loan.date) }}</small>
                  </div>
                  <span class="badge" [class]="isLoanCompleted(loan) ? 'bg-success' : 'bg-warning'">
                    {{ isLoanCompleted(loan) ? 'Pagado' : formatCurrency(getLoanBalance(loan)) }}
                  </span>
                </div>
              } @empty {
                <div class="text-center text-muted p-4">No hay préstamos registrados</div>
              }
            </div>
          </div>
        </div>

        <!-- Recent Payments -->
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Últimos Pagos</h5>
              <a routerLink="/pagos" class="btn btn-sm btn-link">Ver todos</a>
            </div>
            <div class="card-body p-0">
              @for (payment of recentPayments(); track payment.id) {
                <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <div>
                    <span class="fw-medium">{{ getLoanPersonName(payment.loanId) }}</span>
                    <small class="text-muted d-block">{{ formatDate(payment.date) }}</small>
                  </div>
                  <span class="badge bg-success">+{{ formatCurrency(payment.amount) }}</span>
                </div>
              } @empty {
                <div class="text-center text-muted p-4">No hay pagos registrados</div>
              }
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
  `],
})
export class DashboardComponent implements OnInit {
  constructor(
    public authService: AuthService,
    private personService: PersonService,
    private loanService: LoanService,
    private paymentService: PaymentService,
  ) {}

  ngOnInit(): void {
    this.loanService.setPaymentService(this.paymentService);
  }

  private userId = computed(() => this.authService.getUserId());

  summary = computed(() => {
    const uid = this.userId();
    if (!uid) return { totalLoaned: 0, totalCollected: 0, totalPending: 0, activeCount: 0 };

    const loans = this.loanService.getLoansSignal(uid)();
    const payments = this.paymentService.getPaymentsSignal(uid)();
    return LoanCalculator.getSummary(loans, payments);
  });

  recentLoans = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.loanService
      .getLoansSignal(uid)()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  });

  recentPayments = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.paymentService
      .getPaymentsSignal(uid)()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  });

  getPersonName(personId: string): string {
    return this.personService.getById(personId)?.name || 'Desconocido';
  }

  getLoanPersonName(loanId: string): string {
    const loan = this.loanService.getById(loanId);
    if (!loan) return 'Desconocido';
    return this.getPersonName(loan.personId);
  }

  isLoanCompleted(loan: any): boolean {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
    return totalPaid >= total;
  }

  getLoanBalance(loan: any): number {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
    return Math.max(0, total - totalPaid);
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }

  logout(): void {
    this.authService.logout();
  }
}

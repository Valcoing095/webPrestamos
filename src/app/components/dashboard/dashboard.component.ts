import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a href="#" class="nav-brand">📋 Gestor de Préstamos</a>
        <div class="nav-links">
          <a routerLink="/dashboard" class="nav-link active">Dashboard</a>
          <a routerLink="/personas" class="nav-link">Personas</a>
          <a routerLink="/prestamos" class="nav-link">Préstamos</a>
          <a routerLink="/pagos" class="nav-link">Pagos</a>
        </div>
        <div class="nav-user">
          <span class="nav-username">{{ authService.currentUser()?.name }}</span>
          <button class="nav-btn-logout" (click)="logout()">Cerrar Sesión</button>
        </div>
        <button class="nav-hamburger" aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <header class="page-header">
          <h1>Dashboard</h1>
          <p class="subtitle">Resumen de tu actividad de préstamos</p>
        </header>

        <section class="summary-cards">
          <div class="card card-blue">
            <div class="card-icon">💵</div>
            <div class="card-content">
              <span class="card-label">Total Prestado</span>
              <span class="card-value">{{ formatCurrency(summary().totalLoaned) }}</span>
            </div>
          </div>
          <div class="card card-green">
            <div class="card-icon">✓</div>
            <div class="card-content">
              <span class="card-label">Cobrado</span>
              <span class="card-value">{{ formatCurrency(summary().totalCollected) }}</span>
            </div>
          </div>
          <div class="card card-amber">
            <div class="card-icon">⏳</div>
            <div class="card-content">
              <span class="card-label">Pendiente</span>
              <span class="card-value">{{ formatCurrency(summary().totalPending) }}</span>
            </div>
          </div>
          <div class="card card-purple">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <span class="card-label">Activos</span>
              <span class="card-value">{{ summary().activeCount }}</span>
            </div>
          </div>
        </section>

        <div class="dashboard-grid">
          <section class="card-section">
            <h2>Accesos Rápidos</h2>
            <div class="quick-actions">
              <a routerLink="/personas" class="quick-action">
                <span class="qa-icon">👤</span>
                <span class="qa-label">Agregar Persona</span>
              </a>
              <a routerLink="/prestamos" class="quick-action">
                <span class="qa-icon">💰</span>
                <span class="qa-label">Nuevo Préstamo</span>
              </a>
              <a routerLink="/pagos" class="quick-action">
                <span class="qa-icon">💳</span>
                <span class="qa-label">Registrar Pago</span>
              </a>
            </div>
          </section>

          <section class="card-section">
            <div class="section-header">
              <h2>Últimos Préstamos</h2>
              <a routerLink="/prestamos" class="see-all">Ver todos →</a>
            </div>
            <div id="recent-loans" class="recent-list">
              @for (loan of recentLoans(); track loan.id) {
                <div class="recent-item">
                  <div class="recent-item-info">
                    <span class="recent-item-name">{{ getPersonName(loan.personId) }}</span>
                    <span class="recent-item-detail">{{ formatDate(loan.date) }}</span>
                  </div>
                  <span
                    class="recent-item-amount"
                    [class.paid]="isLoanCompleted(loan)"
                    [class.pending]="!isLoanCompleted(loan)"
                  >
                    {{ isLoanCompleted(loan) ? '✓ Pagado' : formatCurrency(getLoanBalance(loan)) }}
                  </span>
                </div>
              } @empty {
                <div class="empty-recent">No hay préstamos registrados</div>
              }
            </div>
          </section>

          <section class="card-section">
            <div class="section-header">
              <h2>Últimos Pagos</h2>
              <a routerLink="/pagos" class="see-all">Ver todos →</a>
            </div>
            <div id="recent-payments" class="recent-list">
              @for (payment of recentPayments(); track payment.id) {
                <div class="recent-item">
                  <div class="recent-item-info">
                    <span class="recent-item-name">{{ getLoanPersonName(payment.loanId) }}</span>
                    <span class="recent-item-detail">{{ formatDate(payment.date) }}</span>
                  </div>
                  <span class="recent-item-amount paid">+{{ formatCurrency(payment.amount) }}</span>
                </div>
              } @empty {
                <div class="empty-recent">No hay pagos registrados</div>
              }
            </div>
          </section>
        </div>
      </div>
    </main>
  `,
  styles: [
    `
      .navbar {
        background: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 1rem 0;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
      }
      .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .nav-brand {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1a1a2e;
        text-decoration: none;
      }
      .nav-links {
        display: flex;
        gap: 1.5rem;
      }
      .nav-link {
        color: #666;
        text-decoration: none;
        font-weight: 500;
        padding: 0.5rem 0;
        border-bottom: 2px solid transparent;
        transition: all 0.3s;
      }
      .nav-link:hover,
      .nav-link.active {
        color: #667eea;
        border-bottom-color: #667eea;
      }
      .nav-user {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .nav-username {
        font-weight: 500;
        color: #333;
      }
      .nav-btn-logout {
        background: #f3f4f6;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        color: #666;
        transition: all 0.3s;
      }
      .nav-btn-logout:hover {
        background: #e5e7eb;
      }
      .nav-hamburger {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
      }
      .main-content {
        margin-top: 80px;
        padding: 2rem 1.5rem;
        background: #f5f7fa;
        min-height: calc(100vh - 80px);
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 2rem;
      }
      .page-header h1 {
        font-size: 2rem;
        color: #1a1a2e;
        margin: 0 0 0.5rem 0;
      }
      .subtitle {
        color: #666;
        margin: 0;
      }
      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      .card {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
      .card-icon {
        font-size: 2rem;
        width: 60px;
        height: 60px;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card-blue .card-icon {
        background: #dbeafe;
      }
      .card-green .card-icon {
        background: #dcfce7;
      }
      .card-amber .card-icon {
        background: #fef3c7;
      }
      .card-purple .card-icon {
        background: #ede9fe;
      }
      .card-content {
        display: flex;
        flex-direction: column;
      }
      .card-label {
        font-size: 0.875rem;
        color: #666;
      }
      .card-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a2e;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      @media (min-width: 768px) {
        .dashboard-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .card-section {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
      .card-section h2 {
        font-size: 1.25rem;
        color: #1a1a2e;
        margin: 0 0 1rem 0;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .section-header h2 {
        margin: 0;
      }
      .see-all {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.875rem;
      }
      .quick-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .quick-action {
        flex: 1;
        min-width: 120px;
        background: #f5f7fa;
        border-radius: 0.75rem;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        transition: all 0.3s;
      }
      .quick-action:hover {
        background: #eef2ff;
        transform: translateY(-2px);
      }
      .qa-icon {
        font-size: 2rem;
      }
      .qa-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1a1a2e;
      }
      .recent-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .recent-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: #f5f7fa;
        border-radius: 0.5rem;
      }
      .recent-item-info {
        display: flex;
        flex-direction: column;
      }
      .recent-item-name {
        font-weight: 500;
        color: #1a1a2e;
      }
      .recent-item-detail {
        font-size: 0.75rem;
        color: #666;
      }
      .recent-item-amount {
        font-weight: 600;
      }
      .recent-item-amount.paid {
        color: #22c55e;
      }
      .recent-item-amount.pending {
        color: #f59e0b;
      }
      .empty-recent {
        text-align: center;
        padding: 2rem;
        color: #666;
      }
      @media (max-width: 768px) {
        .nav-links {
          display: none;
        }
        .nav-hamburger {
          display: block;
        }
      }
    `,
  ],
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
    const total = LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
    return totalPaid >= total;
  }

  getLoanBalance(loan: any): number {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
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

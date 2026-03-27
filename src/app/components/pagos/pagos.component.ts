import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, PersonService, LoanService, PaymentService, LoanCalculator } from '../../services';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a href="#" class="nav-brand">📋 Gestor de Préstamos</a>
        <div class="nav-links">
          <a routerLink="/dashboard" class="nav-link">Dashboard</a>
          <a routerLink="/personas" class="nav-link">Personas</a>
          <a routerLink="/prestamos" class="nav-link">Préstamos</a>
          <a routerLink="/pagos" class="nav-link active">Pagos</a>
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
          <h1>Registro de Pagos</h1>
          <p class="subtitle">Registra los pagos de tus préstamos</p>
        </header>

        <section class="form-section">
          <h2>Nuevo Pago</h2>
          <form (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label for="payment-loan">Préstamo *</label>
                <select id="payment-loan" [(ngModel)]="formData.loanId" name="loanId" class="form-control" required (change)="updatePreview()">
                  <option value="">Seleccionar préstamo...</option>
                  @for (loan of activeLoans(); track loan.id) {
                    <option [value]="loan.id">{{ getPersonName(loan.personId) }} - {{ formatCurrency(getTotalAmount(loan)) }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="payment-amount">Monto del Pago *</label>
                <input type="number" id="payment-amount" [(ngModel)]="formData.amount" name="amount" class="form-control" placeholder="$0.00" min="0.01" step="0.01" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="payment-date">Fecha del Pago *</label>
                <input type="date" id="payment-date" [(ngModel)]="formData.date" name="date" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="payment-notes">Notas</label>
                <input type="text" id="payment-notes" [(ngModel)]="formData.notes" name="notes" class="form-control" placeholder="Opcional">
              </div>
            </div>

            @if (previewLoan()) {
              <div class="payment-preview">
                <div class="preview-row">
                  <span class="preview-label">Deudor:</span>
                  <span class="preview-value">{{ getPersonName(previewLoan()!.personId) }}</span>
                </div>
                <div class="preview-row">
                  <span class="preview-label">Total del Préstamo:</span>
                  <span class="preview-value">{{ formatCurrency(getTotalAmount(previewLoan()!)) }}</span>
                </div>
                <div class="preview-row">
                  <span class="preview-label">Ya Pagado:</span>
                  <span class="preview-value green">{{ formatCurrency(getPaidAmount(previewLoan()!)) }}</span>
                </div>
                <div class="preview-row highlight">
                  <span class="preview-label">Saldo Pendiente:</span>
                  <span class="preview-value">{{ formatCurrency(getBalance(previewLoan()!)) }}</span>
                </div>
              </div>
            }

            <button type="submit" class="btn btn-primary">Registrar Pago</button>
          </form>
        </section>

        <section class="card-section">
          <div class="section-header">
            <h2>Historial de Pagos</h2>
          </div>
          <div class="payments-list">
            @for (group of groupedPayments(); track group.loanId) {
              <div class="payment-group">
                <div class="payment-group-header">
                  <span class="group-person">{{ getPersonName(group.personId) }}</span>
                  <span class="group-total">Total: {{ formatCurrency(group.totalPaid) }}</span>
                </div>
                @for (payment of group.payments; track payment.id) {
                  <div class="payment-item">
                    <div class="payment-info">
                      <span class="payment-date">{{ formatDate(payment.date) }}</span>
                      @if (payment.notes) {
                        <span class="payment-notes">{{ payment.notes }}</span>
                      }
                    </div>
                    <div class="payment-amount">{{ formatCurrency(payment.amount) }}</div>
                  </div>
                }
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">💳</span>
                <p>No hay pagos registrados.</p>
                <p class="empty-hint">¡Registra tu primer pago!</p>
              </div>
            }
          </div>
        </section>
      </div>
    </main>

    @if (toast()) {
      <div class="toast" [class]="'toast-' + toast()?.type">
        <span class="toast-message">{{ toast()?.message }}</span>
        <button class="toast-close" (click)="clearToast()">×</button>
      </div>
    }
  `,
  styles: [`
    .navbar {
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
    .nav-link:hover, .nav-link.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    .nav-user { display: flex; align-items: center; gap: 1rem; }
    .nav-username { font-weight: 500; color: #333; }
    .nav-btn-logout {
      background: #f3f4f6;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      color: #666;
    }
    .nav-hamburger { display: none; }
    .main-content {
      margin-top: 80px;
      padding: 2rem 1.5rem;
      background: #f5f7fa;
      min-height: calc(100vh - 80px);
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; color: #1a1a2e; margin: 0 0 0.5rem 0; }
    .subtitle { color: #666; margin: 0; }
    .form-section, .card-section {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }
    .form-section h2, .card-section h2 {
      font-size: 1.25rem;
      color: #1a1a2e;
      margin: 0 0 1.5rem 0;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }
    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e1e1e1;
      border-radius: 0.5rem;
      font-size: 1rem;
    }
    .form-control:focus { outline: none; border-color: #667eea; }
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    .payment-preview {
      background: #f5f7fa;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .preview-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .preview-row:last-child { border-bottom: none; }
    .preview-row.highlight {
      background: #eef2ff;
      margin: 0.5rem -1.25rem -1.25rem;
      padding: 1rem 1.25rem;
      border-radius: 0 0 0.75rem 0.75rem;
      border-bottom: none;
    }
    .preview-label { color: #666; }
    .preview-value { font-weight: 600; color: #1a1a2e; }
    .preview-value.green { color: #22c55e; }
    .payments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .payment-group {
      background: #f9fafb;
      border-radius: 0.75rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
    }
    .payment-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .group-person {
      font-weight: 600;
      color: #1a1a2e;
    }
    .group-total {
      font-size: 0.875rem;
      color: #22c55e;
      font-weight: 600;
    }
    .payment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: white;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .payment-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .payment-date { font-weight: 500; color: #1a1a2e; }
    .payment-notes { font-size: 0.75rem; color: #666; }
    .payment-amount {
      font-weight: 600;
      color: #22c55e;
    }
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
    .empty-icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
    .empty-hint { color: #999; font-size: 0.875rem; }
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 1rem;
      z-index: 300;
      animation: slideIn 0.3s ease-out;
    }
    .toast-success { border-left: 4px solid #22c55e; }
    .toast-error { border-left: 4px solid #dc2626; }
    .toast-close { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #666; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @media (max-width: 768px) {
      .nav-links, .nav-hamburger { display: none; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class PagosComponent implements OnInit {
  formData = {
    loanId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };

  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  constructor(
    public authService: AuthService,
    private personService: PersonService,
    private loanService: LoanService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.loanService.setPaymentService(this.paymentService);
  }

  activeLoans = computed(() => {
    const userId = this.authService.getUserId();
    return userId ? this.loanService.getActiveLoans(userId) : [];
  });

  payments = computed(() => {
    const userId = this.authService.getUserId();
    return userId ? this.paymentService.getByUserId(userId) : [];
  });

  previewLoan = computed(() => {
    if (!this.formData.loanId) return null;
    return this.loanService.getById(this.formData.loanId);
  });

  groupedPayments = computed(() => {
    const payments = this.payments();
    const groups: Map<string, { loanId: string; personId: string; payments: any[]; totalPaid: number }> = new Map();

    payments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(payment => {
        const loan = this.loanService.getById(payment.loanId);
        if (!loan) return;

        if (!groups.has(payment.loanId)) {
          groups.set(payment.loanId, {
            loanId: payment.loanId,
            personId: loan.personId,
            payments: [],
            totalPaid: 0
          });
        }

        const group = groups.get(payment.loanId)!;
        group.payments.push(payment);
        group.totalPaid += payment.amount;
      });

    return Array.from(groups.values());
  });

  getPersonName(personId: string): string {
    return this.personService.getById(personId)?.name || 'Desconocido';
  }

  getTotalAmount(loan: any): number {
    return LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
  }

  getPaidAmount(loan: any): number {
    return this.paymentService.getTotalPaidForLoan(loan.id);
  }

  getBalance(loan: any): number {
    const total = this.getTotalAmount(loan);
    const paid = this.getPaidAmount(loan);
    return Math.max(0, total - paid);
  }

  updatePreview(): void {
    const loan = this.previewLoan();
    if (loan) {
      this.formData.amount = this.getBalance(loan);
    }
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }

  onSubmit(): void {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;

      this.paymentService.create({
        ...this.formData,
        userId
      });

      this.showToast('Pago registrado', 'success');
      this.formData = {
        loanId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      };
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    setTimeout(() => this.clearToast(), 3000);
  }

  clearToast(): void {
    this.toast.set(null);
  }

  logout(): void {
    this.authService.logout();
  }
}

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthService,
  PersonService,
  LoanService,
  PaymentService,
  LoanCalculator,
} from '../../core/services';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Gestion de Pagos</h1>
        <p class="text-muted mb-0">Registra y visualiza tus pagos</p>
      </header>

      <!-- Resumen -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-success text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Total Cobrado</h6>
              <h3 class="card-title mb-0">{{ formatCurrency(totalCollected()) }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Pagos Este Mes</h6>
              <h3 class="card-title mb-0">{{ paymentsThisMonth() }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Total de Pagos</h6>
              <h3 class="card-title mb-0">{{ payments().length }}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Formulario -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-transparent">
          <h5 class="card-title mb-0">Registrar Nuevo Pago</h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="onSubmit()">
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <label for="payment-loan" class="form-label">Prestamo *</label>
                <select id="payment-loan" [(ngModel)]="formData.loanId" name="loanId" class="form-select" required>
                  <option value="">Seleccionar prestamo...</option>
                  @for (loan of activeLoans(); track loan.id) {
                    <option [value]="loan.id">{{ getPersonName(loan.personId) }} - {{ formatCurrency(loan.amount) }} (Saldo: {{ formatCurrency(getLoanBalance(loan)) }})</option>
                  }
                </select>
              </div>
              <div class="col-md-3">
                <label for="payment-amount" class="form-label">Monto *</label>
                <input type="number" id="payment-amount" [(ngModel)]="formData.amount" name="amount" 
                       class="form-control" min="0.01" step="0.01" placeholder="$0.00" required />
              </div>
              <div class="col-md-3">
                <label for="payment-date" class="form-label">Fecha *</label>
                <input type="date" id="payment-date" [(ngModel)]="formData.date" name="date" class="form-control" required />
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button type="submit" class="btn btn-success w-100">Registrar</button>
              </div>
            </div>
            <div class="mb-3">
              <label for="payment-notes" class="form-label">Notas</label>
              <input type="text" id="payment-notes" [(ngModel)]="formData.notes" name="notes" class="form-control" placeholder="Opcional" />
            </div>
          </form>
        </div>
      </div>

      <!-- Lista de Pagos -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Historial de Pagos</h5>
          <span class="badge bg-success">{{ payments().length }}</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="px-3">Fecha</th>
                  <th>Cliente</th>
                  <th>Prestamo</th>
                  <th>Monto Pagado</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                @for (payment of payments(); track payment.id) {
                  <tr>
                    <td class="px-3">{{ formatDate(payment.date) }}</td>
                    <td>{{ getLoanPersonName(payment.loanId) }}</td>
                    <td>{{ formatCurrency(getLoanAmount(payment.loanId)) }}</td>
                    <td class="text-success fw-bold">+{{ formatCurrency(payment.amount) }}</td>
                    <td class="text-muted small">{{ payment.notes || '-' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center text-muted py-4">No hay pagos registrados</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    @if (toast()) {
      <div class="toast show position-fixed bottom-0 end-0 m-3" [class]="'bg-' + (toast()?.type === 'success' ? 'success' : 'danger') + ' text-white'">
        <div class="toast-body d-flex justify-content-between align-items-center">
          {{ toast()?.message }}
          <button type="button" class="btn-close btn-close-white" (click)="clearToast()"></button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class PagosComponent implements OnInit {
  formData = { loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' };
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

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

  payments = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.paymentService.getPaymentsSignal(uid)()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  totalCollected = computed(() => {
    return this.payments().reduce((sum, p) => sum + p.amount, 0);
  });

  paymentsThisMonth = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.payments().filter(p => new Date(p.date) >= startOfMonth).length;
  });

  activeLoans = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.loanService.getLoansSignal(uid)()
      .filter(loan => {
        const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
        const total = loan.totalToCollect || loan.amount;
        return totalPaid < total;
      });
  });

  getPersonName(personId: string): string {
    return this.personService.getById(personId)?.name || 'Desconocido';
  }

  getLoanPersonName(loanId: string): string {
    const loan = this.loanService.getById(loanId);
    if (!loan) return 'Desconocido';
    return this.getPersonName(loan.personId);
  }

  getLoanAmount(loanId: string): number {
    const loan = this.loanService.getById(loanId);
    return loan?.amount || 0;
  }

  getLoanBalance(loan: any): number {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || loan.amount;
    return Math.max(0, total - totalPaid);
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
        loanId: this.formData.loanId,
        userId,
        amount: this.formData.amount,
        date: this.formData.date,
        notes: this.formData.notes,
      });

      this.showToast('Pago registrado', 'success');
      this.formData = { loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' };
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
}

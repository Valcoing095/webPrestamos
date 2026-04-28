import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  PersonService,
  LoanService,
  PaymentService,
  LoanCalculator,
} from '../../services';
import { Loan, PaymentFrequency } from '../../models';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Gestión de Préstamos</h1>
        <p class="text-muted mb-0">Registra y controla tus préstamos</p>
      </header>
      
      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-6 col-lg-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-danger">En Mora</h5>
              <h3 class="h4 mb-0">{{ overdueCount() }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-warning">Días Mora Total</h5>
              <h3 class="h4 mb-0">{{ totalOverdueDays() }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-transparent">
          <h5 class="card-title mb-0">Nuevo Préstamo</h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="onSubmit()">
            <div class="row g-3 mb-3">
              <div class="col-12 col-md-3">
                <label for="loan-person" class="form-label">Persona *</label>
                <select id="loan-person" [(ngModel)]="formData.personId" name="personId" class="form-select" required>
                  <option value="">Seleccionar persona...</option>
                  @for (person of persons(); track person.id) {
                    <option [value]="person.id">{{ person.name }}</option>
                  }
                </select>
              </div>
              <div class="col-12 col-md-3">
                <label for="loan-amount" class="form-label">Monto Prestado *</label>
                <input type="number" id="loan-amount" [(ngModel)]="formData.amount" name="amount" 
                       class="form-control" placeholder="$0.00" min="1" step="0.01" required />
              </div>
              <div class="col-12 col-md-3">
                <label for="loan-date" class="form-label">Fecha *</label>
                <input type="date" id="loan-date" [(ngModel)]="formData.date" name="date" class="form-control" required />
              </div>
              <div class="col-12 col-md-3">
                <label for="loan-frequency" class="form-label">Frecuencia</label>
                <select id="loan-frequency" [(ngModel)]="formData.paymentFrequency" name="paymentFrequency" class="form-select">
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Catorcenal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn btn-primary">Crear Préstamo</button>
          </form>
        </div>
      </div>

      <!-- Lista de Préstamos -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Préstamos Registrados</h5>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm" [class]="currentFilter() === 'all' ? 'btn-primary' : 'btn-outline-primary'" (click)="setFilter('all')">Todos</button>
            <button type="button" class="btn btn-sm" [class]="currentFilter() === 'active' ? 'btn-primary' : 'btn-outline-primary'" (click)="setFilter('active')">Activos</button>
            <button type="button" class="btn btn-sm" [class]="currentFilter() === 'overdue' ? 'btn-primary' : 'btn-outline-primary'" (click)="setFilter('overdue')">En Mora</button>
            <button type="button" class="btn btn-sm" [class]="currentFilter() === 'completed' ? 'btn-primary' : 'btn-outline-primary'" (click)="setFilter('completed')">Completados</button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Persona</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (loan of filteredLoans(); track loan.id) {
                  <tr>
                    <td>{{ getPersonName(loan.personId) }}</td>
                    <td>{{ formatCurrency(loan.amount) }}</td>
                    <td>{{ formatDate(loan.date) }}</td>
                    <td>
                      <span class="badge" [class]="isLoanCompleted(loan) ? 'bg-success' : isOverdue(loan) ? 'bg-danger' : 'bg-warning'">
                        {{ isLoanCompleted(loan) ? 'Completado' : isOverdue(loan) ? 'En Mora' : 'Activo' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="openPaymentModal(loan)">Pagar</button>
                      <button class="btn btn-sm btn-outline-info me-1" (click)="openHistoryModal(loan)">Historial</button>
                      <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(loan)">Eliminar</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center text-muted py-4">No hay préstamos registrados</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Pago -->
    @if (showPaymentModal()) {
      <div class="modal show d-block" tabindex="-1" (click)="closePaymentModal($event)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Registrar Pago</h5>
              <button type="button" class="btn-close" (click)="closePaymentModal()"></button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="submitPayment()">
                <div class="mb-3">
                  <label class="form-label">Monto Sugerido</label>
                  <p class="h4">{{ formatCurrency(selectedLoanBalance()) }}</p>
                </div>
                <div class="mb-3">
                  <label for="payment-amount" class="form-label">Monto a Pagar</label>
                  <input type="number" id="payment-amount" [(ngModel)]="paymentData.amount" name="amount" 
                         class="form-control" min="0.01" step="0.01" required />
                </div>
                <div class="mb-3">
                  <label for="payment-date" class="form-label">Fecha</label>
                  <input type="date" id="payment-date" [(ngModel)]="paymentData.date" name="date" class="form-control" required />
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary">Registrar Pago</button>
                  <button type="button" class="btn btn-secondary" (click)="closePaymentModal()">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal Historial -->
    @if (showHistoryModal()) {
      <div class="modal show d-block" tabindex="-1" (click)="closeHistoryModal($event)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Historial de Pagos</h5>
              <button type="button" class="btn-close" (click)="closeHistoryModal()"></button>
            </div>
            <div class="modal-body">
              @for (payment of loanPayments(); track payment.id) {
                <div class="card mb-2">
                  <div class="card-body py-2">
                    <div class="d-flex justify-content-between">
                      <span>{{ formatCurrency(payment.amount) }}</span>
                      <small class="text-muted">{{ formatDate(payment.date) }}</small>
                    </div>
                  </div>
                </div>
              } @empty {
                <p class="text-muted text-center py-3">No hay pagos registrados</p>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal Confirmación -->
    @if (showConfirmModal()) {
      <div class="modal show d-block" tabindex="-1" (click)="closeConfirmModal()">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar</h5>
              <button type="button" class="btn-close" (click)="closeConfirmModal()"></button>
            </div>
            <div class="modal-body">
              <p>¿Eliminar este préstamo y sus pagos?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeConfirmModal()">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="deleteLoan()">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Toast -->
    @if (toast()) {
      <div class="toast show position-fixed bottom-0 end-0 m-3" [class]="'toast-' + toast()?.type">
        <div class="toast-header">
          <strong class="me-auto">{{ toast()?.type === 'success' ? 'Éxito' : 'Error' }}</strong>
          <button type="button" class="btn-close" (click)="clearToast()"></button>
        </div>
        <div class="toast-body">
          {{ toast()?.message }}
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
export class PrestamosComponent implements OnInit {
  formData = { personId: '', amount: 0, date: new Date().toISOString().split('T')[0], paymentFrequency: 'monthly' as PaymentFrequency, totalToCollect: 0, notes: '', term: 0 };
  paymentData = { amount: 0, date: new Date().toISOString().split('T')[0], notes: '' };
  currentFilter = signal<'all' | 'active' | 'overdue' | 'completed'>('all');
  showPaymentModal = signal(false);
  showHistoryModal = signal(false);
  showConfirmModal = signal(false);
  selectedLoan = signal<Loan | null>(null);
  loanToDelete = signal<Loan | null>(null);
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

  persons = computed(() => {
    const uid = this.userId();
    return uid ? this.personService.getPersonsSignal(uid)() : [];
  });

  loans = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.loanService.getLoansSignal(uid)();
  });

  filteredLoans = computed(() => {
    const filter = this.currentFilter();
    const loans = this.loans();

    switch (filter) {
      case 'active':
        return loans.filter((loan) => !this.isLoanCompleted(loan));
      case 'overdue':
        return loans.filter((loan) => this.isOverdue(loan));
      case 'completed':
        return loans.filter((loan) => this.isLoanCompleted(loan));
      default:
        return loans;
    }
  });

  overdueCount = computed(() => {
    return this.loans().filter((loan) => this.isOverdue(loan)).length;
  });

  totalOverdueDays = computed(() => {
    return this.loans().reduce((sum, loan) => {
      if (this.isOverdue(loan)) {
        return sum + loan.getDaysOverdue();
      }
      return sum;
    }, 0);
  });

  selectedLoanBalance = computed(() => {
    const loan = this.selectedLoan();
    if (!loan) return 0;
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || loan.amount;
    return Math.max(0, total - totalPaid);
  });

  loanPayments = computed(() => {
    const loan = this.selectedLoan();
    if (!loan) return [];
    return this.paymentService
      .getByLoanId(loan.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  setFilter(filter: 'all' | 'active' | 'overdue' | 'completed'): void {
    this.currentFilter.set(filter);
  }

  getPersonName(personId: string): string {
    return this.personService.getById(personId)?.name || 'Desconocido';
  }

  isOverdue(loan: Loan): boolean {
    return loan.isOverdue();
  }

  isLoanCompleted(loan: Loan): boolean {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || loan.amount;
    return totalPaid >= total;
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

      this.loanService.create({
        personId: this.formData.personId,
        amount: this.formData.amount,
        date: this.formData.date,
        paymentFrequency: this.formData.paymentFrequency,
        totalToCollect: this.formData.totalToCollect,
        notes: this.formData.notes,
        userId,
        trackingNotes: [],
      });

      this.showToast('Préstamo creado', 'success');
      this.formData = { personId: '', amount: 0, date: new Date().toISOString().split('T')[0], paymentFrequency: 'monthly', totalToCollect: 0, notes: '', term: 0 };
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  openPaymentModal(loan: Loan): void {
    this.selectedLoan.set(loan);
    this.paymentData = { amount: this.selectedLoanBalance(), date: new Date().toISOString().split('T')[0], notes: '' };
    this.showPaymentModal.set(true);
  }

  closePaymentModal(event?: MouseEvent): void {
    if (event && !(event.target as HTMLElement).classList.contains('modal')) return;
    this.showPaymentModal.set(false);
    this.selectedLoan.set(null);
  }

  openHistoryModal(loan: Loan): void {
    this.selectedLoan.set(loan);
    this.showHistoryModal.set(true);
  }

  closeHistoryModal(event?: MouseEvent): void {
    if (event && !(event.target as HTMLElement).classList.contains('modal')) return;
    this.showHistoryModal.set(false);
    this.selectedLoan.set(null);
  }

  submitPayment(): void {
    const loan = this.selectedLoan();
    if (!loan) return;

    try {
      const userId = this.authService.getUserId();
      if (!userId) return;

      this.paymentService.create({
        loanId: loan.id,
        userId,
        amount: this.paymentData.amount,
        date: this.paymentData.date,
        notes: this.paymentData.notes,
      });

      this.showToast('Pago registrado', 'success');
      this.closePaymentModal();
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  confirmDelete(loan: Loan): void {
    this.loanToDelete.set(loan);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.loanToDelete.set(null);
  }

  deleteLoan(): void {
    const loan = this.loanToDelete();
    if (loan) {
      this.loanService.deleteCascade(loan.id);
      this.showToast('Préstamo eliminado', 'success');
    }
    this.closeConfirmModal();
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

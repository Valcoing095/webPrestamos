import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthService,
  PersonService,
  LoanService,
  PaymentService,
  LoanCalculator,
  LenderService
} from '../../core/services';
import { Loan, PaymentFrequency } from '../../core/models';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Gestion de Prestamos</h1>
        <p class="text-muted mb-0">Registra y controla tus prestamos</p>
      </header>
      
      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Total Prestado</h6>
              <h4 class="card-title mb-0 text-primary">{{ formatCurrency(totalLoaned()) }}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Prestamos Activos</h6>
              <h4 class="card-title mb-0 text-warning">{{ activeLoansCount() }}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Completados</h6>
              <h4 class="card-title mb-0 text-success">{{ completedLoansCount() }}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">En Mora</h6>
              <h4 class="card-title mb-0 text-danger">{{ overdueCount() }}</h4>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-transparent">
          <h5 class="card-title mb-0">Nuevo Prestamo</h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="onSubmit()">
            <div class="row g-3 mb-3">
              <div class="col-md-3">
                <label for="loan-person" class="form-label">Cliente *</label>
                <select id="loan-person" [(ngModel)]="formData.personId" name="personId" class="form-select" required>
                  <option value="">Seleccionar cliente...</option>
                  @for (person of persons(); track person.id) {
                    <option [value]="person.id">{{ person.name }}</option>
                  }
                </select>
              </div>
              <div class="col-md-3">
                <label for="loan-lender" class="form-label">Prestamista</label>
                <select id="loan-lender" [(ngModel)]="formData.lenderId" name="lenderId" class="form-select">
                  <option value="">Sin prestamista</option>
                  @for (lender of lenders(); track lender.id) {
                    <option [value]="lender.id">{{ lender.name }}</option>
                  }
                </select>
              </div>
              <div class="col-md-2">
                <label for="loan-amount" class="form-label">Monto *</label>
                <input type="number" id="loan-amount" [(ngModel)]="formData.amount" name="amount" 
                       class="form-control" placeholder="$0.00" min="1" step="0.01" required />
              </div>
              <div class="col-md-2">
                <label for="loan-interest" class="form-label">Interes %</label>
                <input type="number" id="loan-interest" [(ngModel)]="formData.interest" name="interest" 
                       class="form-control" placeholder="0" min="0" step="0.1" />
              </div>
              <div class="col-md-2">
                <label for="loan-total" class="form-label">Total a Cobrar *</label>
                <input type="number" id="loan-total" [(ngModel)]="formData.totalToCollect" name="totalToCollect" 
                       class="form-control" placeholder="$0.00" min="1" step="0.01" required />
              </div>
            </div>
            <div class="row g-3 mb-3">
              <div class="col-md-3">
                <label for="loan-date" class="form-label">Fecha *</label>
                <input type="date" id="loan-date" [(ngModel)]="formData.date" name="date" class="form-control" required />
              </div>
              <div class="col-md-3">
                <label for="loan-frequency" class="form-label">Frecuencia de Pago</label>
                <select id="loan-frequency" [(ngModel)]="formData.paymentFrequency" name="paymentFrequency" class="form-select">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div class="col-md-6">
                <label for="loan-notes" class="form-label">Notas</label>
                <input type="text" id="loan-notes" [(ngModel)]="formData.notes" name="notes" class="form-control" placeholder="Notas opcionales..." />
              </div>
            </div>
            <button type="submit" class="btn btn-primary">Crear Prestamo</button>
          </form>
        </div>
      </div>

      <!-- Filtros y Lista de Prestamos -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 class="card-title mb-0">Prestamos Registrados</h5>
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
                  <th class="px-3">Cliente</th>
                  <th>Prestamista</th>
                  <th>Monto</th>
                  <th>Interes</th>
                  <th>Total</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th class="text-end px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (loan of filteredLoans(); track loan.id) {
                  <tr>
                    <td class="px-3">{{ getPersonName(loan.personId) }}</td>
                    <td>{{ loan.lenderId ? getLenderName(loan.lenderId) : '-' }}</td>
                    <td>{{ formatCurrency(loan.amount) }}</td>
                    <td>{{ loan.interest || 0 }}%</td>
                    <td>{{ formatCurrency(loan.totalToCollect) }}</td>
                    <td class="fw-bold" [class.text-success]="isLoanCompleted(loan)" [class.text-warning]="!isLoanCompleted(loan)">
                      {{ formatCurrency(getLoanBalance(loan)) }}
                    </td>
                    <td>
                      <span class="badge" [class]="isLoanCompleted(loan) ? 'bg-success' : isOverdue(loan) ? 'bg-danger' : 'bg-warning'">
                        {{ isLoanCompleted(loan) ? 'Completado' : isOverdue(loan) ? 'En Mora' : 'Activo' }}
                      </span>
                    </td>
                    <td class="text-end px-3">
                      @if (!isLoanCompleted(loan)) {
                        <button class="btn btn-sm btn-outline-success me-1" (click)="openPaymentModal(loan)">Pagar</button>
                      }
                      <button class="btn btn-sm btn-outline-info me-1" (click)="openHistoryModal(loan)">Historial</button>
                      <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(loan)">Eliminar</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="text-center text-muted py-4">No hay prestamos registrados</td>
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
      <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)" (click)="closePaymentModal($event)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Registrar Pago</h5>
              <button type="button" class="btn-close" (click)="closePaymentModal()"></button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="submitPayment()">
                <div class="mb-3">
                  <label class="form-label">Saldo Pendiente</label>
                  <p class="h4 text-warning">{{ formatCurrency(selectedLoanBalance()) }}</p>
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
                  <button type="submit" class="btn btn-success">Registrar Pago</button>
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
      <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)" (click)="closeHistoryModal($event)">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Historial de Pagos - {{ getPersonName(selectedLoan()?.personId || '') }}</h5>
              <button type="button" class="btn-close" (click)="closeHistoryModal()"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3 p-3 bg-light rounded">
                <div class="row">
                  <div class="col-4 text-center">
                    <small class="text-muted">Total</small>
                    <div class="fw-bold">{{ formatCurrency(selectedLoan()?.totalToCollect || 0) }}</div>
                  </div>
                  <div class="col-4 text-center">
                    <small class="text-muted">Pagado</small>
                    <div class="fw-bold text-success">{{ formatCurrency(getTotalPaid(selectedLoan()?.id || '')) }}</div>
                  </div>
                  <div class="col-4 text-center">
                    <small class="text-muted">Pendiente</small>
                    <div class="fw-bold text-warning">{{ formatCurrency(selectedLoanBalance()) }}</div>
                  </div>
                </div>
              </div>
              @for (payment of loanPayments(); track payment.id) {
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <span class="text-success fw-bold">+{{ formatCurrency(payment.amount) }}</span>
                    @if (payment.notes) {
                      <small class="text-muted ms-2">{{ payment.notes }}</small>
                    }
                  </div>
                  <small class="text-muted">{{ formatDate(payment.date) }}</small>
                </div>
              } @empty {
                <p class="text-muted text-center py-3">No hay pagos registrados</p>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal Confirmacion -->
    @if (showConfirmModal()) {
      <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar</h5>
              <button type="button" class="btn-close" (click)="closeConfirmModal()"></button>
            </div>
            <div class="modal-body">
              <p>Eliminar este prestamo y todos sus pagos?</p>
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
export class PrestamosComponent implements OnInit {
  formData = { 
    personId: '', 
    lenderId: '',
    amount: 0, 
    interest: 0,
    date: new Date().toISOString().split('T')[0], 
    paymentFrequency: 'monthly' as PaymentFrequency, 
    totalToCollect: 0, 
    notes: '' 
  };
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
    private lenderService: LenderService
  ) {}

  ngOnInit(): void {
    this.loanService.setPaymentService(this.paymentService);
  }

  private userId = computed(() => this.authService.getUserId());

  persons = computed(() => {
    const uid = this.userId();
    return uid ? this.personService.getPersonsSignal(uid)() : [];
  });

  lenders = computed(() => {
    const uid = this.userId();
    return uid ? this.lenderService.getLendersSignal(uid)() : [];
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
        return loans.filter((loan) => !this.isLoanCompleted(loan) && !this.isOverdue(loan));
      case 'overdue':
        return loans.filter((loan) => this.isOverdue(loan));
      case 'completed':
        return loans.filter((loan) => this.isLoanCompleted(loan));
      default:
        return loans;
    }
  });

  totalLoaned = computed(() => {
    return this.loans().reduce((sum, l) => sum + l.amount, 0);
  });

  activeLoansCount = computed(() => {
    return this.loans().filter((loan) => !this.isLoanCompleted(loan)).length;
  });

  completedLoansCount = computed(() => {
    return this.loans().filter((loan) => this.isLoanCompleted(loan)).length;
  });

  overdueCount = computed(() => {
    return this.loans().filter((loan) => this.isOverdue(loan)).length;
  });

  selectedLoanBalance = computed(() => {
    const loan = this.selectedLoan();
    if (!loan) return 0;
    return this.getLoanBalance(loan);
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

  getLenderName(lenderId: string): string {
    return this.lenderService.getById(lenderId)?.name || 'Desconocido';
  }

  isOverdue(loan: Loan): boolean {
    return loan.status === 'overdue';
  }

  isLoanCompleted(loan: Loan): boolean {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || loan.amount;
    return totalPaid >= total;
  }

  getLoanBalance(loan: Loan): number {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || loan.amount;
    return Math.max(0, total - totalPaid);
  }

  getTotalPaid(loanId: string): number {
    return this.paymentService.getTotalPaidForLoan(loanId);
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
        lenderId: this.formData.lenderId || null,
        amount: this.formData.amount,
        interest: this.formData.interest,
        date: this.formData.date,
        paymentFrequency: this.formData.paymentFrequency,
        totalToCollect: this.formData.totalToCollect,
        notes: this.formData.notes,
        userId,
        trackingNotes: [],
        status: 'active'
      });

      this.showToast('Prestamo creado', 'success');
      this.formData = { 
        personId: '', 
        lenderId: '',
        amount: 0, 
        interest: 0,
        date: new Date().toISOString().split('T')[0], 
        paymentFrequency: 'monthly', 
        totalToCollect: 0, 
        notes: '' 
      };
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  openPaymentModal(loan: Loan): void {
    this.selectedLoan.set(loan);
    this.paymentData = { amount: this.getLoanBalance(loan), date: new Date().toISOString().split('T')[0], notes: '' };
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
      this.showToast('Prestamo eliminado', 'success');
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
}

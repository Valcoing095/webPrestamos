import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService, LoanCalculator } from '../../core/services/loan.service';
import { PersonService } from '../../core/services/person.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Payment } from '../../core/models';

@Component({
  selector: 'app-mis-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Mis Pagos</h2>
          <p class="text-muted mb-0">Registro de pagos de prestamos propios</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <i class="bi bi-plus-lg me-1"></i> Registrar Pago
        </button>
      </div>

      <!-- Filter -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-2">
          <div class="row align-items-center">
            <div class="col-md-4">
              <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Buscar por cliente..."
                [(ngModel)]="searchTerm"
              >
            </div>
            <div class="col-md-3">
              <input 
                type="date" 
                class="form-control form-control-sm" 
                [(ngModel)]="filterDate"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Prestamo</th>
                <th>Monto Pagado</th>
                <th>Pendiente</th>
                <th>Metodo</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of filteredPayments(); track payment.id) {
                <tr>
                  <td>{{ formatDate(payment.date) }}</td>
                  <td>
                    <div class="fw-medium">{{ getPersonName(payment.loanId) }}</div>
                  </td>
                  <td>{{ formatCurrency(getLoanAmount(payment.loanId)) }}</td>
                  <td class="text-success fw-medium">{{ formatCurrency(payment.amount) }}</td>
                  <td>{{ formatCurrency(getPendingForLoan(payment.loanId)) }}</td>
                  <td>
                    <span class="badge bg-secondary">Efectivo</span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(payment)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-4 text-muted">
                    No hay pagos registrados
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Registrar Pago</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Prestamo *</label>
                <select class="form-select" [(ngModel)]="form.loanId" (change)="onLoanChange()">
                  <option value="">Seleccionar prestamo</option>
                  @for (loan of activeLoans(); track loan.id) {
                    <option [value]="loan.id">
                      {{ getPersonNameByLoanId(loan.id) }} - {{ formatCurrency(loan.totalToCollect) }}
                      (Pendiente: {{ formatCurrency(getPendingForLoan(loan.id)) }})
                    </option>
                  }
                </select>
              </div>
              @if (form.loanId) {
                <div class="alert alert-info py-2">
                  <small>
                    <strong>Pendiente:</strong> {{ formatCurrency(getPendingForLoan(form.loanId)) }}
                  </small>
                </div>
              }
              <div class="mb-3">
                <label class="form-label">Monto *</label>
                <input type="number" class="form-control" [(ngModel)]="form.amount" min="0" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Fecha *</label>
                <input type="date" class="form-control" [(ngModel)]="form.date" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Metodo de Pago</label>
                <select class="form-select" [(ngModel)]="form.paymentMethod">
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Notas</label>
                <textarea class="form-control" [(ngModel)]="form.notes" rows="2"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="button" class="btn btn-primary" (click)="savePayment()">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation -->
    @if (showDeleteConfirm()) {
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Eliminacion</h5>
              <button type="button" class="btn-close" (click)="showDeleteConfirm.set(false)"></button>
            </div>
            <div class="modal-body">
              <p>Esta seguro de eliminar este pago?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDeleteConfirm.set(false)">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="deletePayment()">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .table th { font-weight: 600; font-size: 0.85rem; }
  `]
})
export class MisPagosComponent {
  private loanService = inject(LoanService);
  private personService = inject(PersonService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  showModal = signal(false);
  showDeleteConfirm = signal(false);
  paymentToDelete = signal<Payment | null>(null);
  searchTerm = '';
  filterDate = '';

  form = {
    loanId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: ''
  };

  activeLoans = computed(() => {
    const userId = this.authService.getUserId();
    if (!userId) return [];
    return this.loanService.getActiveOwnLoans(userId);
  });

  payments = computed(() => {
    const userId = this.authService.getUserId();
    if (!userId) return [];
    const ownLoans = this.loanService.getOwnLoans(userId);
    const loanIds = new Set(ownLoans.map(l => l.id));
    return this.paymentService.getAll().filter(p => loanIds.has(p.loanId));
  });

  filteredPayments = computed(() => {
    let result = this.payments();
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(payment => {
        const personName = this.getPersonName(payment.loanId);
        return personName.toLowerCase().includes(term);
      });
    }

    if (this.filterDate) {
      result = result.filter(payment => payment.date === this.filterDate);
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  getPersonName(loanId: string): string {
    const loan = this.loanService.getById(loanId);
    if (!loan) return 'Desconocido';
    return this.personService.getById(loan.personId)?.name || 'Desconocido';
  }

  getPersonNameByLoanId(loanId: string): string {
    return this.getPersonName(loanId);
  }

  getLoanAmount(loanId: string): number {
    return this.loanService.getById(loanId)?.totalToCollect || 0;
  }

  getPendingForLoan(loanId: string): number {
    const loan = this.loanService.getById(loanId);
    if (!loan) return 0;
    const paid = this.paymentService.getTotalPaidForLoan(loanId);
    return Math.max(0, (loan.totalToCollect || loan.amount) - paid);
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }

  openModal() {
    this.resetForm();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.resetForm();
  }

  resetForm() {
    this.form = {
      loanId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: ''
    };
  }

  onLoanChange() {
    // Sugerir el monto pendiente
    if (this.form.loanId) {
      this.form.amount = this.getPendingForLoan(this.form.loanId);
    }
  }

  savePayment() {
    if (!this.form.loanId || this.form.amount <= 0) {
      alert('Complete los campos requeridos');
      return;
    }

    try {
      this.paymentService.create({
        loanId: this.form.loanId,
        amount: this.form.amount,
        date: this.form.date,
        notes: this.form.notes
      });
      this.closeModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar');
    }
  }

  confirmDelete(payment: Payment) {
    this.paymentToDelete.set(payment);
    this.showDeleteConfirm.set(true);
  }

  deletePayment() {
    const payment = this.paymentToDelete();
    if (payment) {
      this.paymentService.delete(payment.id);
    }
    this.showDeleteConfirm.set(false);
    this.paymentToDelete.set(null);
  }
}

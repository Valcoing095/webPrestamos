import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService, LoanCalculator } from '../../core/services/loan.service';
import { PersonService } from '../../core/services/person.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Loan, Person, PaymentFrequency } from '../../core/models';

@Component({
  selector: 'app-mis-prestamos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Mis Prestamos</h2>
          <p class="text-muted mb-0">Gestion de prestamos propios</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <i class="bi bi-plus-lg me-1"></i> Nuevo Prestamo
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-3">
                  <i class="bi bi-cash-stack text-primary fs-4"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0 small">Total Prestado</p>
                  <h4 class="mb-0">{{ formatCurrency(stats().totalLoaned) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 bg-success bg-opacity-10 rounded-3 p-3">
                  <i class="bi bi-check-circle text-success fs-4"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0 small">Total Cobrado</p>
                  <h4 class="mb-0">{{ formatCurrency(stats().totalCollected) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 bg-warning bg-opacity-10 rounded-3 p-3">
                  <i class="bi bi-clock-history text-warning fs-4"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0 small">Pendiente</p>
                  <h4 class="mb-0">{{ formatCurrency(stats().totalPending) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 bg-info bg-opacity-10 rounded-3 p-3">
                  <i class="bi bi-file-earmark-text text-info fs-4"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0 small">Prestamos Activos</p>
                  <h4 class="mb-0">{{ stats().activeCount }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
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
              <select class="form-select form-select-sm" [(ngModel)]="filterStatus">
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="completed">Completados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Loans Table -->
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Total a Cobrar</th>
                <th>Pagado</th>
                <th>Pendiente</th>
                <th>Frecuencia</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (loan of filteredLoans(); track loan.id) {
                <tr>
                  <td>
                    <div class="fw-medium">{{ getPersonName(loan.personId) }}</div>
                  </td>
                  <td>{{ formatCurrency(loan.amount) }}</td>
                  <td>{{ formatCurrency(loan.totalToCollect) }}</td>
                  <td class="text-success">{{ formatCurrency(getTotalPaid(loan.id)) }}</td>
                  <td class="text-warning">{{ formatCurrency(getPending(loan)) }}</td>
                  <td>
                    <span class="badge bg-secondary">{{ getFrequencyLabel(loan.paymentFrequency) }}</span>
                  </td>
                  <td>{{ formatDate(loan.date) }}</td>
                  <td>
                    @if (isCompleted(loan)) {
                      <span class="badge bg-success">Completado</span>
                    } @else {
                      <span class="badge bg-primary">Activo</span>
                    }
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" (click)="editLoan(loan)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(loan)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="text-center py-4 text-muted">
                    No hay prestamos registrados
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
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingLoan() ? 'Editar' : 'Nuevo' }} Prestamo</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Cliente *</label>
                  <select class="form-select" [(ngModel)]="form.personId" required>
                    <option value="">Seleccionar cliente</option>
                    @for (person of persons(); track person.id) {
                      <option [value]="person.id">{{ person.name }}</option>
                    }
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Fecha *</label>
                  <input type="date" class="form-control" [(ngModel)]="form.date" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Monto Prestado *</label>
                  <input type="number" class="form-control" [(ngModel)]="form.amount" min="0" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Interes (%)</label>
                  <input type="number" class="form-control" [(ngModel)]="form.interest" min="0">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Total a Cobrar *</label>
                  <input type="number" class="form-control" [(ngModel)]="form.totalToCollect" min="0" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Frecuencia de Pago</label>
                  <select class="form-select" [(ngModel)]="form.paymentFrequency">
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label">Notas</label>
                  <textarea class="form-control" [(ngModel)]="form.notes" rows="2"></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="button" class="btn btn-primary" (click)="saveLoan()">
                {{ editingLoan() ? 'Actualizar' : 'Guardar' }}
              </button>
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
              <p>Esta seguro de eliminar este prestamo? Esta accion no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDeleteConfirm.set(false)">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="deleteLoan()">Eliminar</button>
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
export class MisPrestamosComponent implements OnInit {
  private loanService = inject(LoanService);
  private personService = inject(PersonService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  showModal = signal(false);
  showDeleteConfirm = signal(false);
  editingLoan = signal<Loan | null>(null);
  loanToDelete = signal<Loan | null>(null);
  searchTerm = '';
  filterStatus = 'all';

  form = {
    personId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    interest: 0,
    totalToCollect: 0,
    paymentFrequency: 'monthly' as PaymentFrequency,
    notes: ''
  };

  loans = computed(() => {
    const userId = this.authService.getUserId();
    if (!userId) return [];
    return this.loanService.getOwnLoans(userId);
  });

  persons = computed(() => {
    const userId = this.authService.getUserId();
    if (!userId) return [];
    return this.personService.getByUserId(userId);
  });

  filteredLoans = computed(() => {
    let result = this.loans();
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(loan => {
        const person = this.personService.getById(loan.personId);
        return person?.name.toLowerCase().includes(term);
      });
    }

    if (this.filterStatus !== 'all') {
      result = result.filter(loan => {
        const isCompleted = this.isCompleted(loan);
        return this.filterStatus === 'completed' ? isCompleted : !isCompleted;
      });
    }

    return result;
  });

  stats = computed(() => {
    const loans = this.loans();
    const payments = loans.flatMap(loan => 
      this.paymentService.getByLoanId(loan.id).map(p => ({ loanId: loan.id, amount: p.amount }))
    );
    return LoanCalculator.getSummary(loans, payments);
  });

  ngOnInit() {
    this.loanService.setPaymentService(this.paymentService);
  }

  getPersonName(personId: string): string {
    return this.personService.getById(personId)?.name || 'Desconocido';
  }

  getTotalPaid(loanId: string): number {
    return this.paymentService.getTotalPaidForLoan(loanId);
  }

  getPending(loan: Loan): number {
    const paid = this.getTotalPaid(loan.id);
    return Math.max(0, (loan.totalToCollect || loan.amount) - paid);
  }

  isCompleted(loan: Loan): boolean {
    return this.getPending(loan) <= 0;
  }

  getFrequencyLabel(frequency: PaymentFrequency): string {
    return LoanCalculator.getFrequencyLabel(frequency);
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }

  openModal() {
    this.editingLoan.set(null);
    this.resetForm();
    this.showModal.set(true);
  }

  editLoan(loan: Loan) {
    this.editingLoan.set(loan);
    this.form = {
      personId: loan.personId,
      date: loan.date,
      amount: loan.amount,
      interest: loan.interest,
      totalToCollect: loan.totalToCollect,
      paymentFrequency: loan.paymentFrequency,
      notes: loan.notes
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingLoan.set(null);
    this.resetForm();
  }

  resetForm() {
    this.form = {
      personId: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      interest: 0,
      totalToCollect: 0,
      paymentFrequency: 'monthly',
      notes: ''
    };
  }

  saveLoan() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    try {
      if (this.editingLoan()) {
        this.loanService.updateLoan(this.editingLoan()!.id, {
          ...this.form,
          loanType: 'own'
        });
      } else {
        this.loanService.create({
          ...this.form,
          userId,
          loanType: 'own',
          lenderId: null,
          routeId: null
        });
      }
      this.closeModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar');
    }
  }

  confirmDelete(loan: Loan) {
    this.loanToDelete.set(loan);
    this.showDeleteConfirm.set(true);
  }

  deleteLoan() {
    const loan = this.loanToDelete();
    if (loan) {
      this.loanService.deleteCascade(loan.id);
    }
    this.showDeleteConfirm.set(false);
    this.loanToDelete.set(null);
  }
}

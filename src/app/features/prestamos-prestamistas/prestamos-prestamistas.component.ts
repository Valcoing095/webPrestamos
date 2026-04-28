import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService, LoanCalculator } from '../../core/services/loan.service';
import { PersonService } from '../../core/services/person.service';
import { PaymentService } from '../../core/services/payment.service';
import { LenderService } from '../../core/services/lender.service';
import { RouteService } from '../../core/services/route.service';
import { AuthService } from '../../core/services/auth.service';
import { Loan, Person, PaymentFrequency, Lender, Route } from '../../core/models';

@Component({
  selector: 'app-prestamos-prestamistas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Prestamos por Ruta</h2>
          <p class="text-muted mb-0">Gestion de prestamos asignados a prestamistas</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <i class="bi bi-plus-lg me-1"></i> Nuevo Prestamo
        </button>
      </div>

      <!-- Filter by Lender/Route -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-2">
          <div class="row align-items-center">
            <div class="col-md-4">
              <select class="form-select form-select-sm" [(ngModel)]="selectedLenderId" (change)="onLenderChange()">
                <option value="">Todos los prestamistas</option>
                @for (lender of lenders(); track lender.id) {
                  <option [value]="lender.id">{{ lender.name }}</option>
                }
              </select>
            </div>
            <div class="col-md-4">
              <select class="form-select form-select-sm" [(ngModel)]="selectedRouteId">
                <option value="">Todas las rutas</option>
                @for (route of filteredRoutes(); track route.id) {
                  <option [value]="route.id">{{ route.name }}</option>
                }
              </select>
            </div>
            <div class="col-md-4">
              <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Buscar cliente..."
                [(ngModel)]="searchTerm"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Stats by Lender -->
      @if (selectedLenderId) {
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm bg-primary text-white">
              <div class="card-body">
                <h6 class="mb-1">Total Prestado</h6>
                <h4 class="mb-0">{{ formatCurrency(lenderStats().totalLoaned) }}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm bg-success text-white">
              <div class="card-body">
                <h6 class="mb-1">Cobrado</h6>
                <h4 class="mb-0">{{ formatCurrency(lenderStats().totalCollected) }}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm bg-warning text-dark">
              <div class="card-body">
                <h6 class="mb-1">Pendiente</h6>
                <h4 class="mb-0">{{ formatCurrency(lenderStats().totalPending) }}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm bg-info text-white">
              <div class="card-body">
                <h6 class="mb-1">Prestamos Activos</h6>
                <h4 class="mb-0">{{ lenderStats().activeCount }}</h4>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Loans Table -->
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Prestamista</th>
                <th>Ruta</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Pendiente</th>
                <th>Fecha</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (loan of filteredLoans(); track loan.id) {
                <tr>
                  <td>
                    <span class="badge bg-dark">{{ getLenderName(loan.lenderId) }}</span>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{ getRouteName(loan.routeId) }}</span>
                  </td>
                  <td>
                    <div class="fw-medium">{{ getPersonName(loan.personId) }}</div>
                  </td>
                  <td>{{ formatCurrency(loan.amount) }}</td>
                  <td>{{ formatCurrency(loan.totalToCollect) }}</td>
                  <td class="text-success">{{ formatCurrency(getTotalPaid(loan.id)) }}</td>
                  <td class="text-warning">{{ formatCurrency(getPending(loan)) }}</td>
                  <td>{{ formatDate(loan.date) }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-success me-1" (click)="registerPayment(loan)" title="Registrar pago">
                      <i class="bi bi-cash"></i>
                    </button>
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

    <!-- Loan Modal -->
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
                  <label class="form-label">Prestamista *</label>
                  <select class="form-select" [(ngModel)]="form.lenderId" (change)="onFormLenderChange()" required>
                    <option value="">Seleccionar prestamista</option>
                    @for (lender of lenders(); track lender.id) {
                      <option [value]="lender.id">{{ lender.name }}</option>
                    }
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ruta</label>
                  <select class="form-select" [(ngModel)]="form.routeId">
                    <option value="">Sin ruta</option>
                    @for (route of routesForLender(); track route.id) {
                      <option [value]="route.id">{{ route.name }}</option>
                    }
                  </select>
                </div>
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

    <!-- Payment Modal -->
    @if (showPaymentModal()) {
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Registrar Pago</h5>
              <button type="button" class="btn-close" (click)="showPaymentModal.set(false)"></button>
            </div>
            <div class="modal-body">
              @if (paymentLoan()) {
                <div class="alert alert-info py-2 mb-3">
                  <small>
                    <strong>Cliente:</strong> {{ getPersonName(paymentLoan()!.personId) }}<br>
                    <strong>Pendiente:</strong> {{ formatCurrency(getPending(paymentLoan()!)) }}
                  </small>
                </div>
              }
              <div class="mb-3">
                <label class="form-label">Monto *</label>
                <input type="number" class="form-control" [(ngModel)]="paymentForm.amount" min="0" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Fecha *</label>
                <input type="date" class="form-control" [(ngModel)]="paymentForm.date" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Notas</label>
                <textarea class="form-control" [(ngModel)]="paymentForm.notes" rows="2"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showPaymentModal.set(false)">Cancelar</button>
              <button type="button" class="btn btn-success" (click)="savePayment()">Registrar Pago</button>
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
              <p>Esta seguro de eliminar este prestamo?</p>
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
export class PrestamosPrestamistasComponent implements OnInit {
  private loanService = inject(LoanService);
  private personService = inject(PersonService);
  private paymentService = inject(PaymentService);
  private lenderService = inject(LenderService);
  private routeService = inject(RouteService);
  private authService = inject(AuthService);

  showModal = signal(false);
  showPaymentModal = signal(false);
  showDeleteConfirm = signal(false);
  editingLoan = signal<Loan | null>(null);
  loanToDelete = signal<Loan | null>(null);
  paymentLoan = signal<Loan | null>(null);
  
  selectedLenderId = '';
  selectedRouteId = '';
  searchTerm = '';

  form = {
    lenderId: '',
    routeId: '',
    personId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    interest: 0,
    totalToCollect: 0,
    paymentFrequency: 'monthly' as PaymentFrequency,
    notes: ''
  };

  paymentForm = {
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };

  lenders = computed(() => {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];
    return this.lenderService.getByUserId(userId);
  });

  routes = computed(() => {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];
    return this.routeService.getByUserId(userId);
  });

  filteredRoutes = computed(() => {
    if (!this.selectedLenderId) return this.routes();
    const lender = this.lenderService.getById(this.selectedLenderId);
    if (lender?.routeId) {
      return this.routes().filter(r => r.id === lender.routeId);
    }
    return this.routes();
  });

  routesForLender = computed(() => {
    if (!this.form.lenderId) return this.routes();
    const lender = this.lenderService.getById(this.form.lenderId);
    if (lender?.routeId) {
      return this.routes().filter(r => r.id === lender.routeId);
    }
    return this.routes();
  });

  persons = computed(() => {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];
    return this.personService.getByUserId(userId);
  });

  loans = computed(() => {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];
    return this.loanService.getLenderLoans(userId);
  });

  filteredLoans = computed(() => {
    let result = this.loans();

    if (this.selectedLenderId) {
      result = result.filter(l => l.lenderId === this.selectedLenderId);
    }

    if (this.selectedRouteId) {
      result = result.filter(l => l.routeId === this.selectedRouteId);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(loan => {
        const person = this.personService.getById(loan.personId);
        return person?.name.toLowerCase().includes(term);
      });
    }

    return result;
  });

  lenderStats = computed(() => {
    if (!this.selectedLenderId) {
      return { totalLoaned: 0, totalCollected: 0, totalPending: 0, activeCount: 0 };
    }
    const loans = this.loans().filter(l => l.lenderId === this.selectedLenderId);
    const payments = loans.flatMap(loan => 
      this.paymentService.getByLoanId(loan.id).map(p => ({ loanId: loan.id, amount: p.amount }))
    );
    return LoanCalculator.getSummary(loans, payments);
  });

  ngOnInit() {
    this.loanService.setPaymentService(this.paymentService);
  }

  getLenderName(lenderId: string | null): string {
    if (!lenderId) return 'Sin asignar';
    return this.lenderService.getById(lenderId)?.name || 'Desconocido';
  }

  getRouteName(routeId: string | null): string {
    if (!routeId) return 'Sin ruta';
    return this.routeService.getById(routeId)?.name || 'Desconocida';
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

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }

  onLenderChange() {
    this.selectedRouteId = '';
  }

  onFormLenderChange() {
    const lender = this.lenderService.getById(this.form.lenderId);
    if (lender?.routeId) {
      this.form.routeId = lender.routeId;
    } else {
      this.form.routeId = '';
    }
  }

  openModal() {
    this.editingLoan.set(null);
    this.resetForm();
    this.showModal.set(true);
  }

  editLoan(loan: Loan) {
    this.editingLoan.set(loan);
    this.form = {
      lenderId: loan.lenderId || '',
      routeId: loan.routeId || '',
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
      lenderId: this.selectedLenderId || '',
      routeId: '',
      personId: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      interest: 0,
      totalToCollect: 0,
      paymentFrequency: 'monthly',
      notes: ''
    };
    this.onFormLenderChange();
  }

  saveLoan() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    if (!this.form.lenderId) {
      alert('Debe seleccionar un prestamista');
      return;
    }

    try {
      if (this.editingLoan()) {
        this.loanService.updateLoan(this.editingLoan()!.id, {
          ...this.form,
          loanType: 'lender'
        });
      } else {
        this.loanService.create({
          ...this.form,
          userId,
          loanType: 'lender'
        });
      }
      this.closeModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar');
    }
  }

  registerPayment(loan: Loan) {
    this.paymentLoan.set(loan);
    this.paymentForm = {
      amount: this.getPending(loan),
      date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    this.showPaymentModal.set(true);
  }

  savePayment() {
    const loan = this.paymentLoan();
    if (!loan || this.paymentForm.amount <= 0) {
      alert('Ingrese un monto valido');
      return;
    }

    try {
      this.paymentService.create({
        loanId: loan.id,
        amount: this.paymentForm.amount,
        date: this.paymentForm.date,
        notes: this.paymentForm.notes
      });
      this.showPaymentModal.set(false);
      this.paymentLoan.set(null);
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

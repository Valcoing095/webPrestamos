import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LenderService, RouteService, LoanService, LoanCalculator } from '../../../core/services';
import { Lender } from '../../../core/models';

@Component({
  selector: 'app-prestamistas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Gestion de Prestamistas</h1>
        <p class="text-muted mb-0">Administra tus prestamistas y su capital</p>
      </header>
      
      <!-- Resumen Financiero -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-primary text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Capital Total Disponible</h6>
              <h3 class="card-title mb-0">{{ formatCurrency(totalCapital()) }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-success text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Prestamistas Activos</h6>
              <h3 class="card-title mb-0">{{ lenders().length }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-info text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Total Prestado</h6>
              <h3 class="card-title mb-0">{{ formatCurrency(totalLoaned()) }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-transparent">
          <h5 class="card-title mb-0">{{ editingId() ? 'Editar Prestamista' : 'Agregar Nuevo Prestamista' }}</h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="onSubmit()">
            <div class="row g-3">
              <div class="col-md-3">
                <label for="lender-name" class="form-label">Nombre *</label>
                <input type="text" id="lender-name" [(ngModel)]="formData.name" name="name" class="form-control" placeholder="Nombre completo" required />
              </div>
              <div class="col-md-3">
                <label for="lender-phone" class="form-label">Telefono</label>
                <input type="tel" id="lender-phone" [(ngModel)]="formData.phone" name="phone" class="form-control" placeholder="Opcional" />
              </div>
              <div class="col-md-3">
                <label for="lender-email" class="form-label">Email</label>
                <input type="email" id="lender-email" [(ngModel)]="formData.email" name="email" class="form-control" placeholder="Opcional" />
              </div>
              <div class="col-md-3">
                <label for="lender-capital" class="form-label">Capital Disponible *</label>
                <input type="number" id="lender-capital" [(ngModel)]="formData.availableCapital" name="availableCapital" class="form-control" min="0" step="0.01" required />
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label for="lender-routes" class="form-label">Rutas Asignadas</label>
                <select id="lender-routes" [(ngModel)]="formData.selectedRouteIds" name="routeIds" class="form-select" multiple>
                  @for (route of routes(); track route.id) {
                    <option [value]="route.id">{{ route.name }}</option>
                  }
                </select>
                <small class="text-muted">Mantener Ctrl para seleccionar multiples</small>
              </div>
              <div class="col-md-6">
                <label for="lender-notes" class="form-label">Notas</label>
                <textarea id="lender-notes" [(ngModel)]="formData.notes" name="notes" class="form-control" rows="2" placeholder="Notas adicionales..."></textarea>
              </div>
            </div>
            <div class="mt-3 d-flex gap-2">
              <button type="submit" class="btn btn-primary">
                {{ editingId() ? 'Actualizar' : 'Agregar' }} Prestamista
              </button>
              @if (editingId()) {
                <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancelar</button>
              }
            </div>
          </form>
        </div>
      </div>

      <!-- Lista de Prestamistas -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Prestamistas Registrados</h5>
          <span class="badge bg-primary">{{ lenders().length }}</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="px-3">Nombre</th>
                  <th>Contacto</th>
                  <th>Capital Disponible</th>
                  <th>Prestamos Activos</th>
                  <th>Rutas</th>
                  <th class="text-end px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (lender of lenders(); track lender.id) {
                  <tr>
                    <td class="px-3">
                      <div class="fw-medium">{{ lender.name }}</div>
                    </td>
                    <td>
                      <div class="small">
                        @if (lender.phone) {
                          <div class="text-muted">{{ lender.phone }}</div>
                        }
                        @if (lender.email) {
                          <div class="text-muted">{{ lender.email }}</div>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="text-success fw-bold">{{ formatCurrency(lender.availableCapital) }}</span>
                    </td>
                    <td>
                      <span class="badge bg-info">{{ getLenderLoansCount(lender.id) }}</span>
                    </td>
                    <td>
                      @for (routeId of lender.routeIds; track routeId) {
                        <span class="badge bg-secondary me-1">{{ getRouteName(routeId) }}</span>
                      } @empty {
                        <span class="text-muted small">Sin rutas</span>
                      }
                    </td>
                    <td class="text-end px-3">
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="editLender(lender)">Editar</button>
                      <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(lender)">Eliminar</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center text-muted py-4">No hay prestamistas registrados</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Confirmacion -->
    @if (showConfirmModal()) {
      <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Eliminacion</h5>
              <button type="button" class="btn-close" (click)="closeConfirmModal()"></button>
            </div>
            <div class="modal-body">
              <p>Esta seguro de eliminar al prestamista <strong>{{ lenderToDelete()?.name }}</strong>?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeConfirmModal()">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="deleteLender()">Eliminar</button>
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
    :host { display: block; }
  `],
})
export class PrestamistasComponent implements OnInit {
  formData = {
    name: '',
    phone: '',
    email: '',
    availableCapital: 0,
    notes: '',
    selectedRouteIds: [] as string[]
  };

  editingId = signal<string | null>(null);
  showConfirmModal = signal(false);
  lenderToDelete = signal<Lender | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  constructor(
    public authService: AuthService,
    private lenderService: LenderService,
    private routeService: RouteService,
    private loanService: LoanService
  ) {}

  ngOnInit(): void {}

  private userId = computed(() => this.authService.getUserId());

  lenders = computed(() => {
    const uid = this.userId();
    return uid ? this.lenderService.getLendersSignal(uid)() : [];
  });

  routes = computed(() => {
    const uid = this.userId();
    return uid ? this.routeService.getRoutesSignal(uid)() : [];
  });

  totalCapital = computed(() => {
    return this.lenders().reduce((sum, l) => sum + l.availableCapital, 0);
  });

  totalLoaned = computed(() => {
    const uid = this.userId();
    if (!uid) return 0;
    const loans = this.loanService.getByUserId(uid);
    return loans.reduce((sum, l) => sum + l.amount, 0);
  });

  getLenderLoansCount(lenderId: string): number {
    return this.loanService.getByLenderId(lenderId).length;
  }

  getRouteName(routeId: string): string {
    return this.routeService.getById(routeId)?.name || 'Desconocida';
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  onSubmit(): void {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;

      const data = {
        name: this.formData.name,
        phone: this.formData.phone,
        email: this.formData.email,
        availableCapital: this.formData.availableCapital,
        notes: this.formData.notes,
        routeIds: this.formData.selectedRouteIds,
        userId
      };

      if (this.editingId()) {
        this.lenderService.updateLender(this.editingId()!, data);
        this.showToast('Prestamista actualizado', 'success');
      } else {
        this.lenderService.create(data);
        this.showToast('Prestamista agregado', 'success');
      }

      this.resetForm();
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  editLender(lender: Lender): void {
    this.editingId.set(lender.id);
    this.formData = {
      name: lender.name,
      phone: lender.phone,
      email: lender.email,
      availableCapital: lender.availableCapital,
      notes: lender.notes,
      selectedRouteIds: [...lender.routeIds]
    };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  confirmDelete(lender: Lender): void {
    this.lenderToDelete.set(lender);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.lenderToDelete.set(null);
  }

  deleteLender(): void {
    const lender = this.lenderToDelete();
    if (lender) {
      const userId = this.authService.getUserId();
      if (userId) {
        this.lenderService.deleteWithUserId(lender.id, userId);
        this.showToast('Prestamista eliminado', 'success');
      }
    }
    this.closeConfirmModal();
  }

  resetForm(): void {
    this.editingId.set(null);
    this.formData = {
      name: '',
      phone: '',
      email: '',
      availableCapital: 0,
      notes: '',
      selectedRouteIds: []
    };
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    setTimeout(() => this.clearToast(), 3000);
  }

  clearToast(): void {
    this.toast.set(null);
  }
}

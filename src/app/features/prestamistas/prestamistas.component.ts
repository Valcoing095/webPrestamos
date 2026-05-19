import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LenderService, RouteService } from '../../core/services';
import { AuthService } from '../../core/services/auth.service';
import { Lender, Route } from '../../core/models';

@Component({
  selector: 'app-prestamistas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid p-4">
      <div class="row mb-4">
        <div class="col-md-6">
          <h1 class="h3">Gestión de Prestamistas</h1>
          <p class="text-muted">Administra los prestamistas, sus rutas y asignaciones</p>
        </div>
        <div class="col-md-6 text-end">
          <button class="btn btn-primary" (click)="openCreateModal()">
            <i class="bi bi-plus-circle"></i> Nuevo Prestamista
          </button>
        </div>
      </div>

      <!-- Resumen -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-primary text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Total Prestamistas</h6>
              <h3 class="mb-0">{{ lenders().length }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-success text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Capital Total</h6>
              <h3 class="mb-0">{{ formatCurrency(totalCapital()) }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-info text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Rutas Asignadas</h6>
              <h3 class="mb-0">{{ assignedRoutesCount() }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-warning text-white">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 opacity-75">Prestamistas Activos</h6>
              <h3 class="mb-0">{{ activeLendersCount() }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Prestamistas -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-light">
          <div class="row align-items-center">
            <div class="col-md-8">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Buscar por nombre, teléfono o email..."
                (input)="searchTerm.set($event.target.value)"
              />
            </div>
            <div class="col-md-4 text-end">
              <small class="text-muted">Mostrando {{ filteredLenders().length }} de {{ lenders().length }}</small>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Capital</th>
                <th>Ruta Asignada</th>
                <th>Comisión</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lender of filteredLenders()">
                <td><strong>{{ lender.name }}</strong></td>
                <td>{{ lender.phone || '-' }}</td>
                <td>{{ lender.email || '-' }}</td>
                <td class="text-end">{{ formatCurrency(lender.availableCapital) }}</td>
                <td>
                  <span *ngIf="getRouteName(lender.routeId)" class="badge bg-info">
                    {{ getRouteName(lender.routeId) }}
                  </span>
                  <span *ngIf="!lender.routeId" class="text-muted">-</span>
                </td>
                <td class="text-center">{{ lender.commissionPercentage }}%</td>
                <td>
                  <span *ngIf="lender.isActive" class="badge bg-success">Activo</span>
                  <span *ngIf="!lender.isActive" class="badge bg-secondary">Inactivo</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="openEditModal(lender)">Editar</button>
                  <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(lender)">Eliminar</button>
                </td>
              </tr>
              <tr *ngIf="filteredLenders().length === 0">
                <td colspan="8" class="text-center text-muted py-4">No hay prestamistas registrados</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Crear/Editar -->
      <div class="modal" [class.show]="showModal()" [style.display]="showModal() ? 'block' : 'none'">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingLender() ? 'Editar Prestamista' : 'Nuevo Prestamista' }}</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="form" *ngIf="form">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="name" class="form-label">Nombre *</label>
                      <input 
                        type="text" 
                        id="name" 
                        class="form-control" 
                        formControlName="name"
                        placeholder="Nombre del prestamista"
                      />
                      <small class="text-danger" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">
                        El nombre es requerido
                      </small>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="phone" class="form-label">Teléfono</label>
                      <input 
                        type="tel" 
                        id="phone" 
                        class="form-control" 
                        formControlName="phone"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="email" class="form-label">Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        class="form-control" 
                        formControlName="email"
                        placeholder="correo@example.com"
                      />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="availableCapital" class="form-label">Capital Disponible *</label>
                      <input 
                        type="number" 
                        id="availableCapital" 
                        class="form-control" 
                        formControlName="availableCapital"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="routeId" class="form-label">Ruta Asignada</label>
                      <select 
                        id="routeId" 
                        class="form-select" 
                        formControlName="routeId"
                      >
                        <option [value]="null">Sin ruta asignada</option>
                        <option *ngFor="let route of availableRoutes()" [value]="route.id">
                          {{ route.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="commissionPercentage" class="form-label">Comisión (%) *</label>
                      <input 
                        type="number" 
                        id="commissionPercentage" 
                        class="form-control" 
                        formControlName="commissionPercentage"
                        min="0"
                        max="100"
                        placeholder="10"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="notes" class="form-label">Notas</label>
                  <textarea 
                    id="notes" 
                    class="form-control" 
                    formControlName="notes"
                    rows="3"
                    placeholder="Notas adicionales..."
                  ></textarea>
                </div>

                <div class="form-check">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    class="form-check-input" 
                    formControlName="isActive"
                  />
                  <label class="form-check-label" for="isActive">
                    Prestamista Activo
                  </label>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button 
                type="button" 
                class="btn btn-primary" 
                (click)="saveLender()"
                [disabled]="!form || form.invalid"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade" [class.show]="showModal()" *ngIf="showModal()"></div>

      <!-- Modal de Confirmación de Eliminación -->
      <div class="modal" [class.show]="showDeleteModal()" [style.display]="showDeleteModal() ? 'block' : 'none'">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Eliminación</h5>
              <button type="button" class="btn-close" (click)="closeDeleteModal()"></button>
            </div>
            <div class="modal-body">
              <p *ngIf="lenderToDelete()">
                ¿Estás seguro de que deseas eliminar al prestamista <strong>{{ lenderToDelete()?.name }}</strong>?
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeDeleteModal()">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="deleteLender()">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade" [class.show]="showDeleteModal()" *ngIf="showDeleteModal()"></div>

      <!-- Toast de Notificación -->
      <div 
        *ngIf="toast()" 
        class="position-fixed bottom-0 end-0 m-3" 
        [class.bg-success]="toast()?.type === 'success'"
        [class.bg-danger]="toast()?.type === 'error'"
        class="text-white rounded-2 px-4 py-3"
      >
        {{ toast()?.message }}
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background-color: #f5f5f5;
      min-height: 100vh;
    }
    .modal.show {
      z-index: 1050;
    }
    .modal-backdrop.show {
      z-index: 1040;
    }
    .bg-success {
      background-color: #198754 !important;
    }
    .bg-danger {
      background-color: #dc3545 !important;
    }
  `]
})
export class PrestamistasComponent implements OnInit {
  private lenderService = new LenderService();
  private routeService = new RouteService();
  private authService = new AuthService();
  private formBuilder = new FormBuilder();

  lenders = signal<Lender[]>([]);
  routes = signal<Route[]>([]);
  searchTerm = signal('');
  showModal = signal(false);
  showDeleteModal = signal(false);
  editingLender = signal<Lender | null>(null);
  lenderToDelete = signal<Lender | null>(null);
  form: FormGroup | null = null;
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  userId: string = '';

  filteredLenders = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.lenders().filter(l => 
      l.name.toLowerCase().includes(term) ||
      (l.phone && l.phone.toLowerCase().includes(term)) ||
      (l.email && l.email.toLowerCase().includes(term))
    );
  });

  availableRoutes = computed(() => {
    return this.routes().filter(r => r.userId === this.userId && r.isActive);
  });

  totalCapital = computed(() => {
    return this.lenders().reduce((sum, l) => sum + l.availableCapital, 0);
  });

  assignedRoutesCount = computed(() => {
    return this.lenders().filter(l => l.routeId).length;
  });

  activeLendersCount = computed(() => {
    return this.lenders().filter(l => l.isActive).length;
  });

  ngOnInit() {
    this.userId = this.authService.getCurrentUserId() || '';
    this.loadData();
  }

  loadData() {
    this.lenders.set(this.lenderService.getByUserId(this.userId));
    this.routes.set(this.routeService.getByUserId(this.userId));
  }

  getRouteName(routeId: string | null): string {
    if (!routeId) return '';
    const route = this.routes().find(r => r.id === routeId);
    return route ? route.name : '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  openCreateModal() {
    this.editingLender.set(null);
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      phone: [''],
      email: ['', Validators.email],
      availableCapital: [0, [Validators.required, Validators.min(0)]],
      routeId: [null],
      commissionPercentage: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      notes: [''],
      isActive: [true]
    });
    this.showModal.set(true);
  }

  openEditModal(lender: Lender) {
    this.editingLender.set(lender);
    this.form = this.formBuilder.group({
      name: [lender.name, Validators.required],
      phone: [lender.phone],
      email: [lender.email, Validators.email],
      availableCapital: [lender.availableCapital, [Validators.required, Validators.min(0)]],
      routeId: [lender.routeId],
      commissionPercentage: [lender.commissionPercentage, [Validators.required, Validators.min(0), Validators.max(100)]],
      notes: [lender.notes],
      isActive: [lender.isActive]
    });
    this.showModal.set(true);
  }

  saveLender() {
    if (!this.form || this.form.invalid) return;

    const formValue = this.form.value;
    
    try {
      if (this.editingLender()) {
        const lender = this.editingLender()!;
        lender.update(formValue);
        this.lenderService.update(lender);
        this.showToast('Prestamista actualizado correctamente', 'success');
      } else {
        const newLender = new Lender({
          ...formValue,
          userId: this.userId,
          createdAt: new Date().toISOString()
        });
        this.lenderService.create(newLender);
        this.showToast('Prestamista creado correctamente', 'success');
      }

      this.loadData();
      this.closeModal();
    } catch (error: any) {
      this.showToast(error.message || 'Error al guardar', 'error');
    }
  }

  confirmDelete(lender: Lender) {
    this.lenderToDelete.set(lender);
    this.showDeleteModal.set(true);
  }

  deleteLender() {
    const lender = this.lenderToDelete();
    if (lender) {
      try {
        this.lenderService.delete(lender.id);
        this.showToast('Prestamista eliminado correctamente', 'success');
        this.loadData();
      } catch (error: any) {
        this.showToast(error.message || 'Error al eliminar', 'error');
      }
    }
    this.closeDeleteModal();
  }

  closeModal() {
    this.showModal.set(false);
    this.editingLender.set(null);
    this.form = null;
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.lenderToDelete.set(null);
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}

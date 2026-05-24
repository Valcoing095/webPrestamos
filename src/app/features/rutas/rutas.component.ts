import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouteService, LenderService } from '../../core/services';
import { AuthService } from '../../core/services/auth.service';
import { Route, Lender } from '../../core/models';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid p-3 p-md-4">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 class="h4 h3-md mb-1">Gestión de Rutas</h1>
          <p class="text-muted mb-0 small">Administra tus rutas de cobro y asigna prestamistas</p>
        </div>
        <button class="btn btn-primary w-100 w-md-auto" (click)="openCreateModal()">
          <i class="bi bi-plus-circle"></i> Nueva Ruta
        </button>
      </div>

      <!-- Resumen -->
      <div class="row g-2 g-md-3 mb-4">
        <div class="col-6 col-md-4">
          <div class="card border-0 shadow-sm bg-primary text-white h-100">
            <div class="card-body p-3 p-md-4">
              <h6 class="card-subtitle mb-1 opacity-75 small">Total de Rutas</h6>
              <h3 class="mb-0 h4 h3-md">{{ routes().length }}</h3>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-4">
          <div class="card border-0 shadow-sm bg-success text-white h-100">
            <div class="card-body p-3 p-md-4">
              <h6 class="card-subtitle mb-1 opacity-75 small">Rutas Asignadas</h6>
              <h3 class="mb-0 h4 h3-md">{{ assignedRoutesCount() }}</h3>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-4">
          <div class="card border-0 shadow-sm bg-info text-white h-100">
            <div class="card-body p-3 p-md-4">
              <h6 class="card-subtitle mb-1 opacity-75 small">Rutas Disponibles</h6>
              <h3 class="mb-0 h4 h3-md">{{ availableRoutesCount() }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Rutas -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-light p-2 p-md-3">
          <div class="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2">
            <div class="flex-grow-1">
              <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Buscar ruta..."
                (input)="searchTerm.set($event.target.value)"
              />
            </div>
            <div class="text-md-end text-nowrap">
              <small class="text-muted">Mostrando {{ filteredRoutes().length }} de {{ routes().length }}</small>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0 table-sm align-middle">
            <thead class="table-light">
              <tr>
                <th>Nombre</th>
                <th class="d-none d-sm-table-cell">Zona</th>
                <th class="d-none d-md-table-cell">Descripción</th>
                <th>Prestamista</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let route of filteredRoutes()">
                <td><strong class="small">{{ route.name }}</strong></td>
                <td class="d-none d-sm-table-cell"><small>{{ route.zone || '-' }}</small></td>
                <td class="d-none d-md-table-cell"><small>{{ (route.description || '-').length > 30 ? (route.description || '-').substring(0, 30) + '...' : (route.description || '-') }}</small></td>
                <td>
                  <span *ngIf="getLenderName(route.lenderId)" class="badge bg-success" style="font-size: 0.7rem;">
                    {{ getLenderName(route.lenderId) }}
                  </span>
                  <span *ngIf="!route.lenderId" class="text-muted small">-</span>
                </td>
                <td class="text-center">
                  <span *ngIf="route.isActive" class="badge bg-success" style="font-size: 0.7rem;">Activa</span>
                  <span *ngIf="!route.isActive" class="badge bg-secondary" style="font-size: 0.7rem;">Inactiva</span>
                </td>
                <td class="text-center text-nowrap">
                  <button class="btn btn-sm btn-outline-primary py-1 px-2 me-1" title="Editar" (click)="openEditModal(route)">
                    <small>Editar</small>
                  </button>
                  <button class="btn btn-sm btn-outline-danger py-1 px-2" title="Eliminar" (click)="confirmDelete(route)">
                    <small>Eliminar</small>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredRoutes().length === 0">
                <td colspan="6" class="text-center text-muted py-4">No hay rutas registradas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Crear/Editar -->
      <div class="modal" [class.show]="showModal()" [style.display]="showModal() ? 'block' : 'none'" *ngIf="showModal()">
        <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingRoute() ? 'Editar Ruta' : 'Nueva Ruta' }}</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="form" *ngIf="form">
                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <div class="mb-3">
                      <label for="name" class="form-label">Nombre de la Ruta *</label>
                      <input 
                        type="text" 
                        id="name" 
                        class="form-control form-control-sm" 
                        formControlName="name"
                        placeholder="Nombre de la ruta"
                      />
                      <small class="text-danger" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">
                        El nombre es requerido
                      </small>
                    </div>
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="mb-3">
                      <label for="zone" class="form-label">Zona</label>
                      <input 
                        type="text" 
                        id="zone" 
                        class="form-control form-control-sm" 
                        formControlName="zone"
                        placeholder="Ej: Centro, Norte, Sur"
                      />
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="description" class="form-label">Descripción</label>
                  <textarea 
                    id="description" 
                    class="form-control form-control-sm" 
                    formControlName="description"
                    rows="3"
                    placeholder="Descripción de la ruta..."
                  ></textarea>
                </div>

                <div class="mb-3">
                  <label for="lenderId" class="form-label">Prestamista Asignado</label>
                  <select 
                    id="lenderId" 
                    class="form-select form-select-sm" 
                    formControlName="lenderId"
                  >
                    <option [value]="null">Sin prestamista asignado</option>
                    <option *ngFor="let lender of availableLenders()" [value]="lender.id">
                      {{ lender.name }}
                    </option>
                  </select>
                </div>

                <div class="form-check mb-0">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    class="form-check-input" 
                    formControlName="isActive"
                  />
                  <label class="form-check-label small" for="isActive">
                    Ruta Activa
                  </label>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" (click)="closeModal()">Cancelar</button>
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                (click)="saveRoute()"
                [disabled]="!form || form.invalid"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="showModal()"></div>

      <!-- Modal de Confirmación de Eliminación -->
      <div class="modal" [class.show]="showDeleteModal()" [style.display]="showDeleteModal() ? 'block' : 'none'" *ngIf="showDeleteModal()">
        <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Eliminación</h5>
              <button type="button" class="btn-close" (click)="closeDeleteModal()"></button>
            </div>
            <div class="modal-body">
              <p *ngIf="routeToDelete()" class="mb-0">
                ¿Estás seguro de que deseas eliminar la ruta <strong>{{ routeToDelete()?.name }}</strong>?
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" (click)="closeDeleteModal()">Cancelar</button>
              <button type="button" class="btn btn-danger btn-sm" (click)="deleteRoute()">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="showDeleteModal()"></div>

      <!-- Toast de Notificación -->
      <div 
        *ngIf="toast()" 
        class="position-fixed bottom-0 end-0 m-3 rounded-2 px-4 py-3 text-white shadow-lg"
        style="z-index: 1060; max-width: 90vw;"
        [class.bg-success]="toast()?.type === 'success'"
        [class.bg-danger]="toast()?.type === 'error'"
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
export class RutasComponent implements OnInit {
  private routeService = inject(RouteService);
  private lenderService = inject(LenderService);
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);

  routes = signal<Route[]>([]);
  lenders = signal<Lender[]>([]);
  searchTerm = signal('');
  showModal = signal(false);
  showDeleteModal = signal(false);
  editingRoute = signal<Route | null>(null);
  routeToDelete = signal<Route | null>(null);
  form: FormGroup | null = null;
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  userId: string = '';

  filteredRoutes = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.routes().filter(r => 
      r.name.toLowerCase().includes(term) ||
      (r.zone && r.zone.toLowerCase().includes(term)) ||
      (r.description && r.description.toLowerCase().includes(term))
    );
  });

  availableLenders = computed(() => {
    return this.lenders().filter(l => l.userId === this.userId && l.isActive);
  });

  assignedRoutesCount = computed(() => {
    return this.routes().filter(r => r.lenderId).length;
  });

  availableRoutesCount = computed(() => {
    return this.routes().filter(r => !r.lenderId).length;
  });

  ngOnInit() {
    this.userId = this.authService.getUserId() || '';
    this.loadData();
  }

  loadData() {
    this.routes.set(this.routeService.getByUserId(this.userId));
    this.lenders.set(this.lenderService.getByUserId(this.userId));
  }

  getLenderName(lenderId: string | null): string {
    if (!lenderId) return '';
    const lender = this.lenders().find(l => l.id === lenderId);
    return lender ? lender.name : '';
  }

  openCreateModal() {
    this.editingRoute.set(null);
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      zone: [''],
      description: [''],
      lenderId: [null],
      isActive: [true]
    });
    this.showModal.set(true);
  }

  openEditModal(route: Route) {
    this.editingRoute.set(route);
    this.form = this.formBuilder.group({
      name: [route.name, Validators.required],
      zone: [route.zone],
      description: [route.description],
      lenderId: [route.lenderId],
      isActive: [route.isActive]
    });
    this.showModal.set(true);
  }

  saveRoute() {
    if (!this.form || this.form.invalid) return;

    const formValue = this.form.value;
    
    try {
      if (this.editingRoute()) {
        const route = this.editingRoute()!;
        route.update(formValue);
        this.routeService.update(route.id, formValue);
        this.showToast('Ruta actualizada correctamente', 'success');
      } else {
        const newRoute = new Route({
          ...formValue,
          userId: this.userId,
          createdAt: new Date().toISOString()
        });
        this.routeService.create(newRoute);
        this.showToast('Ruta creada correctamente', 'success');
      }

      this.loadData();
      this.closeModal();
    } catch (error: any) {
      this.showToast(error.message || 'Error al guardar', 'error');
    }
  }

  confirmDelete(route: Route) {
    this.routeToDelete.set(route);
    this.showDeleteModal.set(true);
  }

  deleteRoute() {
    const route = this.routeToDelete();
    if (route) {
      try {
        this.routeService.delete(route.id);
        this.showToast('Ruta eliminada correctamente', 'success');
        this.loadData();
      } catch (error: any) {
        this.showToast(error.message || 'Error al eliminar', 'error');
      }
    }
    this.closeDeleteModal();
  }

  closeModal() {
    this.showModal.set(false);
    this.editingRoute.set(null);
    this.form = null;
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.routeToDelete.set(null);
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}

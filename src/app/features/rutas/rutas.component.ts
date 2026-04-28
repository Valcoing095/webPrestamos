import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, RouteService, PersonService, LenderService } from '../../../core/services';
import { Route } from '../../../core/models';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Gestion de Rutas</h1>
        <p class="text-muted mb-0">Administra las zonas y sectores de cobro</p>
      </header>

      <!-- Formulario -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-transparent">
          <h5 class="card-title mb-0">{{ editingId() ? 'Editar Ruta' : 'Crear Nueva Ruta' }}</h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="onSubmit()">
            <div class="row g-3">
              <div class="col-md-4">
                <label for="route-name" class="form-label">Nombre de la Ruta *</label>
                <input type="text" id="route-name" [(ngModel)]="formData.name" name="name" class="form-control" placeholder="Ej: Zona Norte" required />
              </div>
              <div class="col-md-4">
                <label for="route-zone" class="form-label">Zona/Sector</label>
                <input type="text" id="route-zone" [(ngModel)]="formData.zone" name="zone" class="form-control" placeholder="Ej: Centro Historico" />
              </div>
              <div class="col-md-4">
                <label for="route-status" class="form-label">Estado</label>
                <select id="route-status" [(ngModel)]="formData.isActive" name="isActive" class="form-select">
                  <option [ngValue]="true">Activa</option>
                  <option [ngValue]="false">Inactiva</option>
                </select>
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-12">
                <label for="route-description" class="form-label">Descripcion</label>
                <textarea id="route-description" [(ngModel)]="formData.description" name="description" class="form-control" rows="2" placeholder="Descripcion de la ruta..."></textarea>
              </div>
            </div>
            <div class="mt-3 d-flex gap-2">
              <button type="submit" class="btn btn-primary">
                {{ editingId() ? 'Actualizar' : 'Crear' }} Ruta
              </button>
              @if (editingId()) {
                <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancelar</button>
              }
            </div>
          </form>
        </div>
      </div>

      <!-- Lista de Rutas como Cards -->
      <div class="row g-4">
        @for (route of routes(); track route.id) {
          <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm" [class.border-start]="true" 
                 [class.border-success]="route.isActive" [class.border-secondary]="!route.isActive"
                 style="border-left-width: 4px !important;">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 class="card-title mb-1">{{ route.name }}</h5>
                    @if (route.zone) {
                      <span class="badge bg-light text-dark">{{ route.zone }}</span>
                    }
                  </div>
                  <span class="badge" [class.bg-success]="route.isActive" [class.bg-secondary]="!route.isActive">
                    {{ route.isActive ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
                
                @if (route.description) {
                  <p class="card-text text-muted small mb-3">{{ route.description }}</p>
                }

                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <div class="bg-light rounded p-2 text-center">
                      <div class="h5 mb-0 text-primary">{{ getClientsInRoute(route.id) }}</div>
                      <small class="text-muted">Clientes</small>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="bg-light rounded p-2 text-center">
                      <div class="h5 mb-0 text-info">{{ getLendersInRoute(route.id) }}</div>
                      <small class="text-muted">Prestamistas</small>
                    </div>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-primary flex-grow-1" (click)="editRoute(route)">
                    Editar
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(route)">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-body text-center py-5 text-muted">
                <p class="mb-0">No hay rutas registradas.</p>
                <p class="small">Crea tu primera ruta para organizar mejor tus cobros.</p>
              </div>
            </div>
          </div>
        }
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
              <p>Esta seguro de eliminar la ruta <strong>{{ routeToDelete()?.name }}</strong>?</p>
              @if (getClientsInRoute(routeToDelete()?.id || '') > 0 || getLendersInRoute(routeToDelete()?.id || '') > 0) {
                <div class="alert alert-warning">
                  Esta ruta tiene clientes o prestamistas asignados. Se desvincularan automaticamente.
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeConfirmModal()">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="deleteRoute()">Eliminar</button>
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
export class RutasComponent implements OnInit {
  formData = {
    name: '',
    zone: '',
    description: '',
    isActive: true
  };

  editingId = signal<string | null>(null);
  showConfirmModal = signal(false);
  routeToDelete = signal<Route | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  constructor(
    public authService: AuthService,
    private routeService: RouteService,
    private personService: PersonService,
    private lenderService: LenderService
  ) {}

  ngOnInit(): void {}

  private userId = computed(() => this.authService.getUserId());

  routes = computed(() => {
    const uid = this.userId();
    return uid ? this.routeService.getRoutesSignal(uid)() : [];
  });

  getClientsInRoute(routeId: string): number {
    return this.personService.getByRouteId(routeId).length;
  }

  getLendersInRoute(routeId: string): number {
    return this.lenderService.getByRouteId(routeId).length;
  }

  onSubmit(): void {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;

      const data = {
        name: this.formData.name,
        zone: this.formData.zone,
        description: this.formData.description,
        isActive: this.formData.isActive,
        userId
      };

      if (this.editingId()) {
        this.routeService.updateRoute(this.editingId()!, data);
        this.showToast('Ruta actualizada', 'success');
      } else {
        this.routeService.create(data);
        this.showToast('Ruta creada', 'success');
      }

      this.resetForm();
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  editRoute(route: Route): void {
    this.editingId.set(route.id);
    this.formData = {
      name: route.name,
      zone: route.zone,
      description: route.description,
      isActive: route.isActive
    };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  confirmDelete(route: Route): void {
    this.routeToDelete.set(route);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.routeToDelete.set(null);
  }

  deleteRoute(): void {
    const route = this.routeToDelete();
    if (route) {
      const userId = this.authService.getUserId();
      if (userId) {
        this.routeService.deleteWithUserId(route.id, userId);
        this.showToast('Ruta eliminada', 'success');
      }
    }
    this.closeConfirmModal();
  }

  resetForm(): void {
    this.editingId.set(null);
    this.formData = {
      name: '',
      zone: '',
      description: '',
      isActive: true
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

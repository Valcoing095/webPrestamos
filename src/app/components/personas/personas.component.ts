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
import { Person } from '../../models';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Gestión de Personas</h1>
        <p class="text-muted mb-0">Administra tus deudores</p>
      </header>
      
      <!-- Formulario -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-transparent">
          <h5 class="card-title mb-0">{{ isEditing() ? 'Editar Persona' : 'Agregar Nueva Persona' }}</h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="onSubmit()">
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label for="person-name" class="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  id="person-name"
                  [(ngModel)]="formData.name"
                  name="name"
                  class="form-control"
                  placeholder="Nombre de la persona"
                  required
                />
              </div>
              <div class="col-12 col-md-4">
                <label for="person-phone" class="form-label">Teléfono</label>
                <input
                  type="tel"
                  id="person-phone"
                  [(ngModel)]="formData.phone"
                  name="phone"
                  class="form-control"
                  placeholder="Opcional"
                />
              </div>
              <div class="col-12 col-md-4">
                <label for="person-address" class="form-label">Dirección</label>
                <input
                  type="text"
                  id="person-address"
                  [(ngModel)]="formData.address"
                  name="address"
                  class="form-control"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div class="mt-3">
              <label for="person-notes" class="form-label">Notas</label>
              <input
                type="text"
                id="person-notes"
                [(ngModel)]="formData.notes"
                name="notes"
                class="form-control"
                placeholder="Notas adicionales..."
              />
            </div>
            <div class="mt-3">
              <button type="submit" class="btn btn-primary me-2">
                {{ isEditing() ? 'Actualizar Persona' : 'Agregar Persona' }}
              </button>
              @if (isEditing()) {
                <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancelar</button>
              }
            </div>
          </form>
        </div>
      </div>

      <!-- Lista de Personas -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Personas Registradas</h5>
          <span class="badge bg-primary">{{ persons().length }}</span>
        </div>
        <div class="card-body p-0">
          <div class="row g-3 p-3">
            @for (person of persons(); track person.id) {
              <div class="col-md-6 col-lg-4">
                <div class="card h-100 border">
                  <div class="card-body">
                    <h5 class="card-title">{{ person.name }}</h5>
                    @if (person.phone) {
                      <p class="card-text text-muted small mb-1">📱 {{ person.phone }}</p>
                    }
                    @if (person.address) {
                      <p class="card-text text-muted small mb-1">📍 {{ person.address }}</p>
                    }
                    @if (person.notes) {
                      <p class="card-text text-muted small mb-2">📝 {{ person.notes }}</p>
                    }
                    <p class="card-text">
                      <span class="badge bg-info">{{ getActiveLoansCount(person.id) }} préstamo(s) activo(s)</span>
                    </p>
                  </div>
                  <div class="card-footer bg-transparent d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" (click)="viewLoans(person)">
                      Ver Préstamos
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" (click)="editPerson(person)">
                      Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(person)">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="text-center text-muted p-5">
                <p class="mb-0">No hay personas registradas.</p>
                <p class="small">¡Agrega tu primera persona!</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    @if (showEditModal()) {
      <div class="modal show d-block" tabindex="-1" (click)="closeModal($event)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar Persona</h5>
              <button type="button" class="btn-close" (click)="closeEditModal()"></button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="saveEdit()">
                <div class="mb-3">
                  <label for="edit-name" class="form-label">Nombre</label>
                  <input type="text" id="edit-name" [(ngModel)]="editData.name" name="editName" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label for="edit-phone" class="form-label">Teléfono</label>
                  <input type="tel" id="edit-phone" [(ngModel)]="editData.phone" name="editPhone" class="form-control" />
                </div>
                <div class="mb-3">
                  <label for="edit-address" class="form-label">Dirección</label>
                  <input type="text" id="edit-address" [(ngModel)]="editData.address" name="editAddress" class="form-control" />
                </div>
                <div class="mb-3">
                  <label for="edit-notes" class="form-label">Notas</label>
                  <input type="text" id="edit-notes" [(ngModel)]="editData.notes" name="editNotes" class="form-control" />
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                  <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Confirmación -->
    @if (showConfirmModal()) {
      <div class="modal show d-block" tabindex="-1" (click)="closeConfirmModal()">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar</h5>
              <button type="button" class="btn-close" (click)="closeConfirmModal()"></button>
            </div>
            <div class="modal-body">
              <p>¿Eliminar a {{ personToDelete()?.name }}?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeConfirmModal()">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="deletePerson()">Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Préstamos -->
    @if (showLoansModal()) {
      <div class="modal show d-block" tabindex="-1" (click)="closeLoansModal($event)">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Préstamos de {{ selectedPerson()?.name }}</h5>
              <button type="button" class="btn-close" (click)="closeLoansModal()"></button>
            </div>
            <div class="modal-body">
              @for (loan of personLoans(); track loan.id) {
                <div class="card mb-2">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 class="mb-1">{{ formatCurrency(loan.amount) }}</h6>
                        <small class="text-muted">{{ formatDate(loan.date) }} - {{ getLoanStatus(loan) }}</small>
                      </div>
                      <span class="badge" [class]="isLoanCompleted(loan) ? 'bg-success' : 'bg-warning'">
                        {{ getLoanStatus(loan) }}
                      </span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="text-center text-muted p-3">
                  <p>No hay préstamos registrados.</p>
                </div>
              }
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
export class PersonasComponent implements OnInit {
  formData = { name: '', phone: '', address: '', notes: '' };
  editData: any = {};
  isEditing = signal(false);
  showEditModal = signal(false);
  showConfirmModal = signal(false);
  showLoansModal = signal(false);
  personToDelete = signal<Person | null>(null);
  selectedPerson = signal<Person | null>(null);
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

  getActiveLoansCount(personId: string): number {
    const loans = this.loanService.getByPersonId(personId);
    return loans.filter((loan) => {
      const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
      const total = loan.totalToCollect || loan.amount;
      return totalPaid < total;
    }).length;
  }

  personLoans = computed(() => {
    const person = this.selectedPerson();
    if (!person) return [];
    return this.loanService.getByPersonId(person.id);
  });

  viewLoans(person: Person): void {
    this.selectedPerson.set(person);
    this.showLoansModal.set(true);
  }

  closeLoansModal(event?: MouseEvent): void {
    if (event && !(event.target as HTMLElement).classList.contains('modal')) return;
    this.showLoansModal.set(false);
    this.selectedPerson.set(null);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX');
  }

  isLoanCompleted(loan: any): boolean {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
    return totalPaid >= total;
  }

  getLoanStatus(loan: any): string {
    if (this.isLoanCompleted(loan)) return 'Completado';
    return 'Activo';
  }

  onSubmit(): void {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;

      this.personService.create({
        ...this.formData,
        userId,
      });

      this.showToast('Persona agregada', 'success');
      this.formData = { name: '', phone: '', address: '', notes: '' };
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  editPerson(person: Person): void {
    this.editData = { ...person };
    this.isEditing.set(true);
    this.showEditModal.set(true);
  }

  saveEdit(): void {
    try {
      this.personService.updatePerson(this.editData.id, this.editData);
      this.showToast('Persona actualizada', 'success');
      this.closeEditModal();
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editData = {};
    this.isEditing.set(false);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.formData = { name: '', phone: '', address: '', notes: '' };
  }

  confirmDelete(person: Person): void {
    const hasLoans = this.loanService.getByPersonId(person.id).length > 0;
    if (hasLoans) {
      this.showToast('No se puede eliminar una persona con préstamos', 'error');
      return;
    }
    this.personToDelete.set(person);
    this.showConfirmModal.set(true);
  }

  deletePerson(): void {
    const person = this.personToDelete();
    if (person) {
      this.personService.delete(person.id);
      this.showToast('Persona eliminada', 'success');
    }
    this.closeConfirmModal();
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.personToDelete.set(null);
  }

  closeModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeEditModal();
      this.closeConfirmModal();
    }
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

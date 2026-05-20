import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthService,
  PersonService,
  LoanService,
  PaymentService,
  LoanCalculator,
  RouteService
} from '../../core/services';
import { Person } from '../../core/models';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">Clientes</h1>
          <p class="text-sm text-slate-500 mt-1">Administra tus deudores</p>
        </div>
        <button 
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          (click)="showAddModal.set(true)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nuevo Cliente
        </button>
      </div>

      <!-- Search -->
      <div class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <input 
          type="text" 
          class="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
          placeholder="Buscar clientes..."
          [(ngModel)]="searchTerm"
        >
      </div>

      <!-- Clients Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (person of filteredPersons(); track person.id) {
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div class="p-5">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <span class="text-sm font-semibold text-slate-600">{{ person.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-800">{{ person.name }}</h3>
                    @if (person.phone) {
                      <p class="text-xs text-slate-500">{{ person.phone }}</p>
                    }
                  </div>
                </div>
                <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" 
                      [class]="getActiveLoansCount(person.id) > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'">
                  {{ getActiveLoansCount(person.id) }} activo(s)
                </span>
              </div>
              
              @if (person.address) {
                <p class="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  </svg>
                  {{ person.address }}
                </p>
              }
              
              @if (person.routeId) {
                <div class="mt-3">
                  <span class="inline-flex px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded">{{ getRouteName(person.routeId) }}</span>
                </div>
              }
            </div>
            <div class="flex items-center border-t border-slate-50">
              <button class="flex-1 px-4 py-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors" (click)="viewLoans(person)">Ver Prestamos</button>
              <button class="flex-1 px-4 py-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-50" (click)="editPerson(person)">Editar</button>
              <button class="flex-1 px-4 py-3 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-slate-50" (click)="confirmDelete(person)">Eliminar</button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full bg-white rounded-xl border border-slate-100 p-12 text-center">
            <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <p class="text-sm text-slate-500">No hay clientes registrados</p>
          </div>
        }
      </div>
    </div>

    <!-- Add Modal -->
    @if (showAddModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" (click)="showAddModal.set(false)"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md transform animate-scaleIn">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="text-lg font-semibold text-slate-800">Nuevo Cliente</h3>
            <button class="p-2 text-slate-400 hover:text-slate-600 rounded-lg" (click)="showAddModal.set(false)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
              <input type="text" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="formData.name" placeholder="Nombre completo">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Telefono</label>
              <input type="tel" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="formData.phone" placeholder="Opcional">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Direccion</label>
              <input type="text" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="formData.address" placeholder="Opcional">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Ruta</label>
              <select class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="formData.routeId">
                <option value="">Sin ruta</option>
                @for (route of routes(); track route.id) {
                  <option [value]="route.id">{{ route.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
              <input type="text" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="formData.notes" placeholder="Notas adicionales">
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
            <button class="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" (click)="showAddModal.set(false)">Cancelar</button>
            <button class="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors" (click)="onSubmit()">Guardar</button>
          </div>
        </div>
      </div>
    }

    <!-- Edit Modal -->
    @if (showEditModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" (click)="closeEditModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md transform animate-scaleIn">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="text-lg font-semibold text-slate-800">Editar Cliente</h3>
            <button class="p-2 text-slate-400 hover:text-slate-600 rounded-lg" (click)="closeEditModal()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
              <input type="text" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="editData.name" placeholder="Nombre completo">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Telefono</label>
              <input type="tel" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="editData.phone" placeholder="Opcional">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Direccion</label>
              <input type="text" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="editData.address" placeholder="Opcional">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Ruta</label>
              <select class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="editData.routeId">
                <option value="">Sin ruta</option>
                @for (route of routes(); track route.id) {
                  <option [value]="route.id">{{ route.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
              <input type="text" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="editData.notes" placeholder="Notas adicionales">
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
            <button class="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" (click)="closeEditModal()">Cancelar</button>
            <button class="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors" (click)="saveEdit()">Actualizar</button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation -->
    @if (showConfirmModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" (click)="closeConfirmModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm transform animate-scaleIn">
          <div class="p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-800 mb-2">Eliminar Cliente</h3>
            <p class="text-sm text-slate-500 mb-6">Eliminar a {{ personToDelete()?.name }}?</p>
            <div class="flex gap-3">
              <button class="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" (click)="closeConfirmModal()">Cancelar</button>
              <button class="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors" (click)="deletePerson()">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Loans Modal -->
    @if (showLoansModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" (click)="closeLoansModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg transform animate-scaleIn max-h-[80vh] overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="text-lg font-semibold text-slate-800">Prestamos de {{ selectedPerson()?.name }}</h3>
            <button class="p-2 text-slate-400 hover:text-slate-600 rounded-lg" (click)="closeLoansModal()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="p-6 overflow-y-auto max-h-96 space-y-3">
            @for (loan of personLoans(); track loan.id) {
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ formatCurrency(loan.amount) }}</p>
                  <p class="text-xs text-slate-500">{{ formatDate(loan.date) }}</p>
                </div>
                <span class="inline-flex px-2.5 py-1 text-xs font-medium rounded-full" 
                      [class]="isLoanCompleted(loan) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
                  {{ getLoanStatus(loan) }}
                </span>
              </div>
            } @empty {
              <div class="text-center py-8">
                <p class="text-sm text-slate-500">Sin prestamos registrados</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Toast -->
    @if (toast()) {
      <div class="fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 animate-slideUp"
           [class]="toast()?.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'">
        {{ toast()?.message }}
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
  formData = { name: '', phone: '', address: '', notes: '', routeId: '' };
  editData: any = {};
  searchTerm = '';
  isEditing = signal(false);
  showAddModal = signal(false);
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
    private routeService: RouteService
  ) {}

  ngOnInit(): void {
    this.loanService.setPaymentService(this.paymentService);
  }

  private userId = computed(() => this.authService.getUserId());

  persons = computed(() => {
    const uid = this.userId();
    return uid ? this.personService.getPersonsSignal(uid)() : [];
  });

  filteredPersons = computed(() => {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.persons();
    return this.persons().filter(p => p.name.toLowerCase().includes(term));
  });

  routes = computed(() => {
    const uid = this.userId();
    return uid ? this.routeService.getRoutesSignal(uid)() : [];
  });

  getRouteName(routeId: string): string {
    return this.routeService.getById(routeId)?.name || 'Sin ruta';
  }

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

  closeLoansModal(): void {
    this.showLoansModal.set(false);
    this.selectedPerson.set(null);
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
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
        routeId: this.formData.routeId || null,
        userId,
      });

  this.showToast('Persona agregada', 'success');
  this.formData = { name: '', phone: '', address: '', notes: '', routeId: '' };
  this.showAddModal.set(false);
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
    this.formData = { name: '', phone: '', address: '', notes: '', routeId: '' };
  }

  confirmDelete(person: Person): void {
    const hasLoans = this.loanService.getByPersonId(person.id).length > 0;
    if (hasLoans) {
      this.showToast('No se puede eliminar una persona con prestamos', 'error');
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
}

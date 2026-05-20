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
    <div class="space-y-6 animate-fadeIn">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">Mis Prestamos</h1>
          <p class="text-sm text-slate-500 mt-1">Gestion de prestamos propios</p>
        </div>
        <button 
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          (click)="openModal()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nuevo Prestamo
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Prestado</p>
          <p class="text-xl font-bold text-slate-800 mt-2">{{ formatCurrency(stats().totalLoaned) }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Cobrado</p>
          <p class="text-xl font-bold text-emerald-600 mt-2">{{ formatCurrency(stats().totalCollected) }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Pendiente</p>
          <p class="text-xl font-bold text-amber-600 mt-2">{{ formatCurrency(stats().totalPending) }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Activos</p>
          <p class="text-xl font-bold text-slate-800 mt-2">{{ stats().activeCount }}</p>
        </div>
      </div>

      <!-- Filter -->
      <div class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <input 
              type="text" 
              class="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              placeholder="Buscar por cliente..."
              [(ngModel)]="searchTerm"
            >
          </div>
          <select 
            class="px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20"
            [(ngModel)]="filterStatus"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50/80">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagado</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendiente</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Frecuencia</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (loan of filteredLoans(); track loan.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4">
                    <p class="text-sm font-medium text-slate-800">{{ getPersonName(loan.personId) }}</p>
                    <p class="text-xs text-slate-400">{{ formatDate(loan.date) }}</p>
                  </td>
                  <td class="px-6 py-4 text-sm text-right text-slate-700">{{ formatCurrency(loan.amount) }}</td>
                  <td class="px-6 py-4 text-sm text-right font-medium text-slate-800">{{ formatCurrency(loan.totalToCollect) }}</td>
                  <td class="px-6 py-4 text-sm text-right text-emerald-600">{{ formatCurrency(getTotalPaid(loan.id)) }}</td>
                  <td class="px-6 py-4 text-sm text-right text-amber-600">{{ formatCurrency(getPending(loan)) }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                      {{ getFrequencyLabel(loan.paymentFrequency) }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    @if (isCompleted(loan)) {
                      <span class="inline-flex px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">Completado</span>
                    } @else {
                      <span class="inline-flex px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">Activo</span>
                    }
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button 
                        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        (click)="editLoan(loan)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button 
                        class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        (click)="confirmDelete(loan)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-sm text-slate-400">
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
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-xl transform animate-scaleIn">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="text-lg font-semibold text-slate-800">{{ editingLoan() ? 'Editar' : 'Nuevo' }} Prestamo</h3>
            <button class="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors" (click)="closeModal()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
                <select class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="form.personId">
                  <option value="">Seleccionar</option>
                  @for (person of persons(); track person.id) {
                    <option [value]="person.id">{{ person.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Fecha</label>
                <input type="date" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="form.date">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Frecuencia</label>
                <select class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="form.paymentFrequency">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Monto</label>
                <input type="number" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="form.amount" min="0">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Interes (%)</label>
                <input type="number" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="form.interest" min="0">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Total a Cobrar</label>
                <input type="number" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" [(ngModel)]="form.totalToCollect" min="0">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                <textarea class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" [(ngModel)]="form.notes" rows="2"></textarea>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
            <button class="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" (click)="closeModal()">Cancelar</button>
            <button class="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors" (click)="saveLoan()">
              {{ editingLoan() ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation -->
    @if (showDeleteConfirm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" (click)="showDeleteConfirm.set(false)"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm transform animate-scaleIn">
          <div class="p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-800 mb-2">Eliminar Prestamo</h3>
            <p class="text-sm text-slate-500 mb-6">Esta accion no se puede deshacer. Se eliminaran todos los pagos asociados.</p>
            <div class="flex gap-3">
              <button class="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" (click)="showDeleteConfirm.set(false)">Cancelar</button>
              <button class="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors" (click)="deleteLoan()">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
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

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
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a href="#" class="nav-brand">📋 Gestor de Préstamos</a>
        <div class="nav-links">
          <a routerLink="/dashboard" class="nav-link">Dashboard</a>
          <a routerLink="/personas" class="nav-link active">Personas</a>
          <a routerLink="/prestamos" class="nav-link">Préstamos</a>
          <a routerLink="/pagos" class="nav-link">Pagos</a>
        </div>
        <div class="nav-user">
          <span class="nav-username">{{ authService.currentUser()?.name }}</span>
          <button class="nav-btn-logout" (click)="logout()">Cerrar Sesión</button>
        </div>
        <button class="nav-hamburger" aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <header class="page-header">
          <h1>Gestión de Personas</h1>
          <p class="subtitle">Administra a tus deudores</p>
        </header>

        <section class="form-section">
          <h2>Agregar Nueva Persona</h2>
          <form (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label for="person-name">Nombre Completo *</label>
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
              <div class="form-group">
                <label for="person-phone">Teléfono</label>
                <input
                  type="tel"
                  id="person-phone"
                  [(ngModel)]="formData.phone"
                  name="phone"
                  class="form-control"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div class="form-group full">
              <label for="person-address">Dirección</label>
              <input
                type="text"
                id="person-address"
                [(ngModel)]="formData.address"
                name="address"
                class="form-control"
                placeholder="Opcional"
              />
            </div>
            <div class="form-group full">
              <label for="person-notes">Notas</label>
              <input
                type="text"
                id="person-notes"
                [(ngModel)]="formData.notes"
                name="notes"
                class="form-control"
                placeholder="Notas adicionales..."
              />
            </div>
            <button type="submit" class="btn btn-primary">Agregar Persona</button>
          </form>
        </section>

        <section class="card-section">
          <div class="section-header">
            <h2>Personas Registradas</h2>
            <span class="count-badge">{{ persons().length }}</span>
          </div>
          <div class="persons-grid">
            @for (person of persons(); track person.id) {
              <div class="person-card">
                <div class="person-name">{{ person.name }}</div>
                @if (person.phone) {
                  <div class="person-contact">📱 {{ person.phone }}</div>
                }
                @if (person.address) {
                  <div class="person-contact">📍 {{ person.address }}</div>
                }
                @if (person.notes) {
                  <div class="person-contact">📝 {{ person.notes }}</div>
                }
                <div class="person-loans">
                  {{ getActiveLoansCount(person.id) }} préstamo(s) activo(s)
                </div>
                <div class="person-actions">
                  <button class="btn btn-sm btn-info" (click)="viewLoans(person)">
                    Ver Préstamos
                  </button>
                  <button class="btn btn-sm btn-outline" (click)="editPerson(person)">
                    Editar
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="confirmDelete(person)">
                    Eliminar
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">👤</span>
                <p>No hay personas registradas.</p>
                <p class="empty-hint">¡Agrega tu primera persona!</p>
              </div>
            }
          </div>
        </section>
      </div>
    </main>

    @if (showEditModal()) {
      <div class="modal active" (click)="closeModal($event)">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Editar Persona</h3>
            <button class="modal-close" (click)="closeEditModal()">×</button>
          </div>
          <form (ngSubmit)="saveEdit()">
            <input type="hidden" [(ngModel)]="editData.id" name="id" />
            <div class="form-group">
              <label for="edit-name">Nombre *</label>
              <input
                type="text"
                id="edit-name"
                [(ngModel)]="editData.name"
                name="name"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="edit-phone">Teléfono</label>
              <input
                type="tel"
                id="edit-phone"
                [(ngModel)]="editData.phone"
                name="phone"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="edit-address">Dirección</label>
              <input
                type="text"
                id="edit-address"
                [(ngModel)]="editData.address"
                name="address"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="edit-notes">Notas</label>
              <input
                type="text"
                id="edit-notes"
                [(ngModel)]="editData.notes"
                name="notes"
                class="form-control"
              />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (showConfirmModal()) {
      <div class="modal active" (click)="closeConfirmModal()">
        <div class="modal-content modal-confirm">
          <div class="modal-header">
            <h3 class="modal-title">Confirmar</h3>
          </div>
          <div class="modal-body">
            <p>¿Eliminar a {{ personToDelete()?.name }}?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeConfirmModal()">
              Cancelar
            </button>
            <button type="button" class="btn btn-danger" (click)="deletePerson()">Confirmar</button>
          </div>
        </div>
      </div>
    }

    @if (showLoansModal()) {
      <div class="modal active" (click)="closeLoansModal($event)">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3 class="modal-title">Préstamos de {{ selectedPerson()?.name }}</h3>
            <button class="modal-close" (click)="closeLoansModal()">×</button>
          </div>
          <div class="loans-list">
            @for (loan of personLoans(); track loan.id) {
              <div class="loan-item">
                <div class="loan-header">
                  <span class="loan-amount">{{ formatCurrency(loan.amount) }}</span>
                  <span
                    class="loan-status"
                    [class.completed]="isLoanCompleted(loan)"
                    [class.overdue]="isLoanOverdue(loan)"
                  >
                    {{ getLoanStatus(loan) }}
                  </span>
                </div>
                <div class="loan-details">
                  <span>Fecha: {{ formatDate(loan.date) }}</span>
                  <span>Interés: {{ loan.interest }}%</span>
                </div>
                <div class="loan-progress">
                  <div class="progress-info">
                    <span>Pagado: {{ formatCurrency(getPaidAmount(loan)) }}</span>
                    <span>Total: {{ formatCurrency(getTotalAmount(loan)) }}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="getProgressPercent(loan)"></div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">💰</span>
                <p>No hay préstamos registrados.</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    @if (toast()) {
      <div class="toast" [class]="'toast-' + toast()?.type">
        <span class="toast-message">{{ toast()?.message }}</span>
        <button class="toast-close" (click)="clearToast()">×</button>
      </div>
    }
  `,
  styles: [
    `
      .navbar {
        background: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 1rem 0;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
      }
      .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .nav-brand {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1a1a2e;
        text-decoration: none;
      }
      .nav-links {
        display: flex;
        gap: 1.5rem;
      }
      .nav-link {
        color: #666;
        text-decoration: none;
        font-weight: 500;
        padding: 0.5rem 0;
        border-bottom: 2px solid transparent;
        transition: all 0.3s;
      }
      .nav-link:hover,
      .nav-link.active {
        color: #667eea;
        border-bottom-color: #667eea;
      }
      .nav-user {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .nav-username {
        font-weight: 500;
        color: #333;
      }
      .nav-btn-logout {
        background: #f3f4f6;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        color: #666;
      }
      .nav-hamburger {
        display: none;
      }
      .main-content {
        margin-top: 80px;
        padding: 2rem 1.5rem;
        background: #f5f7fa;
        min-height: calc(100vh - 80px);
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 2rem;
      }
      .page-header h1 {
        font-size: 2rem;
        color: #1a1a2e;
        margin: 0 0 0.5rem 0;
      }
      .subtitle {
        color: #666;
        margin: 0;
      }
      .form-section,
      .card-section {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
      .form-section h2,
      .card-section h2 {
        font-size: 1.25rem;
        color: #1a1a2e;
        margin: 0 0 1.5rem 0;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .form-group.full {
        grid-column: 1 / -1;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }
      .form-control {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e1e1e1;
        border-radius: 0.5rem;
        font-size: 1rem;
      }
      .form-control:focus {
        outline: none;
        border-color: #667eea;
      }
      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
      }
      .btn-secondary {
        background: #e5e7eb;
        color: #666;
      }
      .btn-danger {
        background: #fee2e2;
        color: #dc2626;
      }
      .btn-danger:hover {
        background: #fca5a5;
      }
      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
      .btn-outline {
        background: transparent;
        border: 2px solid #667eea;
        color: #667eea;
      }
      .btn-outline:hover {
        background: #667eea;
        color: white;
      }
      .btn-info {
        background: #e0f2fe;
        color: #0284c7;
      }
      .btn-info:hover {
        background: #bae6fd;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .count-badge {
        background: #667eea;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-weight: 600;
        font-size: 0.875rem;
      }
      .persons-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
      }
      .person-card {
        background: #f9fafb;
        border-radius: 0.75rem;
        padding: 1.25rem;
        border: 1px solid #e5e7eb;
      }
      .person-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1a2e;
        margin-bottom: 0.5rem;
      }
      .person-contact {
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.25rem;
      }
      .person-loans {
        font-size: 0.875rem;
        color: #667eea;
        font-weight: 500;
        margin: 0.75rem 0;
      }
      .person-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .loans-list {
        max-height: 400px;
        overflow-y: auto;
      }
      .loan-item {
        background: #f9fafb;
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
        border: 1px solid #e5e7eb;
      }
      .loan-item:last-child {
        margin-bottom: 0;
      }
      .loan-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .loan-amount {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1a2e;
      }
      .loan-status {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        background: #fef3c7;
        color: #d97706;
      }
      .loan-status.completed {
        background: #dcfce7;
        color: #16a34a;
      }
      .loan-status.overdue {
        background: #fee2e2;
        color: #dc2626;
      }
      .loan-details {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
        color: #666;
        margin-bottom: 0.75rem;
      }
      .loan-progress .progress-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #666;
        margin-bottom: 0.25rem;
      }
      .loan-progress .progress-bar {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }
      .loan-progress .progress-fill {
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .empty-state {
        text-align: center;
        padding: 3rem;
        color: #666;
      }
      .empty-icon {
        font-size: 4rem;
        display: block;
        margin-bottom: 1rem;
      }
      .empty-hint {
        color: #999;
        font-size: 0.875rem;
      }
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
      }
      .modal.active {
        opacity: 1;
        pointer-events: all;
      }
      .modal-content {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }
      .modal-content.modal-large {
        max-width: 600px;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .modal-title {
        font-size: 1.25rem;
        color: #1a1a2e;
        margin: 0;
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .modal-body p {
        margin: 0;
        color: #333;
      }
      .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 300;
        animation: slideIn 0.3s ease-out;
      }
      .toast-success {
        border-left: 4px solid #22c55e;
      }
      .toast-error {
        border-left: 4px solid #dc2626;
      }
      .toast-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #666;
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @media (max-width: 768px) {
        .nav-links {
          display: none;
        }
        .nav-hamburger {
          display: block;
        }
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PersonasComponent implements OnInit {
  formData = { name: '', phone: '', address: '', notes: '' };
  editData: any = {};
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

  persons = computed(() => {
    const userId = this.authService.getUserId();
    return userId ? this.personService.getByUserId(userId) : [];
  });

  getActiveLoansCount(personId: string): number {
    const loans = this.loanService.getByPersonId(personId);
    return loans.filter((loan) => {
      const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
      const total = LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
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
    const total = LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
    return totalPaid >= total;
  }

  isLoanOverdue(loan: any): boolean {
    if (!loan.dueDate) return false;
    return new Date(loan.dueDate) < new Date() && !this.isLoanCompleted(loan);
  }

  getLoanStatus(loan: any): string {
    if (this.isLoanCompleted(loan)) return 'Completado';
    if (this.isLoanOverdue(loan)) return 'En Mora';
    return 'Activo';
  }

  getPaidAmount(loan: any): number {
    return this.paymentService.getTotalPaidForLoan(loan.id);
  }

  getTotalAmount(loan: any): number {
    return LoanCalculator.calculateTotalWithInterest(loan.amount, loan.interest);
  }

  getProgressPercent(loan: any): number {
    const totalPaid = this.getPaidAmount(loan);
    const total = this.getTotalAmount(loan);
    if (total === 0) return 0;
    return Math.min(100, (totalPaid / total) * 100);
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

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
import { Loan, PaymentFrequency } from '../../models';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a href="#" class="nav-brand">📋 Gestor de Préstamos</a>
        <div class="nav-links">
          <a routerLink="/dashboard" class="nav-link">Dashboard</a>
          <a routerLink="/personas" class="nav-link">Personas</a>
          <a routerLink="/prestamos" class="nav-link active">Préstamos</a>
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
          <h1>Gestión de Préstamos</h1>
          <p class="subtitle">Registra y controla tus préstamos</p>
        </header>

        <section class="summary-cards grid-2">
          <div class="card card-red">
            <div class="card-icon">⚠️</div>
            <div class="card-content">
              <span class="card-label">En Mora</span>
              <span class="card-value">{{ overdueCount() }}</span>
            </div>
          </div>
          <div class="card card-amber">
            <div class="card-icon">📅</div>
            <div class="card-content">
              <span class="card-label">Días Mora Total</span>
              <span class="card-value">{{ totalOverdueDays() }}</span>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h2>Nuevo Préstamo</h2>
          <form (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label for="loan-person">Persona *</label>
                <select
                  id="loan-person"
                  [(ngModel)]="formData.personId"
                  name="personId"
                  class="form-control"
                  required
                >
                  <option value="">Seleccionar persona...</option>
                  @for (person of persons(); track person.id) {
                    <option [value]="person.id">{{ person.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="loan-amount">Monto Prestado *</label>
                <input
                  type="number"
                  id="loan-amount"
                  [(ngModel)]="formData.amount"
                  name="amount"
                  class="form-control"
                  placeholder="$0.00"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="loan-date">Fecha del Préstamo *</label>
                <input
                  type="date"
                  id="loan-date"
                  [(ngModel)]="formData.date"
                  name="date"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label for="loan-frequency">Frecuencia de Pago *</label>
                <select
                  id="loan-frequency"
                  [(ngModel)]="formData.paymentFrequency"
                  name="paymentFrequency"
                  class="form-control"
                  required
                >
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="weekly">Semanal</option>
                  <option value="daily">Diario</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="loan-term">Plazo (meses)</label>
                <input
                  type="number"
                  id="loan-term"
                  [(ngModel)]="formData.term"
                  name="term"
                  class="form-control"
                  placeholder="Ej: 3"
                  min="1"
                  max="120"
                />
              </div>
              <div class="form-group">
                <label for="loan-total">Total a Cobrar *</label>
                <input
                  type="number"
                  id="loan-total"
                  [(ngModel)]="formData.totalToCollect"
                  name="totalToCollect"
                  class="form-control"
                  placeholder="$0.00"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div class="form-group full">
              <label for="loan-notes">Notas del Préstamo</label>
              <input
                type="text"
                id="loan-notes"
                [(ngModel)]="formData.notes"
                name="notes"
                class="form-control"
                placeholder="Notas adicionales..."
              />
            </div>

            @if (preview().total > 0) {
              <div class="calculator-preview">
                <div class="calc-title">📊 Vista Previa del Cálculo</div>
                <div class="calc-grid">
                  <div class="calc-item">
                    <span class="calc-label">Monto Original</span>
                    <span class="calc-value">{{ formatCurrency(preview().principal) }}</span>
                  </div>
                  <div class="calc-item">
                    <span class="calc-label">Interés ({{ preview().interestRate }}%)</span>
                    <span class="calc-value">{{ formatCurrency(preview().interest) }}</span>
                  </div>
                  <div class="calc-item highlight">
                    <span class="calc-label">Total a Cobrar</span>
                    <span class="calc-value">{{ formatCurrency(preview().total) }}</span>
                  </div>
                  @if (formData.term > 0) {
                    <div class="calc-item highlight-green">
                      <span class="calc-label">Pago {{ getFrequencyLabel() }}</span>
                      <span class="calc-value">{{ formatCurrency(preview().payment) }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <button type="submit" class="btn btn-primary">Crear Préstamo</button>
          </form>
        </section>

        <section class="card-section">
          <div class="section-header">
            <h2>Préstamos</h2>
            <div class="filter-tabs">
              <button
                class="filter-tab"
                [class.active]="currentFilter() === 'all'"
                (click)="setFilter('all')"
              >
                Todos
              </button>
              <button
                class="filter-tab"
                [class.active]="currentFilter() === 'active'"
                (click)="setFilter('active')"
              >
                Activos
              </button>
              <button
                class="filter-tab"
                [class.active]="currentFilter() === 'overdue'"
                (click)="setFilter('overdue')"
              >
                En Mora
              </button>
              <button
                class="filter-tab"
                [class.active]="currentFilter() === 'completed'"
                (click)="setFilter('completed')"
              >
                Completados
              </button>
            </div>
          </div>
          <div class="loans-list">
            @for (loan of filteredLoans(); track loan.id) {
              <div class="loan-card" [class.overdue]="isOverdue(loan)">
                <div class="loan-header">
                  <div class="loan-person">{{ getPersonName(loan.personId) }}</div>
                  <div class="loan-amount">{{ formatCurrency(loan.amount) }}</div>
                </div>
                <div class="loan-details">
                  <span>📅 {{ formatDate(loan.date) }}</span>
                  <span>📆 {{ getFrequencyLabel(loan.paymentFrequency) }}</span>
                  <span>💰 Total: {{ formatCurrency(loan.totalToCollect) }}</span>
                </div>
                <div class="loan-next-payment">
                  <span class="next-payment-label">Próximo Pago:</span>
                  <span class="next-payment-value">{{
                    formatCurrency(getNextPaymentAmount(loan))
                  }}</span>
                  <span class="next-payment-date">{{ formatDate(getNextPaymentDate(loan)) }}</span>
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
                <div class="loan-actions">
                  <button class="btn btn-sm btn-primary" (click)="openPaymentModal(loan)">
                    Registrar Pago
                  </button>
                  <button class="btn btn-sm btn-info" (click)="openHistoryModal(loan)">
                    Historial
                  </button>
                  <button class="btn btn-sm btn-outline" (click)="confirmDelete(loan)">
                    Eliminar
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">💰</span>
                <p>No hay préstamos registrados.</p>
              </div>
            }
          </div>
        </section>
      </div>
    </main>

    @if (showPaymentModal()) {
      <div class="modal active" (click)="closePaymentModal($event)">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Registrar Pago Rápido</h3>
            <button class="modal-close" (click)="closePaymentModal()">×</button>
          </div>
          <form (ngSubmit)="submitPayment()">
            <div class="payment-info-box">
              <span>Saldo pendiente: </span>
              <strong>{{ formatCurrency(selectedLoanBalance()) }}</strong>
            </div>
            <div class="form-group">
              <label for="quick-amount">Monto del Pago</label>
              <input
                type="number"
                id="quick-amount"
                [(ngModel)]="paymentData.amount"
                name="amount"
                class="form-control"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div class="form-group">
              <label for="quick-date">Fecha</label>
              <input
                type="date"
                id="quick-date"
                [(ngModel)]="paymentData.date"
                name="date"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="quick-notes">Notas</label>
              <input
                type="text"
                id="quick-notes"
                [(ngModel)]="paymentData.notes"
                name="notes"
                class="form-control"
                placeholder="Opcional"
              />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closePaymentModal()">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">Registrar</button>
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
            <p>¿Eliminar este préstamo?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeConfirmModal()">
              Cancelar
            </button>
            <button type="button" class="btn btn-danger" (click)="deleteLoan()">Confirmar</button>
          </div>
        </div>
      </div>
    }

    @if (showHistoryModal()) {
      <div class="modal active" (click)="closeHistoryModal($event)">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3 class="modal-title">Historial de Pagos</h3>
            <button class="modal-close" (click)="closeHistoryModal()">×</button>
          </div>
          <div class="history-info">
            <span>Préstamo: </span>
            <strong>{{ formatCurrency(selectedLoan()?.amount || 0) }}</strong>
            <span> | Total: </span>
            <strong>{{ formatCurrency(getTotalAmount(selectedLoan()!)) }}</strong>
            <span> | Pagado: </span>
            <strong>{{ formatCurrency(getPaidAmount(selectedLoan()!)) }}</strong>
          </div>
          <div class="payments-list">
            @for (payment of loanPayments(); track payment.id) {
              <div class="payment-item">
                <div class="payment-date">{{ formatDate(payment.date) }}</div>
                <div class="payment-amount">{{ formatCurrency(payment.amount) }}</div>
                @if (payment.notes) {
                  <div class="payment-notes">{{ payment.notes }}</div>
                }
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>No hay pagos registrados.</p>
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
      .summary-cards {
        display: grid;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .summary-cards.grid-2 {
        grid-template-columns: repeat(2, 1fr);
      }
      .card {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
      .card-icon {
        font-size: 2rem;
        width: 60px;
        height: 60px;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card-red .card-icon {
        background: #fee2e2;
      }
      .card-amber .card-icon {
        background: #fef3c7;
      }
      .card-content {
        display: flex;
        flex-direction: column;
      }
      .card-label {
        font-size: 0.875rem;
        color: #666;
      }
      .card-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a2e;
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
      .calculator-preview {
        background: #f5f7fa;
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
      }
      .calc-title {
        font-weight: 600;
        color: #1a1a2e;
        margin-bottom: 1rem;
      }
      .calc-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
      .calc-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .calc-item.highlight {
        background: #eef2ff;
        padding: 0.75rem;
        border-radius: 0.5rem;
      }
      .calc-item.highlight-green {
        background: #dcfce7;
        padding: 0.75rem;
        border-radius: 0.5rem;
      }
      .calc-label {
        font-size: 0.75rem;
        color: #666;
      }
      .calc-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1a2e;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .filter-tabs {
        display: flex;
        gap: 0.5rem;
      }
      .filter-tab {
        padding: 0.5rem 1rem;
        background: #f3f4f6;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        color: #666;
        transition: all 0.3s;
      }
      .filter-tab.active {
        background: #667eea;
        color: white;
      }
      .loans-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .loan-card {
        background: #f9fafb;
        border-radius: 0.75rem;
        padding: 1.25rem;
        border: 1px solid #e5e7eb;
      }
      .loan-card.overdue {
        border-color: #fca5a5;
        background: #fef2f2;
      }
      .loan-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .loan-person {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1a2e;
      }
      .loan-amount {
        font-size: 1.25rem;
        font-weight: 700;
        color: #667eea;
      }
      .loan-details {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.5rem;
      }
      .loan-next-payment {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #fef3c7;
        border-radius: 0.5rem;
      }
      .next-payment-label {
        font-weight: 500;
        color: #92400e;
      }
      .next-payment-value {
        font-weight: 700;
        color: #b45309;
      }
      .next-payment-date {
        color: #78716c;
        margin-left: auto;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: #333;
        padding-top: 2rem;
        cursor: pointer;
      }
      .checkbox-label input {
        width: 1.25rem;
        height: 1.25rem;
        cursor: pointer;
      }
      .loan-progress {
        margin-bottom: 1rem;
      }
      .progress-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #666;
        margin-bottom: 0.5rem;
      }
      .progress-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s;
      }
      .loan-actions {
        display: flex;
        gap: 0.5rem;
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
      .payment-info-box {
        background: #f5f7fa;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
      }
      .history-info {
        background: #f5f7fa;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
      }
      .payments-list {
        max-height: 300px;
        overflow-y: auto;
      }
      .payment-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
      }
      .payment-item:last-child {
        border-bottom: none;
      }
      .payment-item > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .payment-date {
        font-size: 0.875rem;
        color: #666;
      }
      .payment-amount {
        font-weight: 600;
        color: #22c55e;
      }
      .payment-notes {
        font-size: 0.75rem;
        color: #999;
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
        .nav-links,
        .nav-hamburger {
          display: none;
        }
        .form-row {
          grid-template-columns: 1fr;
        }
        .summary-cards.grid-2 {
          grid-template-columns: 1fr;
        }
        .calc-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PrestamosComponent implements OnInit {
  formData = {
    personId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentFrequency: 'monthly' as PaymentFrequency,
    totalToCollect: 0,
    term: 0,
    notes: '',
  };

  paymentData = { amount: 0, date: new Date().toISOString().split('T')[0], notes: '' };
  currentFilter = signal('all');
  showPaymentModal = signal(false);
  showConfirmModal = signal(false);
  showHistoryModal = signal(false);
  selectedLoan = signal<Loan | null>(null);
  loanToDelete = signal<Loan | null>(null);
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

  loans = computed(() => {
    const uid = this.userId();
    return uid ? this.loanService.getLoansSignal(uid)() : [];
  });

  filteredLoans = computed(() => {
    const filter = this.currentFilter();
    const loans = this.loans();

    switch (filter) {
      case 'active':
        return loans.filter((loan) => !this.isLoanCompleted(loan));
      case 'overdue':
        return loans.filter((loan) => this.isOverdue(loan));
      case 'completed':
        return loans.filter((loan) => this.isLoanCompleted(loan));
      default:
        return loans;
    }
  });

  overdueCount = computed(() => {
    return this.loans().filter((loan) => this.isOverdue(loan)).length;
  });

  totalOverdueDays = computed(() => {
    return this.loans().reduce((sum, loan) => {
      if (this.isOverdue(loan)) {
        const l = new Loan(loan);
        return sum + l.getDaysOverdue();
      }
      return sum;
    }, 0);
  });

  preview = computed(() => {
    const amount = this.formData.amount || 0;
    const totalToCollect = this.formData.totalToCollect || 0;
    const term = this.formData.term || 0;
    const frequency = this.formData.paymentFrequency;

    const interestAmount = totalToCollect > amount ? totalToCollect - amount : 0;
    const payment =
      term > 0 && totalToCollect > 0
        ? LoanCalculator.calculatePaymentByFrequency(amount, 0, frequency, term)
        : 0;

    return { principal: amount, interest: interestAmount, total: totalToCollect, payment, interestRate: 0 };
  });

  selectedLoanBalance = computed(() => {
    const loan = this.selectedLoan();
    if (!loan) return 0;
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || loan.amount;
    return Math.max(0, total - totalPaid);
  });

  loanPayments = computed(() => {
    const loan = this.selectedLoan();
    if (!loan) return [];
    return this.paymentService
      .getByLoanId(loan.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  setFilter(filter: string): void {
    this.currentFilter.set(filter);
  }

  getPersonName(personId: string): string {
    return this.personService.getById(personId)?.name || 'Desconocido';
  }

  isOverdue(loan: Loan): boolean {
    return new Loan(loan).isOverdue();
  }

  isLoanCompleted(loan: Loan): boolean {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || loan.amount;
    return totalPaid >= total;
  }

  getPaidAmount(loan: Loan): number {
    return this.paymentService.getTotalPaidForLoan(loan.id);
  }

  getTotalAmount(loan: Loan): number {
    return loan.totalToCollect || loan.amount;
  }

  getProgressPercent(loan: Loan): number {
    const totalPaid = this.getPaidAmount(loan);
    const total = this.getTotalAmount(loan);
    if (total === 0) return 0;
    return Math.min(100, (totalPaid / total) * 100);
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }

  getFrequencyLabel(frequency?: PaymentFrequency): string {
    return LoanCalculator.getFrequencyLabel(frequency || 'monthly');
  }

  getNextPaymentAmount(loan: Loan): number {
    const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
    const total = loan.totalToCollect || loan.amount;
    const remaining = total - totalPaid;
    if (remaining <= 0) return 0;

    const payment =
      LoanCalculator.calculatePaymentByFrequency(
        loan.totalToCollect || loan.amount,
        0,
        loan.paymentFrequency,
        1,
      );
    return Math.min(payment, remaining);
  }

  getNextPaymentDate(loan: Loan): string {
    const payments = this.paymentService.getByLoanId(loan.id);
    const paymentsCount = payments.length;

    if (paymentsCount === 0) {
      return LoanCalculator.calculateNextPaymentDate(loan.date, loan.paymentFrequency, 1);
    }

    return LoanCalculator.calculateNextPaymentDate(
      loan.date,
      loan.paymentFrequency,
      paymentsCount + 1,
    );
  }

  onSubmit(): void {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;

      this.loanService.create({
        personId: this.formData.personId,
        amount: this.formData.amount,
        date: this.formData.date,
        paymentFrequency: this.formData.paymentFrequency,
        totalToCollect: this.formData.totalToCollect,
        notes: this.formData.notes,
        userId,
        trackingNotes: [],
      });

      this.showToast('Préstamo creado', 'success');
      this.formData = {
        personId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentFrequency: 'monthly',
        totalToCollect: 0,
        term: 0,
        notes: '',
      };
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  openPaymentModal(loan: Loan): void {
    this.selectedLoan.set(loan);
    const suggestedAmount = this.getNextPaymentAmount(loan);
    this.paymentData = {
      amount: suggestedAmount,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    };
    this.showPaymentModal.set(true);
  }

  closePaymentModal(event?: MouseEvent): void {
    if (event && !(event.target as HTMLElement).classList.contains('modal')) return;
    this.showPaymentModal.set(false);
    this.selectedLoan.set(null);
  }

  openHistoryModal(loan: Loan): void {
    this.selectedLoan.set(loan);
    this.showHistoryModal.set(true);
  }

  closeHistoryModal(event?: MouseEvent): void {
    if (event && !(event.target as HTMLElement).classList.contains('modal')) return;
    this.showHistoryModal.set(false);
    this.selectedLoan.set(null);
  }

  submitPayment(): void {
    const loan = this.selectedLoan();
    if (!loan) return;

    try {
      const userId = this.authService.getUserId();
      if (!userId) return;

      this.paymentService.create({
        loanId: loan.id,
        userId,
        amount: this.paymentData.amount,
        date: this.paymentData.date,
        notes: this.paymentData.notes,
      });

      this.showToast('Pago registrado', 'success');
      this.closePaymentModal();
    } catch (error: any) {
      this.showToast(error.message, 'error');
    }
  }

  confirmDelete(loan: Loan): void {
    this.loanToDelete.set(loan);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.loanToDelete.set(null);
  }

  deleteLoan(): void {
    const loan = this.loanToDelete();
    if (loan) {
      this.loanService.deleteCascade(loan.id);
      this.showToast('Préstamo eliminado', 'success');
    }
    this.closeConfirmModal();
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

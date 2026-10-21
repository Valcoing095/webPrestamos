import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoanService, LoanCalculator } from '../../core/services/loan.service';
import { MoraService, MoraAlert } from '../../core/services/mora.service';
import { PersonService } from '../../core/services/person.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Loan, Person, Payment, PaymentFrequency } from '../../core/models';

@Component({
  selector: 'app-mis-prestamos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
        <div class="min-w-0 bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm">
          <p class="truncate text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Total Prestado</p>
          <p class="amount text-base sm:text-xl xl:text-2xl font-bold text-slate-800 mt-2" [title]="formatCurrency(stats().totalLoaned)">{{ formatCurrency(stats().totalLoaned) }}</p>
        </div>
        <div class="min-w-0 bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm">
          <p class="truncate text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Cobrado</p>
          <p class="amount text-base sm:text-xl xl:text-2xl font-bold text-emerald-600 mt-2" [title]="formatCurrency(stats().totalCollected)">{{ formatCurrency(stats().totalCollected) }}</p>
        </div>
        <div class="min-w-0 bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm">
          <p class="truncate text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Pendiente</p>
          <p class="amount text-base sm:text-xl xl:text-2xl font-bold text-amber-600 mt-2" [title]="formatCurrency(stats().totalPending)">{{ formatCurrency(stats().totalPending) }}</p>
        </div>
        <div class="min-w-0 bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm">
          <p class="truncate text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Activos</p>
          <p class="amount text-base sm:text-xl xl:text-2xl font-bold text-slate-800 mt-2">{{ stats().activeCount }}</p>
        </div>
      </div>

      <!-- Filtros: cliente, texto y estado -->
      <div class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div class="relative flex-1">
            <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"/>
            </svg>
            <input
              type="text"
              class="w-full py-2.5 pl-10 pr-4 bg-slate-50 border-0 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all"
              placeholder="Buscar por cliente..."
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
            >
          </div>
          <select
            class="form-select !w-auto min-w-48 bg-slate-50 !border-0 text-sm"
            [ngModel]="filterPersonId()"
            (ngModelChange)="filterPersonId.set($event)"
            aria-label="Filtrar por cliente"
          >
            <option value="all">Todos los clientes</option>
            @for (person of clientsWithLoans(); track person.id) {
              <option [value]="person.id">{{ person.name }}</option>
            }
          </select>
          <select
            class="form-select !w-auto min-w-36 bg-slate-50 !border-0 text-sm"
            [ngModel]="filterStatus()"
            (ngModelChange)="filterStatus.set($event)"
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
          </select>
          @if (hasActiveFilters()) {
            <button class="btn btn-ghost btn-sm shrink-0" (click)="clearFilters()">Limpiar filtros</button>
          }
        </div>
        <p class="mt-3 text-xs text-slate-400">
          Mostrando <span class="font-semibold text-slate-600">{{ filteredLoans().length }}</span> de {{ loans().length }} préstamos
          @if (filterPersonId() !== 'all') {
            · Cliente: <span class="font-semibold text-brand-600">{{ selectedClientName() }}</span>
          }
        </p>
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
                <tr class="hover:bg-slate-50/50 transition-colors" [class.bg-brand-50/60]="selectedLoan()?.id === loan.id">
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
                      <span class="inline-flex whitespace-nowrap px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">Completado</span>
                    } @else if (moraByLoan().get(loan.id); as mora) {
                      @if (mora.isDueToday) {
                        <span class="inline-flex whitespace-nowrap px-2.5 py-1 text-xs font-semibold bg-sky-50 text-sky-700 rounded-full">Vence hoy</span>
                      } @else {
                        <span class="inline-flex whitespace-nowrap px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 rounded-full">En mora · {{ mora.daysOverdue }}d</span>
                      }
                    } @else {
                      <span class="inline-flex whitespace-nowrap px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">Activo</span>
                    }
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium transition-colors"
                        [class]="selectedLoan()?.id === loan.id ? 'bg-brand-600 text-white hover:bg-brand-700' : 'text-brand-600 hover:bg-brand-50'"
                        (click)="viewPaymentHistory(loan)"
                        title="Ver historial de pagos de esta deuda"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        Pagos · {{ getPaymentsCount(loan.id) }}
                      </button>
                      <button
                        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        (click)="editLoan(loan)"
                        title="Editar préstamo"
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
                  <td colspan="8" class="px-6 py-12 text-center">
                    <p class="text-sm font-medium text-slate-500">No se encontraron préstamos con esos filtros</p>
                    <p class="mt-1 text-xs text-slate-400">Prueba con otro cliente o limpia los filtros.</p>
                    @if (hasActiveFilters()) {
                      <button class="btn btn-outline btn-sm mt-4" (click)="clearFilters()">Limpiar filtros</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Historial de pagos de la deuda seleccionada -->
      @if (selectedLoan(); as loan) {
        <section id="historial-pagos" class="animate-fadeIn overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm" aria-label="Historial de pagos">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-brand-50/80 to-transparent px-5 py-4 sm:px-6">
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Historial de pagos</p>
              <h3 class="mt-0.5 truncate text-lg font-bold text-slate-900">{{ getPersonName(loan.personId) }}</h3>
              <p class="text-xs text-slate-500">
                Préstamo {{ loan.id.substring(0, 8).toUpperCase() }} · {{ formatDate(loan.date) }} · {{ getFrequencyLabel(loan.paymentFrequency) }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <a routerLink="/mis-pagos" class="btn btn-primary btn-sm">Registrar pago</a>
              <button class="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" (click)="closePaymentHistory()" aria-label="Cerrar historial">
                <span class="text-xl leading-none">×</span>
              </button>
            </div>
          </div>

          <!-- Resumen de la deuda -->
          <div class="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6 lg:grid-cols-4">
            <div class="rounded-xl bg-slate-50 p-3.5">
              <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400">Prestado</p>
              <p class="amount mt-1 text-base font-bold text-slate-800">{{ formatCurrency(loan.amount) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 p-3.5">
              <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total a cobrar</p>
              <p class="amount mt-1 text-base font-bold text-slate-800">{{ formatCurrency(loan.totalToCollect || loan.amount) }}</p>
            </div>
            <div class="rounded-xl bg-emerald-50 p-3.5">
              <p class="text-[11px] font-medium uppercase tracking-wider text-emerald-500">Pagado ({{ selectedLoanPayments().length }})</p>
              <p class="amount mt-1 text-base font-bold text-emerald-600">{{ formatCurrency(getTotalPaid(loan.id)) }}</p>
            </div>
            <div class="rounded-xl bg-amber-50 p-3.5">
              <p class="text-[11px] font-medium uppercase tracking-wider text-amber-500">Pendiente</p>
              <p class="amount mt-1 text-base font-bold text-amber-600">{{ formatCurrency(getPending(loan)) }}</p>
            </div>
          </div>
          @if (moraByLoan().get(loan.id); as mora) {
            <div class="px-5 sm:px-6">
              <p class="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium animate-fadeIn"
                 [class]="mora.isDueToday ? 'bg-sky-50 text-sky-700' : 'bg-red-50 text-red-700'">
                <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.94 4h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/></svg>
                @if (mora.isDueToday) {
                  El siguiente pago de esta deuda vence hoy ({{ formatDate(mora.nextDueDate) }}).
                } @else {
                  Esta deuda está en mora: {{ mora.daysOverdue }} día{{ mora.daysOverdue === 1 ? '' : 's' }} de atraso · {{ mora.missedPayments }} cuota(s) vencida(s) · debía pagar el {{ formatDate(mora.nextDueDate) }}.
                }
              </p>
            </div>
          }
          <div class="px-5 pt-3 sm:px-6">
            <div class="flex justify-between text-xs text-slate-400">
              <span>Progreso de la deuda</span>
              <span class="font-semibold text-slate-600">{{ loanProgress(loan) }}%</span>
            </div>
            <div class="progress mt-1.5"><div class="progress-bar" [style.width.%]="loanProgress(loan)"></div></div>
          </div>

          <!-- Pagos -->
          @if (selectedLoanPayments().length > 0) {
            <ol class="relative space-y-0 px-5 py-5 sm:px-6">
              @for (entry of selectedLoanPayments(); track entry.payment.id; let i = $index) {
                <li class="relative flex gap-4 pb-5 last:pb-0 animate-fadeIn" [style.animation-delay.ms]="i * 45">
                  <div class="flex flex-col items-center">
                    <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m5 13 4 4L19 7"/></svg>
                    </span>
                    @if (i < selectedLoanPayments().length - 1) {
                      <span class="mt-1 w-px flex-1 bg-slate-100"></span>
                    }
                  </div>
                  <div class="min-w-0 flex-1 rounded-xl border border-slate-100 px-4 py-3">
                    <div class="flex flex-wrap items-baseline justify-between gap-2">
                      <p class="text-sm font-bold text-emerald-600">+ {{ formatCurrency(entry.payment.amount) }}</p>
                      <p class="text-xs text-slate-400">{{ formatDate(entry.payment.date) }}</p>
                    </div>
                    <p class="mt-0.5 text-xs text-slate-500">
                      Saldo tras este pago: <span class="font-semibold text-slate-700">{{ formatCurrency(entry.balanceAfter) }}</span>
                    </p>
                    @if (entry.payment.notes) {
                      <p class="mt-1 truncate text-xs italic text-slate-400" [title]="entry.payment.notes">“{{ entry.payment.notes }}”</p>
                    }
                  </div>
                </li>
              }
            </ol>
          } @else {
            <div class="px-6 py-10 text-center">
              <p class="text-sm font-medium text-slate-500">Esta deuda aún no tiene pagos registrados</p>
              <p class="mt-1 text-xs text-slate-400">Cuando registres el primer abono aparecerá aquí, con su saldo.</p>
              <a routerLink="/mis-pagos" class="btn btn-primary btn-sm mt-4">Registrar el primer pago</a>
            </div>
          }
        </section>
      }
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
  private moraService = inject(MoraService);

  showModal = signal(false);
  showDeleteConfirm = signal(false);
  editingLoan = signal<Loan | null>(null);
  loanToDelete = signal<Loan | null>(null);

  // Filtros (signals para que la lista se actualice al instante)
  searchTerm = signal('');
  filterPersonId = signal('all');
  filterStatus = signal('all');

  // Deuda seleccionada para ver su historial de pagos
  selectedLoan = signal<Loan | null>(null);

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

  /** Clientes que tienen al menos un préstamo propio (para el filtro) */
  clientsWithLoans = computed(() => {
    const ids = new Set(this.loans().map(l => l.personId));
    return this.persons()
      .filter(p => ids.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  selectedClientName = computed(() => {
    const id = this.filterPersonId();
    return id === 'all' ? '' : (this.persons().find(p => p.id === id)?.name ?? '');
  });

  hasActiveFilters = computed(() =>
    this.searchTerm().trim() !== '' || this.filterPersonId() !== 'all' || this.filterStatus() !== 'all',
  );

  filteredLoans = computed(() => {
    let result = this.loans();

    const personId = this.filterPersonId();
    if (personId !== 'all') {
      result = result.filter(loan => loan.personId === personId);
    }

    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      result = result.filter(loan => {
        const person = this.personService.getById(loan.personId);
        return person?.name.toLowerCase().includes(term);
      });
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      result = result.filter(loan => {
        const isCompleted = this.isCompleted(loan);
        return status === 'completed' ? isCompleted : !isCompleted;
      });
    }

    return result;
  });

  /**
   * Pagos de la deuda seleccionada, del más reciente al más antiguo,
   * con el saldo que quedaba justo después de cada pago.
   */
  selectedLoanPayments = computed(() => {
    const loan = this.selectedLoan();
    if (!loan) return [] as { payment: Payment; balanceAfter: number }[];

    const total = loan.totalToCollect || loan.amount;
    const ascending = [...this.paymentService.getByLoanId(loan.id)].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let paidSoFar = 0;
    const withBalance = ascending.map(payment => {
      paidSoFar += payment.amount;
      return { payment, balanceAfter: Math.max(0, total - paidSoFar) };
    });
    return withBalance.reverse();
  });

  /** Alerta de mora por préstamo (clave: id del préstamo) */
  moraByLoan = computed(() => {
    const map = new Map<string, MoraAlert>();
    for (const loan of this.loans()) {
      const alert = this.moraService.getLoanAlert(loan);
      if (alert) map.set(loan.id, alert);
    }
    return map;
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

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterPersonId.set('all');
    this.filterStatus.set('all');
  }

  getPaymentsCount(loanId: string): number {
    return this.paymentService.getByLoanId(loanId).length;
  }

  loanProgress(loan: Loan): number {
    const total = loan.totalToCollect || loan.amount;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.getTotalPaid(loan.id) / total) * 100));
  }

  viewPaymentHistory(loan: Loan): void {
    if (this.selectedLoan()?.id === loan.id) {
      this.selectedLoan.set(null);
      return;
    }
    this.selectedLoan.set(loan);
    // Llevar la vista hasta el historial recién abierto
    setTimeout(() => {
      document.getElementById('historial-pagos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  closePaymentHistory(): void {
    this.selectedLoan.set(null);
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
      if (this.selectedLoan()?.id === loan.id) {
        this.selectedLoan.set(null);
      }
    }
    this.showDeleteConfirm.set(false);
    this.loanToDelete.set(null);
  }
}

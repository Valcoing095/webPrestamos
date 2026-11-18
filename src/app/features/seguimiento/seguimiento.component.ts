import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { LoanService, LoanCalculator } from '../../core/services/loan.service';
import { PersonService } from '../../core/services/person.service';
import { LenderService } from '../../core/services/lender.service';
import { RouteService } from '../../core/services/route.service';
import { MoraService } from '../../core/services/mora.service';
import { ReportService } from '../../core/services/report.service';
import { DashboardSummary, FollowUpItem, TrackingNote } from '../../core/models';
import { apiErrorMessage } from '../../core/api/api-error';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  // Chart.js solo se carga con esta ruta (lazy), no en el bundle inicial
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Seguimiento y Analiticas</h1>
        <p class="text-muted mb-0">Dashboard avanzado con metricas clave</p>
      </header>

      @if (error()) {
        <div class="alert alert-danger mb-3" role="alert">{{ error() }}</div>
      }

      <!-- Filtros -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-2 g-md-3 align-items-end">
            <div class="col-12 col-sm-6 col-md-3">
              <label for="filter-start" class="form-label small">Fecha Inicio</label>
              <input type="date" id="filter-start" [(ngModel)]="filterStartDate" name="startDate" class="form-control form-control-sm" />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <label for="filter-end" class="form-label small">Fecha Fin</label>
              <input type="date" id="filter-end" [(ngModel)]="filterEndDate" name="endDate" class="form-control form-control-sm" />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <label for="filter-lender" class="form-label small">Prestamista</label>
              <select id="filter-lender" [(ngModel)]="filterLenderId" name="lenderId" class="form-select form-select-sm">
                <option value="">Todos</option>
                @for (lender of lenders(); track lender.id) {
                  <option [value]="lender.id">{{ lender.name }}</option>
                }
              </select>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <label for="filter-route" class="form-label small">Ruta</label>
              <select id="filter-route" [(ngModel)]="filterRouteId" name="routeId" class="form-select form-select-sm">
                <option value="">Todas</option>
                @for (route of routes(); track route.id) {
                  <option [value]="route.id">{{ route.name }}</option>
                }
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="row g-2 g-md-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 rounded-circle bg-danger bg-opacity-10 p-2 p-md-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-danger"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="ms-2 ms-md-3">
                  <p class="text-muted mb-0" style="font-size: 0.65rem;">Mora Total</p>
                  <h6 class="amount mb-0 h6 h5-md">{{ formatCurrency(totalMora()) }}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 rounded-circle bg-success bg-opacity-10 p-2 p-md-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div class="ms-2 ms-md-3">
                  <p class="text-muted mb-0" style="font-size: 0.65rem;">Cobrado del total</p>
                  <h6 class="mb-0 h6 h5-md">{{ collectPercentage() }}%</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 rounded-circle bg-primary bg-opacity-10 p-2 p-md-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div class="ms-2 ms-md-3">
                  <p class="text-muted mb-0" style="font-size: 0.65rem;">Clientes Activos</p>
                  <h6 class="mb-0 h6 h5-md">{{ clientesActivos() }}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 rounded-circle bg-warning bg-opacity-10 p-2 p-md-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-warning"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                </div>
                <div class="ms-2 ms-md-3">
                  <p class="text-muted mb-0" style="font-size: 0.65rem;">Clientes Morosos</p>
                  <h6 class="mb-0 h6 h5-md">{{ clientesMorosos() }}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Graficas -->
      <div class="row g-4 mb-4">
        <!-- Rendimiento por Prestamista -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent">
              <h6 class="card-title mb-0">Rendimiento por Prestamista</h6>
            </div>
            <div class="card-body">
              @if (isBrowser) {
                <canvas baseChart
                  [data]="lenderChartData()"
                  [type]="'bar'"
                  [options]="barChartOptions">
                </canvas>
              }
            </div>
          </div>
        </div>

        <!-- Prestamos por Ruta -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-transparent">
              <h6 class="card-title mb-0">Prestamos por Ruta</h6>
            </div>
            <div class="card-body">
              @if (isBrowser) {
                <canvas baseChart
                  [data]="routeChartData()"
                  [type]="'doughnut'"
                  [options]="doughnutChartOptions">
                </canvas>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Resumen por Ruta -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent">
          <h6 class="card-title mb-0">Resumen por Ruta</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 table-sm align-middle">
              <thead class="table-light">
                <tr>
                  <th class="px-3">Ruta</th>
                  <th>Clientes</th>
                  <th>Activos</th>
                  <th class="d-none d-sm-table-cell">Monto Total</th>
                  <th>Cobrado</th>
                  <th class="d-none d-sm-table-cell">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                @for (summary of routeSummaries(); track summary.routeId) {
                  <tr>
                    <td class="px-3 fw-medium small">{{ summary.routeName }}</td>
                    <td><small>{{ summary.clientCount }}</small></td>
                    <td><small>{{ summary.activeLoans }}</small></td>
                    <td class="d-none d-sm-table-cell"><small>{{ formatCurrency(summary.totalAmount) }}</small></td>
                    <td class="text-success"><small>{{ formatCurrency(summary.collected) }}</small></td>
                    <td class="text-warning d-none d-sm-table-cell"><small>{{ formatCurrency(summary.pending) }}</small></td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center text-muted py-4">{{ loading() ? 'Cargando datos…' : 'No hay datos disponibles' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Seguimiento por préstamo: avance y notas -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-transparent">
          <h6 class="card-title mb-0">Avance por préstamo</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 table-sm align-middle">
              <thead class="table-light">
                <tr>
                  <th class="px-3">Cliente</th>
                  <th>Estado</th>
                  <th class="d-none d-sm-table-cell">Total</th>
                  <th>Cobrado</th>
                  <th style="min-width: 110px;">Avance</th>
                  <th class="d-none d-sm-table-cell">Último pago</th>
                  <th class="text-right">Notas</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filteredFollowUp(); track item.loanId) {
                  <tr>
                    <td class="px-3 fw-medium small">{{ personName(item.personId) }}</td>
                    <td><span class="badge" [class]="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td>
                    <td class="d-none d-sm-table-cell"><small>{{ formatCurrency(item.totalToCollect) }}</small></td>
                    <td class="text-success"><small>{{ formatCurrency(item.paid) }}</small></td>
                    <td>
                      <div class="progress"><div class="progress-bar" [style.width.%]="item.progress"></div></div>
                      <small class="text-muted">{{ item.progress }}%</small>
                    </td>
                    <td class="d-none d-sm-table-cell"><small>{{ item.lastPaymentDate ? formatDate(item.lastPaymentDate) : 'Sin pagos' }}</small></td>
                    <td class="text-right">
                      <button class="btn btn-sm btn-outline-primary" (click)="openNotes(item)">Ver notas</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center text-muted py-4">{{ loading() ? 'Cargando datos…' : 'No hay préstamos para mostrar' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Notas de seguimiento del préstamo seleccionado -->
      @if (notesLoan(); as nl) {
        <div class="modal-backdrop"></div>
        <div class="modal" (click)="closeNotes()">
          <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Notas · {{ personName(nl.personId) }}</h5>
                <button type="button" class="btn-close" (click)="closeNotes()"></button>
              </div>
              <div class="modal-body">
                <div class="d-flex gap-2 mb-3">
                  <input class="form-control form-control-sm" placeholder="Escribe una nota de seguimiento" maxlength="2000"
                         [(ngModel)]="newNote" (keyup.enter)="addNote()" />
                  <button class="btn btn-primary btn-sm" (click)="addNote()" [disabled]="savingNote()">
                    {{ savingNote() ? 'Guardando…' : 'Agregar' }}
                  </button>
                </div>
                @if (notesError()) {
                  <div class="alert alert-danger py-2 small" role="alert">{{ notesError() }}</div>
                }
                @if (notesLoading()) {
                  <p class="text-muted small mb-0">Cargando notas…</p>
                } @else {
                  @for (note of notes(); track note.id) {
                    <div class="d-flex justify-content-between align-items-start gap-3 py-2 border-b" style="border-color: var(--line);">
                      <div>
                        <p class="mb-0 small">{{ note.text }}</p>
                        <small class="text-muted">{{ formatDate(note.createdAt) }}</small>
                      </div>
                      <button class="btn btn-sm btn-outline-danger" (click)="removeNote(note)">Eliminar</button>
                    </div>
                  } @empty {
                    <p class="text-muted small mb-0">Este préstamo aún no tiene notas.</p>
                  }
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    canvas { max-height: 300px; }
  `],
})
export class SeguimientoComponent implements OnInit {
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  filterStartDate = '';
  filterEndDate = '';
  filterLenderId = '';
  filterRouteId = '';

  private loanService = inject(LoanService);
  private personService = inject(PersonService);
  private lenderService = inject(LenderService);
  private routeService = inject(RouteService);
  private moraService = inject(MoraService);
  private reportService = inject(ReportService);

  // Datos calculados por el backend (/reports/dashboard y /reports/follow-up)
  dashboard = signal<DashboardSummary | null>(null);
  followUp = signal<FollowUpItem[]>([]);
  loading = signal(false);
  error = signal('');

  // Notas de seguimiento (recurso /loans/:id/notes)
  notesLoan = signal<FollowUpItem | null>(null);
  notes = signal<TrackingNote[]>([]);
  notesLoading = signal(false);
  notesError = signal('');
  savingNote = signal(false);
  newNote = '';

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  ngOnInit(): void {
    this.loadReports();
    this.moraService.load().subscribe();
  }

  loadReports(): void {
    this.loading.set(true);
    this.error.set('');
    this.reportService.dashboard().subscribe({
      next: (d) => this.dashboard.set(d),
      error: (err) => this.error.set(apiErrorMessage(err, 'No se pudo cargar el resumen')),
    });
    this.reportService.followUp().subscribe({
      next: (items) => {
        this.followUp.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'No se pudo cargar el seguimiento'));
      },
    });
  }

  lenders = this.lenderService.getDataSignal();
  routes = this.routeService.getDataSignal();

  /** Seguimiento filtrado por prestamista, ruta y fecha del préstamo */
  filteredFollowUp = computed(() => {
    return this.followUp().filter((item) => {
      const loan = this.loanService.getById(item.loanId);
      if (this.filterLenderId && item.lenderId !== this.filterLenderId) return false;
      if (this.filterRouteId && loan?.routeId !== this.filterRouteId) return false;
      if (this.filterStartDate && loan && loan.date < this.filterStartDate) return false;
      if (this.filterEndDate && loan && loan.date > this.filterEndDate) return false;
      return true;
    });
  });

  // KPIs (mora y porcentaje cobrado vienen del backend)
  totalMora = computed(() => this.moraService.overdueAlerts().reduce((sum, a) => sum + a.pendingAmount, 0));

  collectPercentage = computed(() => Math.round(this.dashboard()?.collectPercentage ?? 0));

  clientesActivos = computed(
    () => new Set(this.filteredFollowUp().filter((i) => i.status !== 'completed').map((i) => i.personId)).size,
  );

  clientesMorosos = computed(() => new Set(this.moraService.overdueAlerts().map((a) => a.personId)).size);

  // Chart Data
  lenderChartData = computed((): ChartData<'bar'> => {
    const items = this.filteredFollowUp();
    const lenderData = this.lenders().map((lender) => ({
      name: lender.name,
      amount: items.filter((i) => i.lenderId === lender.id).reduce((sum, i) => sum + i.amount, 0),
    }));

    return {
      labels: lenderData.map(d => d.name),
      datasets: [{
        data: lenderData.map(d => d.amount),
        backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d'],
        borderRadius: 4
      }]
    };
  });

  private itemsByRoute(routeId: string): FollowUpItem[] {
    return this.filteredFollowUp().filter((i) => this.loanService.getById(i.loanId)?.routeId === routeId);
  }

  routeChartData = computed((): ChartData<'doughnut'> => {
    const routeData = this.routes().map((route) => ({
      name: route.name,
      count: this.itemsByRoute(route.id).length,
    }));

    return {
      labels: routeData.map(d => d.name),
      datasets: [{
        data: routeData.map(d => d.count),
        backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#17a2b8', '#6c757d']
      }]
    };
  });

  routeSummaries = computed(() => {
    return this.routes().map((route) => {
      const items = this.itemsByRoute(route.id);
      return {
        routeId: route.id,
        routeName: route.name,
        clientCount: new Set(items.map((i) => i.personId)).size,
        activeLoans: items.filter((i) => i.status !== 'completed').length,
        totalAmount: items.reduce((sum, i) => sum + i.totalToCollect, 0),
        collected: items.reduce((sum, i) => sum + i.paid, 0),
        pending: items.reduce((sum, i) => sum + i.pending, 0),
      };
    });
  });

  personName(personId: string): string {
    return this.personService.getById(personId)?.name || 'Desconocido';
  }

  statusLabel(status: FollowUpItem['status']): string {
    return status === 'completed' ? 'Pagado' : status === 'overdue' ? 'En mora' : 'Activo';
  }

  statusClass(status: FollowUpItem['status']): string {
    return status === 'completed' ? 'badge-success' : status === 'overdue' ? 'badge-danger' : 'badge-primary';
  }

  // --- Notas ---

  openNotes(item: FollowUpItem): void {
    this.notesLoan.set(item);
    this.notes.set([]);
    this.notesError.set('');
    this.newNote = '';
    this.notesLoading.set(true);
    this.loanService.getNotes(item.loanId).subscribe({
      next: (list) => {
        this.notes.set(list);
        this.notesLoading.set(false);
      },
      error: (err) => {
        this.notesLoading.set(false);
        this.notesError.set(apiErrorMessage(err, 'No se pudieron cargar las notas'));
      },
    });
  }

  closeNotes(): void {
    this.notesLoan.set(null);
  }

  addNote(): void {
    const loan = this.notesLoan();
    const text = this.newNote.trim();
    if (!loan || this.savingNote()) return;
    if (!text) {
      this.notesError.set('Escribe el texto de la nota');
      return;
    }
    this.notesError.set('');
    this.savingNote.set(true);
    this.loanService.addNote(loan.loanId, text).subscribe({
      next: (note) => {
        this.notes.update((list) => [note, ...list]);
        this.newNote = '';
        this.savingNote.set(false);
      },
      error: (err) => {
        this.savingNote.set(false);
        this.notesError.set(apiErrorMessage(err, 'No se pudo guardar la nota'));
      },
    });
  }

  removeNote(note: TrackingNote): void {
    const loan = this.notesLoan();
    if (!loan) return;
    this.loanService.deleteNote(loan.loanId, note.id).subscribe({
      next: () => this.notes.update((list) => list.filter((n) => n.id !== note.id)),
      error: (err) => this.notesError.set(apiErrorMessage(err, 'No se pudo eliminar la nota')),
    });
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }
}

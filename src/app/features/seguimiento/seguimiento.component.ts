import { Component, OnInit, signal, computed, PLATFORM_ID, Inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { LoanService, LoanCalculator } from '../../core/services/loan.service';
import { PaymentService } from '../../core/services/payment.service';
import { PersonService } from '../../core/services/person.service';
import { LenderService } from '../../core/services/lender.service';
import { RouteService } from '../../core/services/route.service';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
    <div class="container-fluid px-4 py-4">
      <header class="mb-4">
        <h1 class="h3 mb-1">Seguimiento y Analiticas</h1>
        <p class="text-muted mb-0">Dashboard avanzado con metricas clave</p>
      </header>

      <!-- Filtros -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label for="filter-start" class="form-label">Fecha Inicio</label>
              <input type="date" id="filter-start" [(ngModel)]="filterStartDate" name="startDate" class="form-control" />
            </div>
            <div class="col-md-3">
              <label for="filter-end" class="form-label">Fecha Fin</label>
              <input type="date" id="filter-end" [(ngModel)]="filterEndDate" name="endDate" class="form-control" />
            </div>
            <div class="col-md-3">
              <label for="filter-lender" class="form-label">Prestamista</label>
              <select id="filter-lender" [(ngModel)]="filterLenderId" name="lenderId" class="form-select">
                <option value="">Todos</option>
                @for (lender of lenders(); track lender.id) {
                  <option [value]="lender.id">{{ lender.name }}</option>
                }
              </select>
            </div>
            <div class="col-md-3">
              <label for="filter-route" class="form-label">Ruta</label>
              <select id="filter-route" [(ngModel)]="filterRouteId" name="routeId" class="form-select">
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
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 rounded-circle bg-danger bg-opacity-10 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-danger"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0 small">Mora Total</p>
                  <h4 class="mb-0">{{ formatCurrency(totalMora()) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 rounded-circle bg-success bg-opacity-10 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0 small">Rentabilidad</p>
                  <h4 class="mb-0">{{ rentabilidad() }}%</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 rounded-circle bg-primary bg-opacity-10 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0 small">Clientes Activos</p>
                  <h4 class="mb-0">{{ clientesActivos() }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 rounded-circle bg-warning bg-opacity-10 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-warning"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-0 small">Clientes Morosos</p>
                  <h4 class="mb-0">{{ clientesMorosos() }}</h4>
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
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="px-3">Ruta</th>
                  <th>Clientes</th>
                  <th>Prestamos Activos</th>
                  <th>Monto Total</th>
                  <th>Cobrado</th>
                  <th>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                @for (summary of routeSummaries(); track summary.routeId) {
                  <tr>
                    <td class="px-3 fw-medium">{{ summary.routeName }}</td>
                    <td>{{ summary.clientCount }}</td>
                    <td>{{ summary.activeLoans }}</td>
                    <td>{{ formatCurrency(summary.totalAmount) }}</td>
                    <td class="text-success">{{ formatCurrency(summary.collected) }}</td>
                    <td class="text-warning">{{ formatCurrency(summary.pending) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center text-muted py-4">No hay datos disponibles</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    canvas { max-height: 300px; }
  `],
})
export class SeguimientoComponent implements OnInit {
  isBrowser: boolean;
  filterStartDate = '';
  filterEndDate = '';
  filterLenderId = '';
  filterRouteId = '';

  private authService: AuthService;
  private loanService: LoanService;
  private paymentService: PaymentService;
  private personService: PersonService;
  private lenderService: LenderService;
  private routeService: RouteService;

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

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    authService: AuthService,
    loanService: LoanService,
    paymentService: PaymentService,
    personService: PersonService,
    lenderService: LenderService,
    routeService: RouteService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.authService = authService;
    this.loanService = loanService;
    this.paymentService = paymentService;
    this.personService = personService;
    this.lenderService = lenderService;
    this.routeService = routeService;
  }

  ngOnInit(): void {
    this.loanService.setPaymentService(this.paymentService);
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.filterEndDate = today.toISOString().split('T')[0];
    this.filterStartDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  private userId = computed(() => this.authService.getUserId());

  lenders = computed(() => {
    const uid = this.authService.getUserId();
    return uid ? this.lenderService.getByUserId(uid) : [];
  });

  routes = computed(() => {
    const uid = this.authService.getUserId();
    return uid ? this.routeService.getByUserId(uid) : [];
  });

  loans = computed(() => {
    const uid = this.authService.getUserId();
    return uid ? this.loanService.getByUserId(uid) : [];
  });

  payments = computed(() => {
    const uid = this.authService.getUserId();
    return uid ? this.paymentService.getByUserId(uid) : [];
  });

  persons = computed(() => {
    const uid = this.authService.getUserId();
    return uid ? this.personService.getByUserId(uid) : [];
  });

  // KPIs
  totalMora = computed(() => {
    const loansData = this.loans();
    let mora = 0;
    loansData.forEach((loan: any) => {
      const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
      const total = loan.totalToCollect || loan.amount;
      const pending = total - totalPaid;
      if (pending > 0 && loan.status === 'overdue') {
        mora += pending;
      }
    });
    return mora;
  });

  rentabilidad = computed(() => {
    const loansData = this.loans();
    if (loansData.length === 0) return 0;
    
    const totalLoaned = loansData.reduce((sum: number, l: any) => sum + l.amount, 0);
    const totalToCollect = loansData.reduce((sum: number, l: any) => sum + (l.totalToCollect || l.amount), 0);
    const totalCollected = this.payments().reduce((sum: number, p: any) => sum + p.amount, 0);
    
    if (totalLoaned === 0) return 0;
    const profit = totalCollected - totalLoaned;
    return Math.round((profit / totalLoaned) * 100);
  });

  clientesActivos = computed(() => {
    const activeLoans = this.loans().filter((loan: any) => {
      const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
      const total = loan.totalToCollect || loan.amount;
      return totalPaid < total;
    });
    const uniquePersonIds = new Set(activeLoans.map((l: any) => l.personId));
    return uniquePersonIds.size;
  });

  clientesMorosos = computed(() => {
    const overdueLoans = this.loans().filter((loan: any) => loan.status === 'overdue');
    const uniquePersonIds = new Set(overdueLoans.map((l: any) => l.personId));
    return uniquePersonIds.size;
  });

  // Chart Data
  lenderChartData = computed((): ChartData<'bar'> => {
    const lenderData = this.lenders().map((lender: any) => {
      const loansData = this.loans().filter((l: any) => l.lenderId === lender.id);
      const totalLoaned = loansData.reduce((sum: number, l: any) => sum + l.amount, 0);
      return {
        name: lender.name,
        amount: totalLoaned
      };
    });

    return {
      labels: lenderData.map(d => d.name),
      datasets: [{
        data: lenderData.map(d => d.amount),
        backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d'],
        borderRadius: 4
      }]
    };
  });

  routeChartData = computed((): ChartData<'doughnut'> => {
    const routeData = this.routes().map((route: any) => {
      const clients = this.persons().filter((p: any) => p.routeId === route.id);
      const clientIds = clients.map((c: any) => c.id);
      const loansData = this.loans().filter((l: any) => clientIds.includes(l.personId));
      return {
        name: route.name,
        count: loansData.length
      };
    });

    return {
      labels: routeData.map(d => d.name),
      datasets: [{
        data: routeData.map(d => d.count),
        backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#17a2b8', '#6c757d']
      }]
    };
  });

  routeSummaries = computed(() => {
    return this.routes().map((route: any) => {
      const clients = this.persons().filter((p: any) => p.routeId === route.id);
      const clientIds = clients.map((c: any) => c.id);
      const loansData = this.loans().filter((l: any) => clientIds.includes(l.personId));
      
      const activeLoans = loansData.filter((loan: any) => {
        const totalPaid = this.paymentService.getTotalPaidForLoan(loan.id);
        const total = loan.totalToCollect || loan.amount;
        return totalPaid < total;
      });

      const totalAmount = loansData.reduce((sum: number, l: any) => sum + (l.totalToCollect || l.amount), 0);
      const collected = loansData.reduce((sum: number, l: any) => sum + this.paymentService.getTotalPaidForLoan(l.id), 0);

      return {
        routeId: route.id,
        routeName: route.name,
        clientCount: clients.length,
        activeLoans: activeLoans.length,
        totalAmount,
        collected,
        pending: totalAmount - collected
      };
    });
  });

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }
}

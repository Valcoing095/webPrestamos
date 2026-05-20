import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService, LoanCalculator } from '../../core/services/loan.service';
import { PaymentService } from '../../core/services/payment.service';
import { LenderService } from '../../core/services/lender.service';
import { RouteService } from '../../core/services/route.service';
import { AuthService } from '../../core/services/auth.service';
import { Lender } from '../../core/models';

interface LenderSettlement {
  lender: Lender;
  routeName: string;
  totalLoaned: number;
  totalToCollect: number;
  totalCollected: number;
  totalPending: number;
  activeLoans: number;
  completedLoans: number;
  commission: number;
  netForOwner: number;
}

@Component({
  selector: 'app-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Liquidacion por Prestamista</h2>
          <p class="text-muted mb-0">Resumen de cobranza y comisiones</p>
        </div>
        <div class="d-flex gap-2">
          <input 
            type="date" 
            class="form-control form-control-sm" 
            [(ngModel)]="startDate"
            style="width: 150px;"
          >
          <span class="align-self-center">a</span>
          <input 
            type="date" 
            class="form-control form-control-sm" 
            [(ngModel)]="endDate"
            style="width: 150px;"
          >
          <button class="btn btn-sm btn-outline-primary" (click)="applyDateFilter()">
            Filtrar
          </button>
        </div>
      </div>

      <!-- Global Summary -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-primary text-white">
            <div class="card-body">
              <h6 class="mb-1 opacity-75">Total Prestado</h6>
              <h3 class="mb-0">{{ formatCurrency(globalStats().totalLoaned) }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-success text-white">
            <div class="card-body">
              <h6 class="mb-1 opacity-75">Total Cobrado</h6>
              <h3 class="mb-0">{{ formatCurrency(globalStats().totalCollected) }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-warning text-dark">
            <div class="card-body">
              <h6 class="mb-1 opacity-75">Comisiones</h6>
              <h3 class="mb-0">{{ formatCurrency(globalStats().totalCommission) }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-info text-white">
            <div class="card-body">
              <h6 class="mb-1 opacity-75">Neto para Ti</h6>
              <h3 class="mb-0">{{ formatCurrency(globalStats().netForOwner) }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Settlement by Lender -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom">
          <h5 class="mb-0">Detalle por Prestamista</h5>
        </div>
        <div class="card-body p-0">
          @for (settlement of settlements(); track settlement.lender.id) {
            <div class="border-bottom p-4">
              <div class="row align-items-center">
                <div class="col-md-3">
                  <h5 class="mb-1">{{ settlement.lender.name }}</h5>
                  <span class="badge bg-secondary">{{ settlement.routeName }}</span>
                  <p class="text-muted mb-0 small mt-1">
                    Comision: {{ settlement.lender.commissionPercentage }}%
                  </p>
                </div>
                <div class="col-md-9">
                  <div class="row g-3">
                    <div class="col-6 col-md-2">
                      <div class="text-muted small">Prestado</div>
                      <div class="fw-medium">{{ formatCurrency(settlement.totalLoaned) }}</div>
                    </div>
                    <div class="col-6 col-md-2">
                      <div class="text-muted small">A Cobrar</div>
                      <div class="fw-medium">{{ formatCurrency(settlement.totalToCollect) }}</div>
                    </div>
                    <div class="col-6 col-md-2">
                      <div class="text-muted small">Cobrado</div>
                      <div class="fw-medium text-success">{{ formatCurrency(settlement.totalCollected) }}</div>
                    </div>
                    <div class="col-6 col-md-2">
                      <div class="text-muted small">Pendiente</div>
                      <div class="fw-medium text-warning">{{ formatCurrency(settlement.totalPending) }}</div>
                    </div>
                    <div class="col-6 col-md-2">
                      <div class="text-muted small">Su Comision</div>
                      <div class="fw-medium text-danger">{{ formatCurrency(settlement.commission) }}</div>
                    </div>
                    <div class="col-6 col-md-2">
                      <div class="text-muted small">Para Ti</div>
                      <div class="fw-bold text-primary">{{ formatCurrency(settlement.netForOwner) }}</div>
                    </div>
                  </div>
                  <div class="mt-2">
                    <span class="badge bg-primary me-1">{{ settlement.activeLoans }} activos</span>
                    <span class="badge bg-success">{{ settlement.completedLoans }} completados</span>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-5 text-muted">
              <p>No hay prestamistas con prestamos asignados</p>
            </div>
          }
        </div>
      </div>

      <!-- Detailed Table -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Movimientos del Periodo</h5>
          <select class="form-select form-select-sm" style="width: auto;" [(ngModel)]="selectedLenderForDetails">
            <option value="">Todos los prestamistas</option>
            @for (lender of lenders(); track lender.id) {
              <option [value]="lender.id">{{ lender.name }}</option>
            }
          </select>
        </div>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Prestamista</th>
                <th>Tipo</th>
                <th>Descripcion</th>
                <th class="text-end">Monto</th>
              </tr>
            </thead>
            <tbody>
              @for (movement of filteredMovements(); track movement.id) {
                <tr>
                  <td>{{ formatDate(movement.date) }}</td>
                  <td>{{ movement.lenderName }}</td>
                  <td>
                    @if (movement.type === 'loan') {
                      <span class="badge bg-primary">Prestamo</span>
                    } @else {
                      <span class="badge bg-success">Pago</span>
                    }
                  </td>
                  <td>{{ movement.description }}</td>
                  <td class="text-end" [class.text-danger]="movement.type === 'loan'" [class.text-success]="movement.type === 'payment'">
                    {{ movement.type === 'loan' ? '-' : '+' }}{{ formatCurrency(movement.amount) }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center py-3 text-muted">Sin movimientos en el periodo</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table th { font-weight: 600; font-size: 0.8rem; }
    .table td { font-size: 0.9rem; }
  `]
})
export class LiquidacionComponent {
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private lenderService = inject(LenderService);
  private routeService = inject(RouteService);
  private authService = inject(AuthService);

  startDate = this.getFirstDayOfMonth();
  endDate = new Date().toISOString().split('T')[0];
  dateFilterApplied = signal(false);
  selectedLenderForDetails = '';

  lenders = computed(() => {
    const userId = this.authService.getUserId();
    if (!userId) return [];
    return this.lenderService.getByUserId(userId);
  });

  settlements = computed(() => {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    return this.lenders().map(lender => {
      const loans = this.loanService.getByLenderId(lender.id);
      
      let filteredPayments: { loanId: string; amount: number; date: string }[] = [];
      loans.forEach(loan => {
        const payments = this.paymentService.getByLoanId(loan.id);
        payments.forEach(p => {
          if (this.isInDateRange(p.date)) {
            filteredPayments.push({ loanId: loan.id, amount: p.amount, date: p.date });
          }
        });
      });

      const totalLoaned = loans.reduce((sum, l) => sum + l.amount, 0);
      const totalToCollect = loans.reduce((sum, l) => sum + (l.totalToCollect || l.amount), 0);
      const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Calcular pendiente total (no solo del periodo)
      const allPayments = loans.flatMap(loan => this.paymentService.getByLoanId(loan.id));
      const totalPaidAllTime = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPending = Math.max(0, totalToCollect - totalPaidAllTime);

      const commission = (totalCollected * lender.commissionPercentage) / 100;
      const netForOwner = totalCollected - commission;

      // Contar prestamos activos y completados
      const paidByLoan = new Map<string, number>();
      allPayments.forEach(p => {
        paidByLoan.set(p.loanId, (paidByLoan.get(p.loanId) || 0) + p.amount);
      });

      let activeLoans = 0;
      let completedLoans = 0;
      loans.forEach(loan => {
        const paid = paidByLoan.get(loan.id) || 0;
        const total = loan.totalToCollect || loan.amount;
        if (paid >= total) {
          completedLoans++;
        } else {
          activeLoans++;
        }
      });

      const route = lender.routeId ? this.routeService.getById(lender.routeId) : null;

      return {
        lender,
        routeName: route?.name || 'Sin ruta',
        totalLoaned,
        totalToCollect,
        totalCollected,
        totalPending,
        activeLoans,
        completedLoans,
        commission,
        netForOwner
      } as LenderSettlement;
    }).filter(s => s.totalLoaned > 0 || s.totalCollected > 0);
  });

  globalStats = computed(() => {
    const settlements = this.settlements();
    return {
      totalLoaned: settlements.reduce((sum, s) => sum + s.totalLoaned, 0),
      totalCollected: settlements.reduce((sum, s) => sum + s.totalCollected, 0),
      totalPending: settlements.reduce((sum, s) => sum + s.totalPending, 0),
      totalCommission: settlements.reduce((sum, s) => sum + s.commission, 0),
      netForOwner: settlements.reduce((sum, s) => sum + s.netForOwner, 0)
    };
  });

  movements = computed(() => {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const result: Array<{
      id: string;
      date: string;
      type: 'loan' | 'payment';
      lenderId: string;
      lenderName: string;
      description: string;
      amount: number;
    }> = [];

    const loans = this.loanService.getLenderLoans(userId);

    loans.forEach(loan => {
      const lender = loan.lenderId ? this.lenderService.getById(loan.lenderId) : null;
      
      if (this.isInDateRange(loan.date)) {
        result.push({
          id: `loan-${loan.id}`,
          date: loan.date,
          type: 'loan',
          lenderId: loan.lenderId || '',
          lenderName: lender?.name || 'Desconocido',
          description: `Prestamo otorgado`,
          amount: loan.amount
        });
      }

      const payments = this.paymentService.getByLoanId(loan.id);
      payments.forEach(payment => {
        if (this.isInDateRange(payment.date)) {
          result.push({
            id: `payment-${payment.id}`,
            date: payment.date,
            type: 'payment',
            lenderId: loan.lenderId || '',
            lenderName: lender?.name || 'Desconocido',
            description: `Pago recibido`,
            amount: payment.amount
          });
        }
      });
    });

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  filteredMovements = computed(() => {
    let result = this.movements();
    if (this.selectedLenderForDetails) {
      result = result.filter(m => m.lenderId === this.selectedLenderForDetails);
    }
    return result.slice(0, 50); // Limitar a 50 movimientos
  });

  private getFirstDayOfMonth(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }

  private isInDateRange(dateStr: string): boolean {
    const date = new Date(dateStr);
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }

  applyDateFilter() {
    this.dateFilterApplied.set(!this.dateFilterApplied());
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService, LoanCalculator } from '../../core/services/loan.service';
import { PaymentService } from '../../core/services/payment.service';
import { LenderService } from '../../core/services/lender.service';
import { SettlementService } from '../../core/services/settlement.service';
import { LenderSettlement, SettlementPreview } from '../../core/models';
import { apiErrorMessage } from '../../core/api/api-error';

@Component({
  selector: 'app-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 class="h4 h3-md mb-1">Liquidación por Prestamista</h2>
          <p class="text-muted mb-0 small">Resumen de cobranza y comisiones</p>
        </div>
        <div class="d-flex flex-wrap gap-2 align-items-center w-100 w-md-auto">
          <input 
            type="date" 
            class="form-control form-control-sm" 
            [(ngModel)]="startDate"
            style="min-width: 130px; max-width: 160px; flex: 1 1 auto;"
          >
          <span class="align-self-center">a</span>
          <input 
            type="date" 
            class="form-control form-control-sm" 
            [(ngModel)]="endDate"
            style="min-width: 130px; max-width: 160px; flex: 1 1 auto;"
          >
          <button class="btn btn-sm btn-outline-primary" (click)="applyDateFilter()" [disabled]="loading()">
            {{ loading() ? 'Calculando…' : 'Filtrar' }}
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="alert alert-danger mb-3" role="alert">{{ error() }}</div>
      }
      @if (success()) {
        <div class="alert alert-success mb-3" role="status">{{ success() }}</div>
      }

      <!-- Global Summary -->
      <div class="row g-2 g-md-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm bg-primary text-white h-100">
            <div class="card-body p-3 p-md-4">
              <h6 class="mb-1 opacity-75 small">Total Prestado</h6>
              <h5 class="amount mb-0 h5 h3-md">{{ formatCurrency(globalStats().totalLoaned) }}</h5>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm bg-success text-white h-100">
            <div class="card-body p-3 p-md-4">
              <h6 class="mb-1 opacity-75 small">Total Cobrado</h6>
              <h5 class="amount mb-0 h5 h3-md">{{ formatCurrency(globalStats().totalCollected) }}</h5>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm bg-warning text-dark h-100">
            <div class="card-body p-3 p-md-4">
              <h6 class="mb-1 opacity-75 small">Comisiones</h6>
              <h5 class="amount mb-0 h5 h3-md">{{ formatCurrency(globalStats().totalCommission) }}</h5>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm bg-info text-white h-100">
            <div class="card-body p-3 p-md-4">
              <h6 class="mb-1 opacity-75 small">Neto para Ti</h6>
              <h5 class="amount mb-0 h5 h3-md">{{ formatCurrency(globalStats().netForOwner) }}</h5>
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
          @for (settlement of settlements(); track settlement.lenderId) {
            <div class="border-bottom p-3 p-md-4">
              <div class="row g-3 align-items-start">
                <div class="col-12 col-md-3">
                  <h6 class="h5-md mb-1">{{ settlement.lenderName }}</h6>
                  <span class="badge bg-secondary" style="font-size: 0.7rem;">{{ settlement.routeName }}</span>
                  <p class="text-muted mb-0 small mt-1">
                    Comisión: {{ settlement.commissionPercentage }}%
                  </p>
                </div>
                <div class="col-12 col-md-9">
                  <div class="row g-2 g-md-3">
                    <div class="col-4 col-md-2">
                      <div class="text-muted" style="font-size: 0.65rem;">Prestado</div>
                      <div class="fw-medium" style="font-size: 0.8rem;">{{ formatCurrency(settlement.totalLoaned) }}</div>
                    </div>
                    <div class="col-4 col-md-2">
                      <div class="text-muted" style="font-size: 0.65rem;">A Cobrar</div>
                      <div class="fw-medium" style="font-size: 0.8rem;">{{ formatCurrency(settlement.totalToCollect) }}</div>
                    </div>
                    <div class="col-4 col-md-2">
                      <div class="text-muted" style="font-size: 0.65rem;">Cobrado</div>
                      <div class="fw-medium text-success" style="font-size: 0.8rem;">{{ formatCurrency(settlement.totalCollected) }}</div>
                    </div>
                    <div class="col-4 col-md-2">
                      <div class="text-muted" style="font-size: 0.65rem;">Pendiente</div>
                      <div class="fw-medium text-warning" style="font-size: 0.8rem;">{{ formatCurrency(settlement.totalPending) }}</div>
                    </div>
                    <div class="col-4 col-md-2">
                      <div class="text-muted" style="font-size: 0.65rem;">Comisión</div>
                      <div class="fw-medium text-danger" style="font-size: 0.8rem;">{{ formatCurrency(settlement.commission) }}</div>
                    </div>
                    <div class="col-4 col-md-2">
                      <div class="text-muted" style="font-size: 0.65rem;">Para Ti</div>
                      <div class="fw-bold text-primary" style="font-size: 0.8rem;">{{ formatCurrency(settlement.netForOwner) }}</div>
                    </div>
                  </div>
                  <div class="mt-2">
                    <span class="badge bg-primary me-1" style="font-size: 0.7rem;">{{ settlement.activeLoans }} activos</span>
                    <span class="badge bg-success" style="font-size: 0.7rem;">{{ settlement.completedLoans }} completados</span>
                    <button class="btn btn-sm btn-outline-primary ms-2" style="font-size: 0.7rem;"
                            [disabled]="closingId() === settlement.lenderId"
                            (click)="closeSettlement(settlement)">
                      {{ closingId() === settlement.lenderId ? 'Cerrando…' : 'Cerrar liquidación' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-5 text-muted">
              <p>{{ loading() ? 'Calculando liquidación…' : 'No hay prestamistas con movimientos en el periodo' }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Detailed Table -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-white border-bottom d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <h6 class="mb-0">Movimientos del Periodo</h6>
          <select class="form-select form-select-sm w-auto" [(ngModel)]="selectedLenderForDetails">
            <option value="">Todos los prestamistas</option>
            @for (lender of lenders(); track lender.id) {
              <option [value]="lender.id">{{ lender.name }}</option>
            }
          </select>
        </div>
        <div class="table-responsive">
          <table class="table table-sm mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Prestamista</th>
                <th>Tipo</th>
                <th class="d-none d-sm-table-cell">Descripción</th>
                <th class="text-end">Monto</th>
              </tr>
            </thead>
            <tbody>
              @for (movement of filteredMovements(); track movement.id) {
                <tr>
                  <td><small>{{ formatDate(movement.date) }}</small></td>
                  <td><small>{{ movement.lenderName }}</small></td>
                  <td>
                    @if (movement.type === 'loan') {
                      <span class="badge bg-primary" style="font-size: 0.65rem;">Préstamo</span>
                    } @else {
                      <span class="badge bg-success" style="font-size: 0.65rem;">Pago</span>
                    }
                  </td>
                  <td class="d-none d-sm-table-cell"><small>{{ movement.description }}</small></td>
                  <td class="text-end text-nowrap" [class.text-danger]="movement.type === 'loan'" [class.text-success]="movement.type === 'payment'">
                    <small>{{ movement.type === 'loan' ? '-' : '+' }}{{ formatCurrency(movement.amount) }}</small>
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
export class LiquidacionComponent implements OnInit {
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private lenderService = inject(LenderService);
  private settlementService = inject(SettlementService);

  startDate = this.getFirstDayOfMonth();
  endDate = this.today();
  selectedLenderForDetails = '';

  preview = signal<SettlementPreview | null>(null);
  loading = signal(false);
  closingId = signal<string | null>(null);
  error = signal('');
  success = signal('');

  lenders = this.lenderService.getDataSignal();

  /** Liquidación por prestamista: la calcula el backend (GET /settlements/preview) */
  settlements = computed<LenderSettlement[]>(() => this.preview()?.settlements ?? []);

  globalStats = computed(() => {
    const g = this.preview()?.global;
    return {
      totalLoaned: g?.totalLoaned ?? 0,
      totalCollected: g?.totalCollected ?? 0,
      totalPending: g?.totalPending ?? 0,
      totalCommission: g?.totalCommission ?? 0,
      netForOwner: g?.netForOwner ?? 0,
    };
  });

  ngOnInit(): void {
    this.lenderService.load().subscribe();
    this.loanService.load().subscribe();
    this.paymentService.load().subscribe();
    this.loadPreview();
  }

  loadPreview(): void {
    this.error.set('');
    if (!this.startDate || !this.endDate) {
      this.error.set('Selecciona la fecha de inicio y la de fin');
      return;
    }
    if (this.startDate > this.endDate) {
      this.error.set('La fecha de inicio no puede ser posterior a la fecha de fin');
      return;
    }

    this.loading.set(true);
    this.settlementService.preview(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.preview.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'No se pudo calcular la liquidación'));
      },
    });
  }

  closeSettlement(settlement: LenderSettlement): void {
    this.error.set('');
    this.success.set('');
    this.closingId.set(settlement.lenderId);
    this.settlementService.close(settlement.lenderId, this.startDate, this.endDate).subscribe({
      next: () => {
        this.closingId.set(null);
        this.success.set(`Liquidación de ${settlement.lenderName} cerrada correctamente`);
      },
      error: (err) => {
        this.closingId.set(null);
        this.error.set(apiErrorMessage(err, 'No se pudo cerrar la liquidación'));
      },
    });
  }

  movements = computed(() => {
    // Se recalcula al aplicar el filtro de fechas (cada consulta actualiza `preview`)
    this.preview();
    const result: Array<{
      id: string;
      date: string;
      type: 'loan' | 'payment';
      lenderId: string;
      lenderName: string;
      description: string;
      amount: number;
    }> = [];

    const loans = this.loanService.getDataSignal()().filter(l => l.loanType === 'lender' && !!l.lenderId);

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

  private toISODate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private today(): string {
    return this.toISODate(new Date());
  }

  private getFirstDayOfMonth(): string {
    const date = new Date();
    return this.toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  /** Fechas YYYY-MM-DD: la comparación de strings equivale a la de fechas (rango inclusivo) */
  private isInDateRange(dateStr: string): boolean {
    const d = dateStr.split('T')[0];
    return d >= this.startDate && d <= this.endDate;
  }

  applyDateFilter() {
    this.success.set('');
    this.loadPreview();
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  formatDate(dateStr: string): string {
    return LoanCalculator.formatDate(dateStr);
  }
}

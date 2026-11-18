import { LoanStatus } from './loan.model';

export type MoraSeverity = 'today' | 'low' | 'medium' | 'high';

/** Respuesta cruda de GET /collections/alerts|overdue */
export interface MoraAlertDto {
  loanId: string;
  personId: string;
  nextDueDate: string;
  daysOverdue: number;
  missedPayments: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
  severity: MoraSeverity;
  isDueToday: boolean;
}

export interface DashboardSummary {
  totalLoaned: number;
  totalToCollect: number;
  totalCollected: number;
  pendingCapital: number;
  totalLoansCount: number;
  activeCount: number;
  completedCount: number;
  overdueCount: number;
  collectPercentage: number;
}

export interface FollowUpItem {
  loanId: string;
  personId: string;
  lenderId: string | null;
  amount: number;
  totalToCollect: number;
  paid: number;
  pending: number;
  progress: number;
  status: LoanStatus;
  lastPaymentDate: string | null;
}

export interface LenderSettlement {
  lenderId: string;
  lenderName: string;
  routeId: string | null;
  routeName: string;
  commissionPercentage: number;
  totalLoaned: number;
  totalToCollect: number;
  totalCollected: number;
  totalPending: number;
  activeLoans: number;
  completedLoans: number;
  commission: number;
  netForOwner: number;
}

export interface SettlementPreview {
  from: string;
  to: string;
  settlements: LenderSettlement[];
  global: {
    totalLoaned: number;
    totalToCollect: number;
    totalCollected: number;
    totalPending: number;
    totalCommission: number;
    netForOwner: number;
  };
}

export interface Settlement {
  id: string;
  lenderId: string;
  fromDate: string;
  toDate: string;
  totalLoaned: number;
  totalToCollect: number;
  totalCollected: number;
  totalPending: number;
  commission: number;
  netForOwner: number;
  activeLoans: number;
  completedLoans: number;
  createdAt: string;
}

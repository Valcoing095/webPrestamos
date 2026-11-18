import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MoraService } from '../../core/services/mora.service';
import { LoanCalculator } from '../../core/services/loan.service';
import { DataSyncService } from '../../core/services/data-sync.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}
interface NavSection {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-classic-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  templateUrl: './classic-layout.html',
  styleUrl: './classic-layout.css',
})
export class ClassicLayout {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private moraService = inject(MoraService);
  dataSync = inject(DataSyncService);

  sidebarOpen = signal(false);
  userMenuOpen = signal(false);
  alertsOpen = signal(false);

  /** Alertas de mora en vivo (se recalculan al registrar pagos) */
  moraAlerts = this.moraService.alerts;
  overdueCount = this.moraService.overdueCount;
  topAlerts = computed(() => this.moraAlerts().slice(0, 5));

  pageTitle = signal('Panel');
  pageSubtitle = signal('');
  pageSection = signal('');

  user = this.auth.currentUser;
  isAdmin = this.auth.isAdmin;
  roleLabel = computed(() => (this.user()?.role === 'admin' ? 'Administrador' : 'Operador'));
  initials = computed(() => {
    const name = this.user()?.name?.trim() || '?';
    return name.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  });

  /** Navegación organizada por el flujo de trabajo del negocio (Administración solo para admins) */
  sections = computed<NavSection[]>(() => (this.isAdmin() ? [...this.baseSections, this.adminSection] : this.baseSections));

  private adminSection: NavSection = {
    label: 'Administración',
    items: [{ path: '/usuarios', label: 'Usuarios', icon: 'featherShield' }],
  };

  private baseSections: NavSection[] = [
    {
      label: 'Panel',
      items: [
        { path: '/dashboard', label: 'Panel', icon: 'featherHome' },
        { path: '/alertas', label: 'Alertas de mora', icon: 'featherAlertTriangle' },
      ],
    },
    {
      label: 'Mi cartera',
      items: [
        { path: '/mis-prestamos', label: 'Mis préstamos', icon: 'featherDollarSign' },
        { path: '/mis-pagos', label: 'Mis pagos', icon: 'featherCreditCard' },
        { path: '/clientes', label: 'Clientes', icon: 'featherUsers' },
      ],
    },
    {
      label: 'Red de cobro',
      items: [
        { path: '/prestamistas', label: 'Prestamistas', icon: 'featherUser' },
        { path: '/rutas', label: 'Rutas', icon: 'featherMap' },
        { path: '/prestamos-prestamistas', label: 'Préstamos por ruta', icon: 'featherPieChart' },
        { path: '/liquidacion', label: 'Liquidación', icon: 'featherFileText' },
      ],
    },
    {
      label: 'Análisis',
      items: [{ path: '/seguimiento', label: 'Seguimiento', icon: 'featherActivity' }],
    },
  ];

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.updatePageMeta();
      this.sidebarOpen.set(false);
      this.userMenuOpen.set(false);
      this.alertsOpen.set(false);
    });
  }

  private updatePageMeta(): void {
    // Solo se lee tras NavigationEnd, cuando el árbol de rutas ya está estable
    let r: ActivatedRoute | null = this.route;
    while (r?.firstChild) r = r.firstChild;
    const data = (r?.snapshot?.data ?? {}) as Record<string, string>;
    this.pageTitle.set(data['title'] ?? 'Panel');
    this.pageSubtitle.set(data['subtitle'] ?? '');
    this.pageSection.set(data['section'] ?? '');
  }

  toggleSidebar(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.alertsOpen.set(false);
    this.userMenuOpen.update(v => !v);
  }

  toggleAlerts(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen.set(false);
    this.alertsOpen.update(v => !v);
  }

  alertBadgeText(alert: { isDueToday: boolean; daysOverdue: number }): string {
    return alert.isDueToday ? 'Vence hoy' : `${alert.daysOverdue} día${alert.daysOverdue === 1 ? '' : 's'} de mora`;
  }

  formatCurrency(amount: number): string {
    return LoanCalculator.formatCurrency(amount);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.userMenuOpen.set(false);
    this.alertsOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.userMenuOpen.set(false);
    this.alertsOpen.set(false);
    this.sidebarOpen.set(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      this.sidebarOpen.set(false);
    }
  }
}

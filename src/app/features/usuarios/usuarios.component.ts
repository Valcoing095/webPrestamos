import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Role, User } from '../../core/models';
import { apiErrorMessage } from '../../core/api/api-error';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 class="h4 mb-1">Usuarios</h2>
          <p class="text-muted mb-0 small">Administra roles y acceso de quienes usan PrestaFlow</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <input type="search" class="form-control form-control-sm" placeholder="Buscar por nombre o correo"
                 [(ngModel)]="search" (keyup.enter)="applyFilters()" style="min-width: 220px;" />
          <select class="form-select form-select-sm" [(ngModel)]="roleFilter" (change)="applyFilters()">
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="operator">Operador</option>
          </select>
          <button class="btn btn-sm btn-outline-primary" (click)="applyFilters()">Buscar</button>
        </div>
      </div>

      @if (error()) {
        <div class="alert alert-danger mb-3" role="alert">{{ error() }}</div>
      }
      @if (success()) {
        <div class="alert alert-success mb-3" role="status">{{ success() }}</div>
      }

      <div class="card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr><td colspan="5" class="text-center py-5 text-muted"><span class="spinner"></span> Cargando usuarios…</td></tr>
              } @else {
                @for (u of users(); track u.id) {
                  <tr>
                    <td class="font-medium">
                      {{ u.name }}
                      @if (u.id === currentUserId()) { <span class="badge badge-primary ms-2">Tú</span> }
                    </td>
                    <td>{{ u.email }}</td>
                    <td>
                      <select class="form-select form-select-sm" style="min-width: 150px;"
                              [ngModel]="u.role" (ngModelChange)="changeRole(u, $event)"
                              [disabled]="u.id === currentUserId() || busyId() === u.id">
                        <option value="admin">Administrador</option>
                        <option value="operator">Operador</option>
                      </select>
                    </td>
                    <td>
                      <span class="badge" [class]="u.isActive ? 'badge-success' : 'badge-secondary'">
                        {{ u.isActive ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <button class="btn btn-sm" [class]="u.isActive ? 'btn-outline-danger' : 'btn-outline-success'"
                              [disabled]="u.id === currentUserId() || busyId() === u.id"
                              (click)="toggleStatus(u)">
                        {{ u.isActive ? 'Desactivar' : 'Activar' }}
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="text-center py-5 text-muted">No se encontraron usuarios</td></tr>
                }
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-between gap-3 border-t px-4 py-3" style="border-color: var(--line);">
            <span class="small text-muted">Página {{ page() }} de {{ totalPages() }} · {{ total() }} usuarios</span>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" [disabled]="page() <= 1" (click)="goTo(page() - 1)">Anterior</button>
              <button class="btn btn-sm btn-outline-secondary" [disabled]="page() >= totalPages()" (click)="goTo(page() + 1)">Siguiente</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class UsuariosComponent implements OnInit {
  private auth = inject(AuthService);

  users = signal<User[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');
  busyId = signal<string | null>(null);
  page = signal(1);
  totalPages = signal(1);
  total = signal(0);

  search = '';
  roleFilter: '' | Role = '';

  currentUserId = () => this.auth.currentUser()?.id ?? null;

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.load(1);
  }

  goTo(page: number): void {
    this.load(page);
  }

  private load(page = this.page()): void {
    this.loading.set(true);
    this.error.set('');
    const query: Record<string, string | number> = { page, limit: 20 };
    if (this.search.trim()) query['search'] = this.search.trim();
    if (this.roleFilter) query['role'] = this.roleFilter;

    this.auth.listUsers(query).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.page.set(res.page);
        this.totalPages.set(Math.max(1, res.totalPages));
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'No se pudo cargar la lista de usuarios'));
      },
    });
  }

  changeRole(user: User, role: Role): void {
    if (role === user.role) return;
    this.mutate(user, this.auth.updateUserRole(user.id, role), `Rol de ${user.name} actualizado`);
  }

  toggleStatus(user: User): void {
    this.mutate(
      user,
      this.auth.updateUserStatus(user.id, !user.isActive),
      user.isActive ? `${user.name} fue desactivado` : `${user.name} fue activado`,
    );
  }

  private mutate(user: User, request: ReturnType<AuthService['updateUserRole']>, okMessage: string): void {
    this.busyId.set(user.id);
    this.error.set('');
    this.success.set('');
    request.subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.busyId.set(null);
        this.success.set(okMessage);
      },
      error: (err) => {
        this.busyId.set(null);
        this.error.set(apiErrorMessage(err));
        // Revierte el select al valor real
        this.users.update((list) => [...list]);
      },
    });
  }
}

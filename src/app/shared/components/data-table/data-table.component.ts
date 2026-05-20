import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  template?: TemplateRef<any>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center py-3">
        <h5 class="card-title mb-0">{{ title }}</h5>
        <div class="d-flex gap-2 align-items-center">
          <ng-content select="[tableActions]"></ng-content>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              @for (column of columns; track column.key) {
                <th [style.width]="column.width || 'auto'" class="px-3 py-3">
                  {{ column.label }}
                </th>
              }
              @if (showActions) {
                <th class="px-3 py-3 text-end" style="width: 120px;">Acciones</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (item of data; track trackByFn ? trackByFn(item) : item) {
              <tr>
                @for (column of columns; track column.key) {
                  <td class="px-3 py-3 align-middle">
                    @if (column.template) {
                      <ng-container *ngTemplateOutlet="column.template; context: { $implicit: item, column: column }"></ng-container>
                    } @else {
                      {{ getNestedValue(item, column.key) }}
                    }
                  </td>
                }
                @if (showActions) {
                  <td class="px-3 py-3 text-end">
                    <div class="d-flex gap-1 justify-content-end">
                      @if (showEdit) {
                        <button class="btn btn-sm btn-outline-primary" (click)="onEdit.emit(item)">
                          Editar
                        </button>
                      }
                      @if (showDelete) {
                        <button class="btn btn-sm btn-outline-danger" (click)="onDelete.emit(item)">
                          Eliminar
                        </button>
                      }
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns.length + (showActions ? 1 : 0)" class="text-center py-5 text-muted">
                  {{ emptyMessage }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .table th {
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6c757d;
    }
    .table td {
      vertical-align: middle;
    }
  `]
})
export class DataTableComponent {
  @Input() title: string = '';
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() showActions: boolean = true;
  @Input() showEdit: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() emptyMessage: string = 'No hay datos disponibles';
  @Input() trackByFn?: (item: any) => any;

  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
  }
}

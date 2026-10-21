import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  template: `
    <div class="card overflow-hidden">
      <div class="card-header flex items-center justify-between gap-3">
        <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
        <div class="flex items-center gap-2">
          <ng-content select="[tableActions]"></ng-content>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              @for (column of columns; track column.key) {
                <th [style.width]="column.width || 'auto'">{{ column.label }}</th>
              }
              @if (showActions) {
                <th class="text-right" style="width: 140px;">Acciones</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (item of data; track trackByFn ? trackByFn(item) : item) {
              <tr>
                @for (column of columns; track column.key) {
                  <td>
                    @if (column.template) {
                      <ng-container *ngTemplateOutlet="column.template; context: { $implicit: item, column: column }"></ng-container>
                    } @else {
                      {{ getNestedValue(item, column.key) }}
                    }
                  </td>
                }
                @if (showActions) {
                  <td class="text-right">
                    <div class="flex justify-end gap-1.5">
                      @if (showEdit) {
                        <button class="btn btn-sm btn-outline-primary" (click)="onEdit.emit(item)">Editar</button>
                      }
                      @if (showDelete) {
                        <button class="btn btn-sm btn-outline-danger" (click)="onDelete.emit(item)">Eliminar</button>
                      }
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns.length + (showActions ? 1 : 0)" class="py-10 text-center text-sm text-slate-400">
                  {{ emptyMessage }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
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

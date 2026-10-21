import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Modal propio (sin dependencias externas).
 * Uso:
 *   <app-modal #m title="Nuevo"> ...contenido... </app-modal>
 *   m.open() / m.close()
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" [attr.aria-label]="title">
        <div class="modal-backdrop" (click)="close()"></div>
        <div class="modal-dialog" [ngClass]="sizeClass">
          <div class="modal-content relative">
            <div class="modal-header">
              <h3 class="modal-title">{{ title }}</h3>
              <button type="button" class="btn-close" (click)="close()" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <ng-content></ng-content>
            </div>
            @if (showFooter) {
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="close()">{{ cancelText }}</button>
                @if (showConfirm) {
                  <button type="button" class="btn" [ngClass]="confirmBtnClass" (click)="confirm()">{{ confirmText }}</button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`:host { display: contents; }`],
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showFooter: boolean = true;
  @Input() showConfirm: boolean = true;
  @Input() confirmText: string = 'Guardar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmType: 'primary' | 'success' | 'danger' | 'warning' = 'primary';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();
  @Output() onOpen = new EventEmitter<void>();

  isOpen = signal(false);

  get sizeClass(): string {
    return { sm: 'modal-sm', md: '', lg: 'modal-lg', xl: 'modal-lg' }[this.size];
  }

  get confirmBtnClass(): string {
    return `btn-${this.confirmType}`;
  }

  open(): void {
    this.isOpen.set(true);
    this.onOpen.emit();
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.onClose.emit();
  }

  confirm(): void {
    this.onConfirm.emit();
  }
}

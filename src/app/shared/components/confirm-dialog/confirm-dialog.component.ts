import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Diálogo de confirmación propio (sin dependencias externas).
 * `open()` devuelve una Promise<boolean> con la respuesta del usuario.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" role="alertdialog" aria-modal="true" [attr.aria-label]="title">
        <div class="modal-backdrop" (click)="cancel()"></div>
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content relative p-6 text-center">
            <div class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50">
              <svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-800">{{ title }}</h3>
            <p class="mt-2 text-sm text-slate-500">{{ message }}</p>
            <div class="mt-6 flex gap-3">
              <button type="button" class="btn btn-secondary flex-1" (click)="cancel()">{{ cancelText }}</button>
              <button type="button" class="btn flex-1" [ngClass]="confirmBtnClass" (click)="confirm()">{{ confirmText }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`:host { display: contents; }`],
})
export class ConfirmDialogComponent {
  @Input() title: string = 'Confirmar';
  @Input() message: string = '¿Estás seguro de realizar esta acción?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmType: 'primary' | 'success' | 'danger' | 'warning' = 'danger';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  isOpen = signal(false);
  private resolvePromise?: (value: boolean) => void;

  get confirmBtnClass(): string {
    return `btn-${this.confirmType}`;
  }

  open(): Promise<boolean> {
    this.isOpen.set(true);
    return new Promise<boolean>(resolve => {
      this.resolvePromise = resolve;
    });
  }

  confirm(): void {
    this.isOpen.set(false);
    this.onConfirm.emit();
    this.resolvePromise?.(true);
  }

  cancel(): void {
    this.isOpen.set(false);
    this.onCancel.emit();
    this.resolvePromise?.(false);
  }
}

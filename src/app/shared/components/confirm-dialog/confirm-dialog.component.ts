import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade" #modalElement tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title">{{ title }}</h5>
            <button type="button" class="btn-close" (click)="cancel()" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">{{ message }}</p>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary" (click)="cancel()">{{ cancelText }}</button>
            <button type="button" class="btn" [ngClass]="confirmBtnClass" (click)="confirm()">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ConfirmDialogComponent implements AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  
  @Input() title: string = 'Confirmar';
  @Input() message: string = 'Esta seguro de realizar esta accion?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmType: 'primary' | 'success' | 'danger' | 'warning' = 'danger';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  private modalInstance: any;
  private resolvePromise?: (value: boolean) => void;

  get confirmBtnClass(): string {
    return `btn-${this.confirmType}`;
  }

  ngAfterViewInit(): void {
    if (typeof bootstrap !== 'undefined') {
      this.modalInstance = new bootstrap.Modal(this.modalElement.nativeElement);
    }
  }

  open(): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      if (this.modalInstance) {
        this.modalInstance.show();
      }
    });
  }

  confirm(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.onConfirm.emit();
    if (this.resolvePromise) {
      this.resolvePromise(true);
    }
  }

  cancel(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.onCancel.emit();
    if (this.resolvePromise) {
      this.resolvePromise(false);
    }
  }
}

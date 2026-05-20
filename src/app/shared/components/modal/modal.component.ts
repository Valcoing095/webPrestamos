import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade" #modalElement tabindex="-1" [attr.aria-labelledby]="modalId + 'Label'" aria-hidden="true">
      <div class="modal-dialog" [ngClass]="sizeClass">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" [id]="modalId + 'Label'">{{ title }}</h5>
            <button type="button" class="btn-close" (click)="close()" aria-label="Close"></button>
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
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ModalComponent implements AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  
  @Input() title: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showFooter: boolean = true;
  @Input() showConfirm: boolean = true;
  @Input() confirmText: string = 'Guardar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmType: 'primary' | 'success' | 'danger' | 'warning' = 'primary';
  @Input() modalId: string = 'modal-' + Math.random().toString(36).substr(2, 9);

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();
  @Output() onOpen = new EventEmitter<void>();

  private modalInstance: any;

  get sizeClass(): string {
    return this.size !== 'md' ? `modal-${this.size}` : '';
  }

  get confirmBtnClass(): string {
    return `btn-${this.confirmType}`;
  }

  ngAfterViewInit(): void {
    if (typeof bootstrap !== 'undefined') {
      this.modalInstance = new bootstrap.Modal(this.modalElement.nativeElement);
    }
  }

  open(): void {
    if (this.modalInstance) {
      this.modalInstance.show();
      this.onOpen.emit();
    }
  }

  close(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
      this.onClose.emit();
    }
  }

  confirm(): void {
    this.onConfirm.emit();
  }
}

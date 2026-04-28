import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, NgIcon],
  template: `
    <div class="card border-0 shadow-sm h-100">
      <div class="card-body d-flex align-items-center gap-3">
        <div class="rounded-3 p-3" [ngClass]="iconBgClass">
          <ng-icon [name]="icon" [ngClass]="iconClass" style="font-size: 1.5rem;"></ng-icon>
        </div>
        <div>
          <span class="text-muted small">{{ label }}</span>
          <h3 class="h4 mb-0">{{ value }}</h3>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = 'featherHome';
  @Input() color: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';

  get iconBgClass(): string {
    return `bg-${this.color} bg-opacity-10`;
  }

  get iconClass(): string {
    return `text-${this.color}`;
  }
}

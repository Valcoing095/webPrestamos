import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card border-0 shadow-sm h-100" [ngClass]="'bg-' + variant + ' text-white'">
      <div class="card-body">
        <h6 class="card-subtitle mb-2 opacity-75">{{ title }}</h6>
        <h3 class="card-title mb-2">{{ value }}</h3>
        <small class="opacity-75">{{ subtitle }}</small>
        <div *ngIf="progress !== undefined" class="mt-3">
          <div class="progress" style="height: 8px;">
            <div 
              class="progress-bar" 
              [style.width.%]="progress"
              [ngClass]="'bg-' + progressVariant"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string = '';
  @Input() subtitle: string = '';
  @Input() variant: 'primary' | 'success' | 'warning' | 'info' | 'danger' = 'primary';
  @Input() progress?: number;
  @Input() progressVariant: string = 'success';
}

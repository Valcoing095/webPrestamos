import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="card card-hover h-full p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-500">{{ title }}</p>
          <p class="mt-1.5 truncate text-2xl font-bold text-slate-900">{{ value }}</p>
          @if (subtitle) {
            <p class="mt-1 text-xs text-slate-400">{{ subtitle }}</p>
          }
        </div>
        <span class="badge shrink-0" [ngClass]="badgeClass">{{ variantLabel }}</span>
      </div>
      @if (progress !== undefined) {
        <div class="progress mt-4">
          <div class="h-full rounded-full progress-grow" [ngClass]="barClass" [style.width.%]="progress"></div>
        </div>
      }
    </article>
  `,
  styles: [`:host { display: block; }`],
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string = '';
  @Input() subtitle: string = '';
  @Input() variant: 'primary' | 'success' | 'warning' | 'info' | 'danger' = 'primary';
  @Input() progress?: number;
  @Input() progressVariant: string = 'success';

  get variantLabel(): string {
    return { primary: 'Total', success: 'OK', warning: 'Atención', info: 'Info', danger: 'Riesgo' }[this.variant];
  }

  get badgeClass(): string {
    return `badge-${this.variant === 'info' ? 'primary' : this.variant}`;
  }

  get barClass(): string {
    return {
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
      primary: 'bg-brand-500',
      info: 'bg-sky-500',
    }[this.progressVariant] ?? 'bg-emerald-500';
  }
}

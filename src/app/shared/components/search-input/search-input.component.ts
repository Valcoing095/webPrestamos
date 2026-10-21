import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full max-w-xs">
      <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"/>
      </svg>
      <input
        type="text"
        class="form-input !pl-10 !pr-9"
        [placeholder]="placeholder"
        [(ngModel)]="searchTerm"
        (ngModelChange)="onSearchChange($event)"
        aria-label="Buscar"
      />
      @if (searchTerm) {
        <button
          type="button"
          class="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          (click)="clearSearch()"
          aria-label="Limpiar búsqueda"
        >
          <span class="text-base leading-none">×</span>
        </button>
      }
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Buscar...';
  @Input() debounceMs: number = 300;
  @Output() search = new EventEmitter<string>();

  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.search.emit(term));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.search.emit('');
  }
}

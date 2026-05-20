import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-group">
      <span class="input-group-text bg-white border-end-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-muted" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
      </span>
      <input 
        type="text" 
        class="form-control border-start-0" 
        [placeholder]="placeholder"
        [(ngModel)]="searchTerm"
        (ngModelChange)="onSearchChange($event)"
      >
      @if (searchTerm) {
        <button class="btn btn-outline-secondary border-start-0" type="button" (click)="clearSearch()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .input-group {
      max-width: 300px;
    }
    .form-control:focus {
      box-shadow: none;
      border-color: #ced4da;
    }
    .input-group-text {
      border-color: #ced4da;
    }
  `]
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Buscar...';
  @Input() debounceMs: number = 300;
  @Output() search = new EventEmitter<string>();

  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.search.emit(term);
    });
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

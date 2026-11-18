import { HttpClient } from '@angular/common/http';
import { Signal, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Base de los servicios de datos respaldados por el backend.
 *
 * Mantiene una caché reactiva (signal) con la lista completa del recurso
 * (`GET <path>/all`), de modo que los componentes sigan leyendo de forma
 * síncrona (getAll/getById/getDataSignal). Las mutaciones son Observables
 * y actualizan la caché cuando el backend confirma.
 */
export abstract class ApiDataService<T extends { id: string }, I> {
  protected http = inject(HttpClient);
  protected readonly baseUrl = environment.apiUrl;
  protected abstract readonly path: string;
  protected dataSignal = signal<T[]>([]);

  loading = signal(false);
  loaded = signal(false);

  protected get url(): string {
    return `${this.baseUrl}${this.path}`;
  }

  getDataSignal(): Signal<T[]> {
    return this.dataSignal;
  }

  getAll(): T[] {
    return this.dataSignal();
  }

  getById(id: string): T | null {
    return this.getAll().find((item) => item.id === id) || null;
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  find(predicate: (item: T) => boolean): T | null {
    return this.getAll().find(predicate) || null;
  }

  /** Carga la lista completa desde el backend (/all, sin paginar) */
  load(): Observable<T[]> {
    this.loading.set(true);
    return this.http.get<T[]>(`${this.url}/all`).pipe(
      tap({
        next: (items) => {
          this.dataSignal.set(items);
          this.loaded.set(true);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }

  create(data: I): Observable<T> {
    return this.http
      .post<T>(this.url, data)
      .pipe(tap((created) => this.dataSignal.update((items) => [created, ...items])));
  }

  update(id: string, data: Partial<I>): Observable<T> {
    return this.http
      .patch<T>(`${this.url}/${id}`, data)
      .pipe(tap((updated) => this.dataSignal.update((items) => items.map((i) => (i.id === id ? updated : i)))));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<{ deleted: boolean }>(`${this.url}/${id}`).pipe(
      tap(() => this.dataSignal.update((items) => items.filter((i) => i.id !== id))),
      map(() => undefined),
    );
  }

  clear(): void {
    this.dataSignal.set([]);
    this.loaded.set(false);
  }
}

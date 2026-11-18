import { Injectable, Injector, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiDataService } from './api-data.service';
import { LenderService } from './lender.service';
import { Route, RouteInput } from '../models';

@Injectable({
  providedIn: 'root',
})
export class RouteService extends ApiDataService<Route, RouteInput> {
  protected readonly path = '/routes';
  private injector = inject(Injector);

  // El backend sincroniza ruta <-> prestamista: se recarga el lado opuesto
  private syncLenders = () => this.injector.get(LenderService).load().subscribe();

  override create(data: RouteInput): Observable<Route> {
    return super.create(data).pipe(tap(this.syncLenders));
  }

  override update(id: string, data: Partial<RouteInput>): Observable<Route> {
    return super.update(id, data).pipe(tap(this.syncLenders));
  }

  override delete(id: string): Observable<void> {
    return super.delete(id).pipe(tap(this.syncLenders));
  }

  getActiveRoutes(): Route[] {
    return this.filter((r) => r.isActive);
  }

  findByName(name: string): Route[] {
    return this.filter((r) => r.name.toLowerCase().includes(name.toLowerCase()));
  }
}

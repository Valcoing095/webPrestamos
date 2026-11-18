import { Injectable, Injector, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiDataService } from './api-data.service';
import { RouteService } from './route.service';
import { Lender, LenderInput } from '../models';

@Injectable({
  providedIn: 'root',
})
export class LenderService extends ApiDataService<Lender, LenderInput> {
  protected readonly path = '/lenders';
  private injector = inject(Injector);

  // El backend sincroniza prestamista <-> ruta: se recarga el lado opuesto
  private syncRoutes = () => this.injector.get(RouteService).load().subscribe();

  override create(data: LenderInput): Observable<Lender> {
    return super.create(data).pipe(tap(this.syncRoutes));
  }

  override update(id: string, data: Partial<LenderInput>): Observable<Lender> {
    return super.update(id, data).pipe(tap(this.syncRoutes));
  }

  override delete(id: string): Observable<void> {
    return super.delete(id).pipe(tap(this.syncRoutes));
  }

  getByRouteId(routeId: string): Lender[] {
    return this.filter((l) => l.routeId === routeId);
  }

  getActiveLenders(): Lender[] {
    return this.filter((l) => l.isActive);
  }

  findByName(name: string): Lender[] {
    return this.filter((l) => l.name.toLowerCase().includes(name.toLowerCase()));
  }

  getTotalCapital(): number {
    return this.getAll().reduce((sum, l) => sum + l.availableCapital, 0);
  }
}

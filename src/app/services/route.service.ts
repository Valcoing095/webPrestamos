import { Injectable, computed, Signal } from '@angular/core';
import { DataService } from './data.service';
import { StorageService } from './storage.service';
import { Route } from '../models';

@Injectable({
  providedIn: 'root',
})
export class RouteService extends DataService<Route> {
  constructor(storageService: StorageService) {
    super('routes', storageService);
  }

  create(data: Partial<Route>): Route {
    const route = new Route(data);
    if (!route.isValid()) throw new Error(route.validate().join(', '));
    return this.add(route.toJSON() as Route);
  }

  updateRoute(id: string, data: Partial<Route>): Route | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const route = new Route(existing);
    route.update(data);
    if (!route.isValid()) throw new Error(route.validate().join(', '));
    return this.update(id, route.toJSON() as Route);
  }

  getByUserId(userId: string): Route[] {
    return this.filter((r) => r.userId === userId);
  }

  getRoutesSignal(userId: string): Signal<Route[]> {
    return computed(() => {
      const all = this.getDataSignal()();
      return all.filter((r) => r.userId === userId);
    });
  }

  getActiveRoutes(userId: string): Route[] {
    return this.getByUserId(userId).filter((r) => r.isActive);
  }
}

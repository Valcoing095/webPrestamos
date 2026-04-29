import { Injectable, computed, Signal } from '@angular/core';
import { DataService } from './data.service';
import { StorageService } from './storage.service';
import { Lender } from '../models';

@Injectable({
  providedIn: 'root',
})
export class LenderService extends DataService<Lender> {
  constructor(storageService: StorageService) {
    super('lenders', storageService);
  }

  create(data: Partial<Lender>): Lender {
    const lender = new Lender(data);
    if (!lender.isValid()) throw new Error(lender.validate().join(', '));
    return this.add(lender.toJSON() as Lender);
  }

  updateLender(id: string, data: Partial<Lender>): Lender | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const lender = new Lender(existing);
    lender.update(data);
    if (!lender.isValid()) throw new Error(lender.validate().join(', '));
    return this.update(id, lender.toJSON() as Lender);
  }

  getByUserId(userId: string): Lender[] {
    return this.filter((l) => l.userId === userId);
  }

  getLendersSignal(userId: string): Signal<Lender[]> {
    return computed(() => {
      const all = this.getDataSignal()();
      return all.filter((l) => l.userId === userId);
    });
  }

  getActiveLenders(userId: string): Lender[] {
    return this.getByUserId(userId).filter((l) => l.isActive);
  }

  getByRouteId(routeId: string): Lender[] {
    return this.filter((l) => l.routeId === routeId);
  }
}

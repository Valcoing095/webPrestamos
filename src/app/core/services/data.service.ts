import { Signal, signal } from '@angular/core';
import { StorageService } from './storage.service';

export class DataService<T extends { id: string }> {
  protected storageKey: string;
  protected storage: StorageService;
  protected dataSignal = signal<T[]>([]);

  constructor(storageKey: string, storageService: StorageService) {
    this.storageKey = storageKey;
    this.storage = storageService;
    this.loadData();
  }

  private loadData(): void {
    const items = this.storage.get<T[]>(this.storageKey) || [];
    this.dataSignal.set(items);
  }

  protected saveAll(items: T[]): void {
    this.storage.set(this.storageKey, items);
    // Nueva referencia: los signals/computed detectan el cambio y la UI se refresca
    this.dataSignal.set([...items]);
  }

  getDataSignal(): Signal<T[]> {
    return this.dataSignal;
  }

  getAll(): T[] {
    return this.dataSignal();
  }

  add(item: T): T {
    this.saveAll([...this.getAll(), item]);
    return item;
  }

  getById(id: string): T | null {
    const items = this.getAll();
    return items.find((item) => item.id === id) || null;
  }

  update(id: string, data: Partial<T>): T | null {
    const items = this.getAll();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) return null;

    const updated = { ...items[index], ...data };
    const next = [...items];
    next[index] = updated;
    this.saveAll(next);
    return updated;
  }

  delete(id: string): boolean {
    const items = this.getAll();
    const item = items.find((i) => i.id === id);

    if (!item) return false;

    const filtered = items.filter((i) => i.id !== id);
    this.saveAll(filtered);
    return true;
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  find(predicate: (item: T) => boolean): T | null {
    return this.getAll().find(predicate) || null;
  }

  clear(): void {
    this.storage.remove(this.storageKey);
    this.dataSignal.set([]);
  }
}

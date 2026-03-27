import { signal } from '@angular/core';
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
    this.dataSignal.set(items);
  }

  getAll(): T[] {
    return this.dataSignal();
  }

  add(item: T): T {
    const items = this.getAll();
    items.push(item);
    this.saveAll(items);
    return item;
  }

  getById(id: string): T | null {
    const items = this.getAll();
    return items.find(item => item.id === id) || null;
  }

  update(id: string, data: Partial<T>): T | null {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return null;

    items[index] = { ...items[index], ...data };
    this.saveAll(items);
    return items[index];
  }

  delete(id: string): boolean {
    const items = this.getAll();
    const item = items.find(i => i.id === id);

    if (!item) return false;

    const filtered = items.filter(i => i.id !== id);
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

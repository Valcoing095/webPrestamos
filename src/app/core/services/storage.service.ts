import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private prefix = 'lending_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Storage get error: ${key}`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage set error: ${key}`, error);
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error(`Storage remove error: ${key}`, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Storage clear error', error);
      return false;
    }
  }

  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }
}

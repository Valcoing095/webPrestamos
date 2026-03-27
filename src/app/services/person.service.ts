import { Injectable, computed, Signal } from '@angular/core';
import { DataService } from './data.service';
import { StorageService } from './storage.service';
import { Person } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PersonService extends DataService<Person> {
  constructor(storageService: StorageService) {
    super('persons', storageService);
  }

  create(data: Partial<Person>): Person {
    const person = new Person(data);

    if (!person.isValid()) {
      throw new Error(person.validate().join(', '));
    }

    return this.add(person.toJSON() as Person);
  }

  updatePerson(id: string, data: Partial<Person>): Person | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const person = new Person(existing);
    person.update(data);

    if (!person.isValid()) {
      throw new Error(person.validate().join(', '));
    }

    return this.update(id, person.toJSON() as Person);
  }

  getByUserId(userId: string): Person[] {
    return this.filter((p) => p.userId === userId);
  }

  getPersonsSignal(userId: string): Signal<Person[]> {
    return computed(() => {
      const allPersons = this.getDataSignal()();
      return allPersons.filter((p) => p.userId === userId);
    });
  }

  findByName(userId: string, name: string): Person[] {
    return this.getByUserId(userId).filter((p) =>
      p.name.toLowerCase().includes(name.toLowerCase()),
    );
  }

  deleteWithUserId(id: string, userId: string): boolean {
    const item = this.getById(id);
    if (item && item.userId === userId) {
      return this.delete(id);
    }
    return false;
  }
}

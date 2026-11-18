import { Injectable } from '@angular/core';
import { ApiDataService } from './api-data.service';
import { Person, PersonInput } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PersonService extends ApiDataService<Person, PersonInput> {
  protected readonly path = '/persons';

  findByName(name: string): Person[] {
    return this.filter((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  }

  getByRouteId(routeId: string): Person[] {
    return this.filter((p) => p.routeId === routeId);
  }
}

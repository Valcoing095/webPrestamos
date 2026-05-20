import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor(private storage: StorageService) {
    this.loadUser();
  }

  private loadUser(): void {
    const userData = this.storage.get<User>('user');
    if (userData) {
      this.currentUserSignal.set(userData);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  register(name: string, email: string, password: string): User {
    const usersKey = 'users';
    const users = this.storage.get<any[]>(usersKey) || [];

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('El correo electronico ya esta registrado');
    }

    const user: User = {
      id: this.generateId(),
      name,
      email,
      createdAt: new Date().toISOString()
    };

    const userWithPassword = {
      ...user,
      password: this.hashPassword(password)
    };

    users.push(userWithPassword);
    this.storage.set(usersKey, users);

    return this.login(email, password);
  }

  login(email: string, password: string): User {
    const usersKey = 'users';
    const users = this.storage.get<any[]>(usersKey) || [];

    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error('Credenciales incorrectas');
    }

    if (user.password !== this.hashPassword(password)) {
      throw new Error('Credenciales incorrectas');
    }

    const userData: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    this.currentUserSignal.set(userData);
    this.storage.set('user', userData);

    return userData;
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.storage.remove('user');
  }

  getUser(): User | null {
    return this.currentUserSignal();
  }

  getUserId(): string | null {
    return this.currentUserSignal()?.id || null;
  }
}

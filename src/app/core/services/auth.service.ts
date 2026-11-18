import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthTokens, Role, User } from '../models';
import { Page } from '../api/page';
import { StorageService } from './storage.service';

export type { User };

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);
  private injector = inject(Injector);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  private currentUserSignal = signal<User | null>(null);
  private accessTokenSignal = signal<string | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  accessToken = this.accessTokenSignal.asReadonly();
  isAuthenticated = computed(() => this.accessTokenSignal() !== null && this.currentUserSignal() !== null);
  role = computed<Role | null>(() => this.currentUserSignal()?.role ?? null);
  isAdmin = computed(() => this.role() === 'admin');

  /** Refresh en vuelo (single-flight): todas las peticiones 401 comparten la misma llamada */
  private refreshInFlight$: Observable<AuthTokens> | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    // Los tokens viven en localStorage (aceptable para este proyecto)
    const token = this.storage.get<string>(ACCESS_KEY);
    const refresh = this.storage.get<string>(REFRESH_KEY);
    const user = this.storage.get<User>(USER_KEY);
    if (token && refresh && user) {
      this.accessTokenSignal.set(token);
      this.currentUserSignal.set(user);
    } else {
      this.clearSession();
    }
  }

  private saveSession(tokens: AuthTokens): void {
    this.storage.set(ACCESS_KEY, tokens.accessToken);
    this.storage.set(REFRESH_KEY, tokens.refreshToken);
    this.storage.set(USER_KEY, tokens.user);
    this.accessTokenSignal.set(tokens.accessToken);
    this.currentUserSignal.set(tokens.user);
  }

  private clearSession(): void {
    this.storage.remove(ACCESS_KEY);
    this.storage.remove(REFRESH_KEY);
    this.storage.remove(USER_KEY);
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  getRefreshToken(): string | null {
    return this.storage.get<string>(REFRESH_KEY);
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.http
      .post<AuthTokens>(`${this.authUrl}/register`, { name, email, password })
      .pipe(tap((t) => this.saveSession(t)), map((t) => t.user));
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthTokens>(`${this.authUrl}/login`, { email, password })
      .pipe(tap((t) => this.saveSession(t)), map((t) => t.user));
  }

  /** Renueva los tokens. El refresh rota: el anterior queda revocado tras usarse */
  refresh(): Observable<AuthTokens> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.expireSession();
      return throwError(() => new Error('Sin sesión'));
    }

    this.refreshInFlight$ = this.http.post<AuthTokens>(`${this.authUrl}/refresh`, { refreshToken }).pipe(
      tap((t) => this.saveSession(t)),
      catchError((err) => {
        this.expireSession();
        return throwError(() => err);
      }),
      finalize(() => (this.refreshInFlight$ = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight$;
  }

  /** Datos frescos del usuario actual (GET /auth/me) */
  me(): Observable<User> {
    return this.http.get<User>(`${this.authUrl}/me`).pipe(
      tap((user) => {
        this.storage.set(USER_KEY, user);
        this.currentUserSignal.set(user);
      }),
    );
  }

  /** Cierra sesión: revoca el refresh en el backend (si se puede) y limpia el estado local */
  logout(): void {
    const refreshToken = this.getRefreshToken();
    this.clearSession();
    if (refreshToken) {
      this.http.post(`${this.authUrl}/logout`, { refreshToken }).pipe(catchError(() => of(null))).subscribe();
    }
  }

  /** Sesión vencida o refresh fallido: limpia y manda al login */
  expireSession(): void {
    const wasLoggedIn = this.currentUserSignal() !== null;
    this.clearSession();
    if (wasLoggedIn) {
      this.injector.get(Router).navigate(['/login']);
    }
  }

  getUser(): User | null {
    return this.currentUserSignal();
  }

  getUserId(): string | null {
    return this.currentUserSignal()?.id || null;
  }

  // --- Administración de usuarios (solo admin) ---

  listUsers(query: Record<string, string | number> = {}): Observable<Page<User>> {
    return this.http.get<Page<User>>(`${this.authUrl}/users`, { params: query });
  }

  updateUserRole(id: string, role: Role): Observable<User> {
    return this.http.patch<User>(`${this.authUrl}/users/${id}/role`, { role });
  }

  updateUserStatus(id: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.authUrl}/users/${id}/status`, { isActive });
  }
}

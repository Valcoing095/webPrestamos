import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Endpoints que nunca llevan Bearer ni disparan refresh */
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

function isApiRequest(req: HttpRequest<unknown>): boolean {
  return req.url.startsWith(environment.apiUrl);
}

function isPublic(req: HttpRequest<unknown>): boolean {
  return PUBLIC_PATHS.some((p) => req.url.startsWith(`${environment.apiUrl}${p}`));
}

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Adjunta el access token y, ante un 401, renueva la sesión una sola vez
 * (single-flight) y reintenta la petición original. Si el refresh falla,
 * AuthService limpia la sesión y redirige al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req) || isPublic(req)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.accessToken();
  const authed = token ? withToken(req, token) : req;

  return next(authed).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && auth.getRefreshToken()) {
        return auth.refresh().pipe(switchMap((tokens) => next(withToken(req, tokens.accessToken))));
      }
      return throwError(() => error);
    }),
  );
};

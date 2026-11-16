import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthState } from './auth-state.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authState = inject(AuthState);
  const router = inject(Router);
  const isPublicAuthRequest =
    request.url === `${environment.apiBaseUrl}/auth/login` ||
    request.url === `${environment.apiBaseUrl}/usuarios`;
  const token = isPublicAuthRequest ? null : authState.token();
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        authState.clear();
        void router.navigateByUrl('/login', {
          state: { message: 'Tu sesión ha caducado. Inicia sesión de nuevo.' },
        });
      }
      return throwError(() => error);
    }),
  );
};

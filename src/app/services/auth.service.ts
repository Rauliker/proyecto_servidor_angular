import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, isDevMode } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthState } from './auth-state.service';
import { LoginCredentials } from '../models/login-credentials';
import { RegistrationDetails } from '../models/registration-details';

function redactSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      /password|token|authorization|secret/i.test(key)
        ? '[REDACTED]'
        : redactSensitiveData(nestedValue),
    ]),
  );
}

export interface LoginResponse {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthState);
  private readonly baseUrl = environment.apiBaseUrl;

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<unknown>(`${this.baseUrl}/auth/login`, credentials).pipe(
      map((response) => {
        if (
          typeof response !== 'object' ||
          response === null ||
          !('accessToken' in response) ||
          typeof response.accessToken !== 'string' ||
          !response.accessToken
        ) {
          throw new Error('La API no devolvió un accessToken válido.');
        }
        this.authState.setToken(response.accessToken);
        return { accessToken: response.accessToken };
      }),
    );
  }

  register(details: RegistrationDetails): Observable<unknown> {
    const url = `${this.baseUrl}/usuarios`;
    if (isDevMode()) {
      console.info('[HTTP request]', {
        method: 'POST',
        url,
        body: details,
      });
    }

    return this.http.post(url, details).pipe(
      tap({
        next: (body) => {
          if (isDevMode()) {
            console.info('[HTTP response]', {
              method: 'POST',
              url,
              body: redactSensitiveData(body),
            });
          }
        },
        error: (error: unknown) => {
          if (!isDevMode()) {
            return;
          }
          if (error instanceof HttpErrorResponse) {
            console.error('[HTTP response error]', {
              method: 'POST',
              url,
              status: error.status,
              statusText: error.statusText,
              body: redactSensitiveData(error.error),
            });
            return;
          }
          console.error('[HTTP request failure]', { method: 'POST', url, error });
        },
      }),
    );
  }

  logout(): void {
    this.authState.clear();
  }
}

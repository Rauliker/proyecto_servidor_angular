import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, isDevMode } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthState } from './auth-state.service';
import { LoginCredentials } from '../models/login-credentials';
import { RegistrationDetails } from '../models/registration-details';

export interface LoginResponse {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthState);
  private readonly baseUrl = environment.apiBaseUrl;

  login(credentials: LoginCredentials, rememberMe = false): Observable<LoginResponse> {
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
        this.authState.setToken(response.accessToken, rememberMe);
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
      });
    }

    return this.http.post(url, details).pipe(
      tap({
        next: () => {
          if (isDevMode()) {
            console.info('[HTTP response]', {
              method: 'POST',
              url,
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

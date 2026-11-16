import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
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
    return this.http.post(`${this.baseUrl}/usuarios`, details);
  }

  logout(): void {
    this.authState.clear();
  }
}

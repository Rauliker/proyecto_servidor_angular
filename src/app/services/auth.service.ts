import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginCredentials } from '../models/login-credentials';
import { RegistrationDetails } from '../models/registration-details';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: LoginCredentials): Observable<unknown> {
    return this.http.post<unknown>(environment.apiUrl, credentials);
  }

  register(details: RegistrationDetails): Observable<unknown> {
    return this.http.post<unknown>(environment.registerApiUrl, details);
  }
}

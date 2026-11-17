import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthState } from './auth-state.service';
import { HouseholdService } from './household.service';

describe('HouseholdService', () => {
  let httpTesting: HttpTestingController;
  let householdService: HouseholdService;
  let authState: AuthState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    householdService = TestBed.inject(HouseholdService);
    authState = TestBed.inject(AuthState);
  });

  afterEach(() => {
    httpTesting.verify();
    authState.clear();
  });

  it('joins a household with its invitation code and the logged-in user token', () => {
    authState.setToken('user-token');
    householdService.joinHousehold('PISO-ABC123').subscribe();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/miembros-pisos`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ codigoInvitacion: 'PISO-ABC123' });
    expect(request.request.headers.get('Authorization')).toBe('Bearer user-token');
    request.flush(null);
  });
});

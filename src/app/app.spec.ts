import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoginPage } from './pages/login-page';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './services/auth.interceptor';
import { AuthState } from './services/auth-state.service';
import { environment } from '../environments/environment';

describe('AuthService', () => {
  let httpTesting: HttpTestingController;
  let authService: AuthService;
  let authState: AuthState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    authState = TestBed.inject(AuthState);
  });

  afterEach(() => {
    httpTesting.verify();
    authState.clear();
  });

  it('posts login credentials and stores the access token', () => {
    authService.login({ email: 'ana@example.com', password: 'clave-segura' }).subscribe();
    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.com', password: 'clave-segura' });
    request.flush({ accessToken: 'test-token' });
    expect(authState.token()).toBe('test-token');
  });

  it('stores the access token persistently when remember me is selected', () => {
    authService.login({ email: 'ana@example.com', password: 'clave-segura' }, true).subscribe();
    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/auth/login`);
    request.flush({ accessToken: 'remembered-token' });

    expect(localStorage.getItem('accessToken')).toBe('remembered-token');
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });

  it('registers with the documented user fields', () => {
    authService
      .register({
        nombre: 'Ana Pérez',
        userName: 'ana',
        email: 'ana@example.com',
        password: 'clave-segura',
      })
      .subscribe();
    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/usuarios`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Ana Pérez',
      userName: 'ana',
      email: 'ana@example.com',
      password: 'clave-segura',
    });
    request.flush(null);
  });

  it('does not send a stored token when registering', () => {
    authState.setToken('expired-token');
    authService
      .register({
        nombre: 'Ana Pérez',
        userName: 'ana',
        email: 'ana@example.com',
        password: 'clave-segura',
      })
      .subscribe();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/usuarios`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(null);
  });
});

describe('LoginPage', () => {
  it('explains that a password is required when the registration form is open', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.link-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La contraseña es obligatoria.');
    expect(fixture.nativeElement.textContent).toContain('Debe tener al menos 8 caracteres.');
  });

  it('shows the API validation reason when registration fails', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(LoginPage);
    const httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.link-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const values: Record<string, string> = {
      name: 'Ana Pérez',
      userName: 'ana',
      email: 'ana@example.com',
      password: 'clave-segura',
      confirmPassword: 'clave-segura',
    };
    for (const [name, value] of Object.entries(values)) {
      const input = fixture.nativeElement.querySelector(
        `input[name="${name}"]`,
      ) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/usuarios`);
    request.flush(
      { errors: [{ field: 'email', defaultMessage: 'ya está registrado' }] },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('email: ya está registrado');
    httpTesting.verify();
  });
});

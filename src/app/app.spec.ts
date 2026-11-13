import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach } from 'vitest';
import { App } from './app';
import { environment } from '../environments/environment';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the registration form', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Crea tu cuenta');
    expect(compiled.querySelector('input[name="name"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[name="password"]')).toBeTruthy();
    expect(compiled.querySelector('input[name="confirmPassword"]')).toBeTruthy();
  });

  it('should send registration details to the registration API', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const name = fixture.nativeElement.querySelector('input[name="name"]') as HTMLInputElement;
    const email = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPassword = fixture.nativeElement.querySelector(
      'input[name="confirmPassword"]',
    ) as HTMLInputElement;
    name.value = 'Ana Pérez';
    name.dispatchEvent(new Event('input'));
    email.value = 'ana@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'clave-segura-123';
    password.dispatchEvent(new Event('input'));
    confirmPassword.value = 'clave-segura-123';
    confirmPassword.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    const request = httpTesting.expectOne(environment.registerApiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'clave-segura-123',
    });
    request.flush({ ok: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tu cuenta se creó correctamente.');
  });

  it('should prevent registration when the passwords do not match', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const values: Record<string, string> = {
      name: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'clave-segura-123',
      confirmPassword: 'otra-clave-segura',
    };
    for (const [field, value] of Object.entries(values)) {
      const input = fixture.nativeElement.querySelector(`input[name="${field}"]`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    }
    fixture.detectChanges();
    await fixture.whenStable();

    const submitButton = fixture.nativeElement.querySelector('.submit-button') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Las contraseñas no coinciden.');
    httpTesting.expectNone(environment.registerApiUrl);
  });

  it('should keep login available and post credentials to the login API', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.mode-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const email = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;
    email.value = 'ana@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'clave-segura';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    const request = httpTesting.expectOne(environment.apiUrl);
    expect(request.request.body).toEqual({ email: 'ana@example.com', password: 'clave-segura' });
    request.flush({ ok: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sesión iniciada correctamente.');
  });
});

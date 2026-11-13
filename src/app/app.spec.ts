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

  it('should render the login form', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Inicia sesión');
    expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[name="password"]')).toBeTruthy();
  });

  it('should send the email and password to the login API', async () => {
    const fixture = TestBed.createComponent(App);
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
    fixture.detectChanges();

    const request = httpTesting.expectOne(environment.apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.com', password: 'clave-segura' });
    request.flush({ ok: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sesión iniciada correctamente.');
  });
});

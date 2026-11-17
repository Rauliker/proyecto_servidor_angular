import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { authInterceptor } from '../services/auth.interceptor';
import { AuthState } from '../services/auth-state.service';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let httpTesting: HttpTestingController;
  let authState: AuthState;

  beforeEach(async () => {
    await resolveComponentResources((url) => {
      if (!url.endsWith('home-page.html')) {
        throw new Error(`Unexpected component resource: ${url}`);
      }
      return readFile(resolve(process.cwd(), 'src', 'app', 'pages', 'home-page.html'), 'utf-8');
    });
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthState);
  });

  afterEach(() => {
    httpTesting.verify();
    authState.clear();
  });

  it('offers joining without a household and keeps the option available for another one', () => {
    authState.setToken('user-token');
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    httpTesting.expectOne(`${environment.apiBaseUrl}/pisos`).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Crea un piso o únete a uno');

    const invitationInput = fixture.nativeElement.querySelector(
      'input[name="invitationCode"]',
    ) as HTMLInputElement;
    invitationInput.value = 'PISO-ABC123';
    fixture.componentInstance['invitationCode'] = 'PISO-ABC123';
    fixture.detectChanges();
    fixture.componentInstance['joinHousehold']();

    const joinRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/miembros-pisos`);
    expect(joinRequest.request.method).toBe('POST');
    joinRequest.flush(null);
    httpTesting
      .expectOne(`${environment.apiBaseUrl}/pisos`)
      .flush([{ idPiso: 4, nombre: 'Piso compartido' }]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/tareas/piso/4`).flush([]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/gastos/piso/4`).flush([]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/miembros-pisos`).flush([]);
    fixture.detectChanges();

    const pisosButton = [...fixture.nativeElement.querySelectorAll('nav button')].find(
      (button) => button.textContent.trim() === 'Pisos',
    ) as HTMLButtonElement;
    pisosButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.join-form')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Unirme a otro piso');
  });
});

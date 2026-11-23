import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { AuthState } from '../services/auth-state.service';
import { authInterceptor } from '../services/auth.interceptor';
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
      .flush([{ IdPiso: 4, nombre: 'Piso compartido' }]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/tareas/piso/4`).flush([]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/gastos/piso/4`).flush([]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/miembros-pisos`).flush([]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/usuarios`).flush([]);
    fixture.detectChanges();

    const pisosButton = [...fixture.nativeElement.querySelectorAll('nav button')].find(
      (button) => button.textContent.trim() === 'Pisos',
    ) as HTMLButtonElement;
    pisosButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.join-form')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Unirme a otro piso');
  });

  it('does not request household data when a household has no valid idPiso', () => {
    authState.setToken('user-token');
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    httpTesting.expectOne(`${environment.apiBaseUrl}/pisos`).flush([{ nombre: 'Piso sin ID' }]);
    fixture.detectChanges();

    expect(httpTesting.match((request) => request.url.includes('/tareas/piso/')).length).toBe(0);
    expect(httpTesting.match((request) => request.url.includes('/gastos/piso/')).length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('La API devolvió pisos sin un idPiso válido.');
  });

  it('uses usernames from the users response in task, expense, and member views', () => {
    authState.setToken('user-token');
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    httpTesting
      .expectOne(`${environment.apiBaseUrl}/pisos`)
      .flush([{ IdPiso: 4, nombre: 'Piso compartido' }]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/tareas/piso/4`).flush([
      {
        IdTarea: 1,
        IdPiso: 4,
        IdUsuarioAsignado: '13',
        NombreUsuarioAsignado: 'Nombre en tarea',
        usuarioAsignado: { UserName: 'maria_dev', Nombre: 'Nombre anidado' },
        titulo: 'Limpiar',
        completada: false,
      },
    ]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/gastos/piso/4`).flush([
      {
        IdGasto: 2,
        IdPiso: 4,
        IdUsuarioPagador: '13',
        NombreUsuarioPagador: 'Nombre en gasto',
        usuarioPagador: { UserName: 'maria_dev', Nombre: 'Nombre anidado' },
        concepto: 'Compra',
        cantidad: 10,
        fecha: '2026-11-23',
      },
    ]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/miembros-pisos`).flush([
      {
        IdMiembroPiso: 3,
        IdPiso: 4,
        IdUsuario: '13',
        rol: 'Miembro',
        Usuario: { UserName: 'miembro_username', Nombre: 'Nombre de miembro' },
      },
    ]);
    const usersRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/usuarios`);
    expect(usersRequest.request.method).toBe('GET');
    expect(usersRequest.request.headers.get('Authorization')).toBe('Bearer user-token');
    usersRequest.flush([
      { idUsuario: 6, nombre: 'Ana Pérez', userName: 'ana' },
      { idUsuario: 7, nombre: 'Ana2 Pérez', userName: 'ana2' },
      { idUsuario: 8, nombre: 'Ana3 Pérez', userName: 'ana3' },
      { idUsuario: 9, nombre: 'Ana4 Pérez', userName: 'ana4' },
      { idUsuario: 10, nombre: 'admin12345', userName: 'admin12345' },
      { idUsuario: 11, nombre: 'admin123456', userName: 'admin123456' },
      { idUsuario: 12, nombre: 'ana123456', userName: 'ana123456' },
      { idUsuario: 13, nombre: 'Raul', userName: 'raul' },
    ]);

    fixture.componentInstance['selectView']('tasks');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('raul');
    expect(fixture.nativeElement.textContent).not.toContain('Usuario 13');
    expect(fixture.nativeElement.textContent).not.toContain('Nombre en tarea');

    fixture.componentInstance['selectView']('expenses');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('raul');
    expect(fixture.nativeElement.textContent).not.toContain('Usuario 13');
    expect(fixture.nativeElement.textContent).not.toContain('Nombre en gasto');

    fixture.componentInstance['selectView']('members');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('raul');
    expect(fixture.nativeElement.textContent).not.toContain('miembro_username');
    expect(fixture.nativeElement.textContent).not.toContain('Usuario 13');
  });

  it('leaves the selected household and shows the empty state when it was the last one', () => {
    const tokenPayload = btoa(JSON.stringify({ idUsuario: 13 }));
    authState.setToken(`header.${tokenPayload}.signature`);
    sessionStorage.setItem('selectedHouseholdId', '4');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    httpTesting
      .expectOne(`${environment.apiBaseUrl}/pisos`)
      .flush([{ IdPiso: 4, nombre: 'Piso compartido' }]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/tareas/piso/4`).flush([]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/gastos/piso/4`).flush([]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/miembros-pisos`).flush([]);
    httpTesting.expectOne(`${environment.apiBaseUrl}/usuarios`).flush([]);

    fixture.componentInstance['selectView']('households');
    fixture.detectChanges();
    const leaveButton = fixture.nativeElement.querySelector(
      '.household-entry .text-danger',
    ) as HTMLButtonElement;
    leaveButton.click();

    expect(confirmSpy).toHaveBeenCalledWith('¿Quieres salir del piso «Piso compartido»?');
    httpTesting.expectOne(`${environment.apiBaseUrl}/miembros-pisos`).flush([
      { idMiembro: 45, idPiso: 4, idUsuario: 12, rol: 'Miembro' },
      { idMiembro: 77, idPiso: 4, idUsuario: 13, rol: 'Miembro' },
    ]);
    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/miembros-pisos/77`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization')).toBe(
      `Bearer header.${tokenPayload}.signature`,
    );
    request.flush(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Crea un piso o únete a uno');
    expect(fixture.nativeElement.textContent).toContain('Has salido del piso.');
    expect(sessionStorage.getItem('selectedHouseholdId')).toBeNull();
    confirmSpy.mockRestore();
  });
});

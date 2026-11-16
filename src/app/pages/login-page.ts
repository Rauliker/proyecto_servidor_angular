import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

function getRegistrationErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'El navegador no pudo acceder a la API. Comprueba que el servidor permita CORS desde http://localhost:4200 y las peticiones OPTIONS.';
  }

  const body: unknown = error.error;
  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }

  if (typeof body === 'object' && body !== null) {
    const response = body as Record<string, unknown>;
    for (const key of ['message', 'detail', 'error_description']) {
      if (typeof response[key] === 'string' && response[key].trim()) {
        return response[key].trim();
      }
    }

    const errors = response['errors'] ?? response['fieldErrors'] ?? response['violations'];
    if (Array.isArray(errors)) {
      const messages = errors
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (typeof item === 'object' && item !== null) {
            const validation = item as Record<string, unknown>;
            const field = validation['field'] ?? validation['propertyPath'];
            const message = validation['defaultMessage'] ?? validation['message'];
            if (typeof message === 'string') {
              return typeof field === 'string' ? `${field}: ${message}` : message;
            }
          }
          return '';
        })
        .filter(Boolean);
      if (messages.length) {
        return messages.join(' ');
      }
    }

    if (typeof errors === 'object' && errors !== null) {
      const messages = Object.entries(errors).flatMap(([field, value]) => {
        const values = Array.isArray(value) ? value : [value];
        return values
          .filter((message): message is string => typeof message === 'string')
          .map((message) => `${field}: ${message}`);
      });
      if (messages.length) {
        return messages.join(' ');
      }
    }

    if (error.status === 409) {
      return 'Ya existe una cuenta con ese correo o nombre de usuario.';
    }

    if (error.status === 401) {
      return `La API respondió HTTP 401 (No autorizado) al registrar. ${
        typeof response['error'] === 'string' ? `Detalle: ${response['error']}.` : 'No devolvió una causa concreta.'
      } Comprueba que POST /usuarios permita crear cuentas sin iniciar sesión.`;
    }

    if (typeof response['error'] === 'string' && response['error'].trim()) {
      return response['error'].trim();
    }

    return `La API rechazó el registro (HTTP ${error.status}) y respondió: ${JSON.stringify(body)}`;
  }

  if (error.status === 409) {
    return 'Ya existe una cuenta con ese correo o nombre de usuario.';
  }

  if (error.status === 401) {
    return 'La API respondió HTTP 401 (No autorizado) al registrar y no devolvió una causa concreta. Comprueba que POST /usuarios permita crear cuentas sin iniciar sesión.';
  }

  return `La API rechazó el registro (HTTP ${error.status})${
    error.statusText ? `: ${error.statusText}` : ', sin más detalles.'
  }`;
}

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login-page',
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #f7f8fb;
      color: #17213a;
    }
    .auth-aside {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px clamp(28px, 7vw, 96px);
      color: white;
      background:
        radial-gradient(ellipse at 10% 85%, #4e65ff45, transparent 42%),
        linear-gradient(145deg, #101a3c, #263c77);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      color: inherit;
      text-decoration: none;
      font-weight: 700;
    }
    .brand-icon {
      display: grid;
      width: 38px;
      height: 38px;
      place-items: center;
      border: 1px solid #ffffff40;
      border-radius: 12px;
      background: #ffffff16;
    }
    .auth-aside > div {
      max-width: 480px;
    }
    .eyebrow {
      color: #b4c1ff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }
    .auth-aside h1 {
      font-size: clamp(38px, 5vw, 62px);
      letter-spacing: -0.05em;
      line-height: 1.08;
    }
    .auth-aside p:last-child {
      color: #c5cee3;
      line-height: 1.7;
    }
    .aside-foot {
      color: #aab6d1;
      font-size: 13px;
    }
    .auth-content {
      display: grid;
      min-height: 100vh;
      padding: 48px 28px;
      place-items: center;
    }
    .auth-card {
      width: min(100%, 410px);
    }
    .mobile-brand {
      display: none;
      margin-bottom: 42px;
    }
    .auth-card h2 {
      margin: 0;
      color: #17213a;
      font-size: 34px;
      letter-spacing: -0.04em;
    }
    .subtitle {
      margin: 10px 0 30px;
      color: #6d7484;
    }
    .field {
      display: block;
      margin-bottom: 18px;
      color: #273149;
      font-size: 13px;
      font-weight: 600;
    }
    .field span {
      display: block;
      margin-bottom: 8px;
    }
    .field input {
      width: 100%;
      height: 48px;
      padding: 0 14px;
      border: 1px solid #dfe3eb;
      border-radius: 9px;
      outline: none;
      background: white;
      color: #17213a;
      font: inherit;
      font-weight: 400;
    }
    .field input:focus {
      border-color: #536fe5;
      box-shadow: 0 0 0 3px #536fe521;
    }
    .field small {
      display: block;
      margin-top: 6px;
      color: #bd3030;
      font-weight: 400;
    }
    .password-requirements {
      display: grid;
      gap: 5px;
      margin: 8px 0 0;
      padding: 0;
      color: #bd3030;
      font-size: 12px;
      font-weight: 400;
      list-style: none;
    }
    .password-requirements li::before {
      margin-right: 7px;
      content: '•';
    }
    .password-requirements li.met {
      color: #18764b;
    }
    .password-requirements li.met::before {
      content: '✓';
    }
    .primary-button {
      width: 100%;
      min-height: 50px;
      margin-top: 8px;
      border: 0;
      border-radius: 9px;
      background: #3455d1;
      color: #fff;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
    }
    .primary-button:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }
    .message {
      font-size: 13px;
      line-height: 1.5;
    }
    .error {
      color: #bd3030;
    }
    .success {
      color: #18764b;
    }
    .switch-copy {
      margin-top: 22px;
      color: #6d7484;
      font-size: 13px;
      text-align: center;
    }
    .link-button {
      padding: 0;
      border: 0;
      background: transparent;
      color: #3455d1;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
    }
    @media (max-width: 760px) {
      .auth-page {
        grid-template-columns: 1fr;
      }
      .auth-aside {
        display: none;
      }
      .auth-content {
        padding: 32px 24px;
      }
      .mobile-brand {
        display: flex;
      }
    }
  `],
  template: `
    <main class="auth-page">
      <section class="auth-aside">
        <a class="brand" routerLink="/" aria-label="Quién hizo qué">
          <span class="brand-icon">Q</span>
          <span>¿Quién hizo qué?</span>
        </a>
        <div>
          <p class="eyebrow">Convivir, más fácil</p>
          <h1>Un hogar compartido funciona mejor en equipo.</h1>
          <p>Organiza tareas y gastos de tu piso desde un solo lugar.</p>
        </div>
        <span class="aside-foot">Tareas claras. Cuentas al día.</span>
      </section>

      <section class="auth-content" aria-labelledby="form-title">
        <div class="auth-card">
          <a class="brand mobile-brand" routerLink="/">
            <span class="brand-icon">Q</span>
            <span>¿Quién hizo qué?</span>
          </a>
          @if (isRegistering) {
            <h2 id="form-title">Crea tu cuenta</h2>
            <p class="subtitle">Empieza a organizar tu piso.</p>
          } @else {
            <h2 id="form-title">Bienvenido de nuevo</h2>
            <p class="subtitle">Inicia sesión para continuar.</p>
          }

          <form (ngSubmit)="submit()" #authForm="ngForm">
            @if (isRegistering) {
              <label class="field">
                <span>Nombre</span>
                <input name="name" [(ngModel)]="name" autocomplete="name" required />
              </label>
              <label class="field">
                <span>Nombre de usuario</span>
                <input name="userName" [(ngModel)]="userName" autocomplete="username" required />
              </label>
            }
            <label class="field">
              <span>Correo electrónico</span>
              <input
                type="email"
                name="email"
                [(ngModel)]="email"
                autocomplete="email"
                required
                email
              />
            </label>
            <label class="field">
              <span>Contraseña</span>
              <input
                type="password"
                name="password"
                [(ngModel)]="password"
                [attr.autocomplete]="isRegistering ? 'new-password' : 'current-password'"
                [minlength]="isRegistering ? 8 : 1"
                required
              />
              @if (isRegistering) {
                <ul class="password-requirements" aria-label="Requisitos de la contraseña">
                  <li [class.met]="password.length > 0">La contraseña es obligatoria.</li>
                  <li [class.met]="password.length >= 8">Debe tener al menos 8 caracteres.</li>
                </ul>
              }
            </label>
            @if (isRegistering) {
              <label class="field">
                <span>Repite la contraseña</span>
                <input
                  type="password"
                  name="confirmPassword"
                  [(ngModel)]="confirmPassword"
                  autocomplete="new-password"
                  required
                />
                @if (confirmPassword && confirmPassword !== password) {
                  <small>Las contraseñas no coinciden.</small>
                }
              </label>
            }

            <button
              class="primary-button"
              type="submit"
              [disabled]="authForm.invalid || isLoading() || (isRegistering && confirmPassword !== password)"
            >
              {{ isLoading() ? 'Conectando…' : isRegistering ? 'Crear cuenta' : 'Iniciar sesión' }}
            </button>
            @if (errorMessage()) {
              <p class="message error" role="alert">{{ errorMessage() }}</p>
            }
            @if (successMessage()) {
              <p class="message success" role="status">{{ successMessage() }}</p>
            }
          </form>

          <p class="switch-copy">
            {{ isRegistering ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?' }}
            <button type="button" class="link-button" (click)="toggleMode()">
              {{ isRegistering ? 'Inicia sesión' : 'Regístrate' }}
            </button>
          </p>
        </div>
      </section>
    </main>
  `,
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected isRegistering = false;
  protected name = '';
  protected userName = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal(
    (this.router.getCurrentNavigation()?.extras.state?.['message'] as string | undefined) ?? '',
  );
  protected readonly successMessage = signal('');

  protected toggleMode(): void {
    this.isRegistering = !this.isRegistering;
    this.password = '';
    this.confirmPassword = '';
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  protected submit(): void {
    if (this.isLoading() || (this.isRegistering && this.password !== this.confirmPassword)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    const request = this.isRegistering
      ? this.authService.register({
          nombre: this.name.trim(),
          userName: this.userName.trim(),
          email: this.email.trim(),
          password: this.password,
        })
      : this.authService.login({ email: this.email.trim(), password: this.password });

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        if (this.isRegistering) {
          this.isRegistering = false;
          this.password = '';
          this.confirmPassword = '';
          this.successMessage.set('Tu cuenta se creó correctamente. Ya puedes iniciar sesión.');
          return;
        }
        void this.router.navigateByUrl('/');
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          this.isRegistering
            ? getRegistrationErrorMessage(error)
            : error.status === 0
            ? 'El navegador no pudo acceder a la API. Comprueba que el servidor permita CORS desde http://localhost:4200 y las peticiones OPTIONS.'
            : error.status === 401
              ? 'El correo o la contraseña no son correctos.'
              : 'No se pudo completar la operación. Revisa los datos e inténtalo de nuevo.',
        );
        this.isLoading.set(false);
      },
    });
  }
}

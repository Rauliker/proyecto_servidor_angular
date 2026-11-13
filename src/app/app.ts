import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly authService = inject(AuthService);

  protected isRegistering = true;
  protected name = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';
  protected showPassword = false;
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected toggleMode(): void {
    this.isRegistering = !this.isRegistering;
    this.name = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  protected submit(): void {
    if (this.isLoading()) {
      return;
    }

    if (this.isRegistering && this.password !== this.confirmPassword) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    const request = this.isRegistering
      ? this.authService.register({
          name: this.name,
          email: this.email,
          password: this.password,
        })
      : this.authService.login({
          email: this.email,
          password: this.password,
        });

    request
      .subscribe({
        next: () => {
          this.successMessage.set(
            this.isRegistering ? 'Tu cuenta se creó correctamente.' : 'Sesión iniciada correctamente.',
          );
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.status === 0
              ? 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'
              : error.status === 401
                ? 'El correo o la contraseña no son correctos.'
                : 'No se pudo iniciar sesión. Inténtalo de nuevo más tarde.',
          );
          this.isLoading.set(false);
        },
      });
  }
}

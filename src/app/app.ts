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

  protected email = '';
  protected password = '';
  protected showPassword = false;
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected login(): void {
    if (this.isLoading()) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    this.authService
      .login({
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Sesión iniciada correctamente.');
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

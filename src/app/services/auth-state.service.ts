import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly storage = isPlatformBrowser(inject(PLATFORM_ID)) ? sessionStorage : null;
  readonly token = signal(this.storage?.getItem('accessToken') ?? null);

  setToken(token: string): void {
    this.storage?.setItem('accessToken', token);
    this.token.set(token);
  }

  clear(): void {
    this.storage?.removeItem('accessToken');
    this.storage?.removeItem('selectedHouseholdId');
    this.token.set(null);
  }
}

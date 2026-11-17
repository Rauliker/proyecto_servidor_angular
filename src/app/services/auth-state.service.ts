import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly storage = isPlatformBrowser(inject(PLATFORM_ID))
    ? { session: window.sessionStorage, persistent: window.localStorage }
    : null;
  readonly token = signal(
    this.storage?.persistent.getItem('accessToken') ??
      this.storage?.session.getItem('accessToken') ??
      null,
  );

  setToken(token: string, rememberMe = false): void {
    if (rememberMe) {
      this.storage?.persistent.setItem('accessToken', token);
      this.storage?.session.removeItem('accessToken');
    } else {
      this.storage?.session.setItem('accessToken', token);
      this.storage?.persistent.removeItem('accessToken');
    }
    this.token.set(token);
  }

  clear(): void {
    this.storage?.persistent.removeItem('accessToken');
    this.storage?.persistent.removeItem('selectedHouseholdId');
    this.storage?.session.removeItem('accessToken');
    this.storage?.session.removeItem('selectedHouseholdId');
    this.token.set(null);
  }
}

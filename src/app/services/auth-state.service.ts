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

  userId(): number | null {
    const payload = this.token()?.split('.')[1];
    if (!payload) return null;

    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const decoded = atob(paddedBase64);
      const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
      const claims = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
      const claim =
        claims['idUsuario'] ??
        claims['IdUsuario'] ??
        claims['userId'] ??
        claims['user_id'] ??
        claims['id'] ??
        claims['sub'];
      const userId = Number(claim);
      return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
    } catch {
      return null;
    }
  }

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

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthState } from './auth-state.service';

@Component({ standalone: true, template: '' })
class ProtectedPage {}

@Component({ standalone: true, template: '' })
class LoginPage {}

describe('authGuard', () => {
  it('redirects unauthenticated visits to the login page', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'protected', component: ProtectedPage, canActivate: [authGuard] },
          { path: 'login', component: LoginPage },
        ]),
      ],
    }).compileComponents();
    TestBed.inject(AuthState).clear();

    await TestBed.inject(Router).navigateByUrl('/protected');

    expect(TestBed.inject(Router).url).toBe('/login');
  });
});

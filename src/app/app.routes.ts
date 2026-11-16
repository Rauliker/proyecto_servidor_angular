import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/login-page';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: '', component: HomePage, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];

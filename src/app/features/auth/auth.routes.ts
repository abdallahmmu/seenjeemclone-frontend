import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    title: 'Log in',
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
    title: 'Sign up',
  },
  {
    path: 'accept-invite',
    loadComponent: () => import('./accept-invite/accept-invite.component').then((m) => m.AcceptInviteComponent),
    title: 'Accept invite',
  },
];

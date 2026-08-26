import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-settings/profile-settings.component').then((m) => m.ProfileSettingsComponent),
  },
];

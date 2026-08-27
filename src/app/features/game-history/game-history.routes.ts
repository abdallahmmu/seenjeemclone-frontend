import { Routes } from '@angular/router';

export const GAME_HISTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./game-history.component').then((m) => m.GameHistoryComponent),
  },
];

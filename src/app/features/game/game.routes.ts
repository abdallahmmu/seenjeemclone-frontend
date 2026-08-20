import { Routes } from '@angular/router';

export const GAME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./setup/setup.component').then((m) => m.SetupComponent),
    title: 'Set up game',
  },
  {
    path: ':sessionId',
    loadComponent: () => import('./board/board.component').then((m) => m.BoardComponent),
    title: 'Play',
  },
  {
    path: ':sessionId/results',
    loadComponent: () => import('./results/results.component').then((m) => m.ResultsComponent),
    title: 'Results',
  },
];

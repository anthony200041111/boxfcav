import { Routes } from '@angular/router';
export const COACH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/coach-dashboard.component').then(m => m.CoachDashboardComponent)
  }
];
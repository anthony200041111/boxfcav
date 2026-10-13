import { Routes } from '@angular/router';
export const ATHLETE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/athlete-dashboard.component').then(m => m.AthleteDashboardComponent)
  }
];
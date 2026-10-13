import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/pages/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'athlete',
    canActivate: [authGuard, roleGuard],
    data: { role: 'athlete' },
    loadChildren: () => import('./features/athlete/athlete.routes').then(m => m.ATHLETE_ROUTES)
  },
  {
    path: 'coach',
    canActivate: [authGuard, roleGuard],
    data: { role: 'coach' },
    loadChildren: () => import('./features/coach/coach.routes').then(m => m.COACH_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/pages/register-page.component').then(m => m.RegisterPageComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/pages/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' }
];
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'] as string;
  const userProfile = authService.currentUserProfile();

  if (userProfile && userProfile.rol === expectedRole) {
    return true;
  }

  router.navigate(['/auth']);
  return false;
};
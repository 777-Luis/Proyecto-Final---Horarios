import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const superAdminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const user = authService.currentUserValue();

  if (user && user.isSuperAdmin === true) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

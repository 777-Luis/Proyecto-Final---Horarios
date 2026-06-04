import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as string[];
  const currentRole = authService.currentRole();

  if (allowedRoles && currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  // Si no tiene permisos, lo devolvemos al panel unificado o dashboard neutral
  return router.parseUrl('/dashboard');
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/** Reads allowed roles from `route.data['roles']`, e.g. `data: { roles: ['ADMIN','SUPER_ADMIN'] }`. */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] as UserRole[] | undefined) ?? [];

  const role = authService.currentUser()?.role;
  if (role && allowedRoles.includes(role)) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isSuperAdmin() ? true : router.createUrlTree(['/admin']);
};

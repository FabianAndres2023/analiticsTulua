import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth.service';

export function permissionGuard(
  requiredPermissions: string[],
  mode: 'any' | 'all' = 'all'
): CanActivateFn {
  return async (_route, state) => {
    const authService =
      inject(AuthService);

    const router =
      inject(Router);

    const session =
      await authService.getSession();

    if (!session) {
      return router.createUrlTree(
        ['/login'],
        {
          queryParams: {
            returnUrl: state.url
          }
        }
      );
    }

    /*
     * Estos métodos usan la información en caché
     * cuando ya fue cargada, por lo que no deberían
     * repetir consultas innecesariamente.
     */
    const profile =
      await authService.getCurrentProfile();

    if (!profile || !profile.active) {
      return router.createUrlTree(
        ['/acceso-denegado'],
        {
          queryParams: {
            reason: 'inactive'
          }
        }
      );
    }

    await authService.getCurrentPermissions();

    /*
     * El Administrador activo tiene acceso total.
     */
    if (authService.isAdministrator()) {
      return true;
    }

    const authorized =
      mode === 'any'
        ? authService.hasAnyPermission(
            requiredPermissions
          )
        : authService.hasAllPermissions(
            requiredPermissions
          );

    if (authorized) {
      return true;
    }

    return router.createUrlTree(
      ['/acceso-denegado'],
      {
        queryParams: {
          returnUrl: state.url
        }
      }
    );
  };
}
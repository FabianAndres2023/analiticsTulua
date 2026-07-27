import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth.service';

export const configuracionRedirectGuard: CanActivateFn =
  async (_route, state) => {
    const authService =
      inject(AuthService);

    const router =
      inject(Router);

    /*
     * El guard también se ejecuta cuando se visita
     * una ruta hija de Configuración.
     *
     * En ese caso no debe redirigir, porque cada ruta
     * hija tiene su propio permissionGuard.
     */
    const urlSinParametros =
      state.url.split('?')[0].replace(/\/+$/, '');

    if (
      urlSinParametros !== '/configuracion'
    ) {
      return true;
    }

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
     * El administrador entra inicialmente
     * al módulo de Usuarios.
     */
    if (authService.isAdministrator()) {
      return router.createUrlTree([
        '/configuracion/usuarios'
      ]);
    }

    const rutasPermitidas = [
      {
        permiso: 'usuarios.ver',
        ruta: '/configuracion/usuarios'
      },
      {
        permiso: 'roles.ver',
        ruta: '/configuracion/roles'
      },
      {
        permiso: 'dependencias.ver',
        ruta: '/configuracion/dependencias'
      },
      {
        permiso: 'carga_masiva.ver',
        ruta: '/configuracion/carga-masiva'
      }
    ];

    for (const item of rutasPermitidas) {
      const tienePermiso =
        authService.hasAnyPermission([
          item.permiso
        ]);

      if (tienePermiso) {
        return router.createUrlTree([
          item.ruta
        ]);
      }
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
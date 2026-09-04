import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  AuthService
} from '../services/auth.service';


export const configuracionRedirectGuard:
  CanActivateFn =
  async (_route, state) => {

    const authService =
      inject(AuthService);

    const router =
      inject(Router);


    /* =====================================================
     * VALIDAR SESIÓN
     * ===================================================== */

    const session =
      await authService
        .getSession();


    if (!session) {

      return router.createUrlTree(
        [
          '/login'
        ],
        {
          queryParams: {
            returnUrl:
              state.url
          }
        }
      );

    }


    /* =====================================================
     * VALIDAR PERFIL
     * ===================================================== */

    const profile =
      await authService
        .getCurrentProfile();


    if (
      !profile ||
      !profile.active
    ) {

      return router.createUrlTree(
        [
          '/acceso-denegado'
        ],
        {
          queryParams: {
            reason:
              'inactive'
          }
        }
      );

    }


    /* =====================================================
     * CARGAR PERMISOS
     * ===================================================== */

    await authService
      .getCurrentPermissions();


    /* =====================================================
     * ADMINISTRADOR
     * ===================================================== */

    if (
      authService
        .isAdministrator()
    ) {

      return router.createUrlTree(
        [
          '/configuracion/usuarios'
        ]
      );

    }


    /* =====================================================
     * PRIMER MÓDULO PERMITIDO
     * ===================================================== */

    const rutasPermitidas = [

      {
        permiso:
          'usuarios.ver',

        ruta:
          '/configuracion/usuarios'
      },

      {
        permiso:
          'roles.ver',

        ruta:
          '/configuracion/roles'
      },

      {
        permiso:
          'dependencias.ver',

        ruta:
          '/configuracion/dependencias'
      },

      {
        permiso:
          'carga_masiva.ver',

        ruta:
          '/configuracion/carga-masiva'
      }

    ];


    for (
      const item
      of rutasPermitidas
    ) {

      const tienePermiso =
        authService
          .hasAnyPermission([
            item.permiso
          ]);


      if (
        tienePermiso
      ) {

        return router.createUrlTree(
          [
            item.ruta
          ]
        );

      }

    }


    /* =====================================================
     * SIN PERMISOS
     * ===================================================== */

    return router.createUrlTree(
      [
        '/acceso-denegado'
      ],
      {
        queryParams: {
          returnUrl:
            state.url
        }
      }
    );

  };
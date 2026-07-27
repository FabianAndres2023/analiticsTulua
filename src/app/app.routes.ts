import { Routes } from '@angular/router';

import { Login } from './pages/login/login';

import { Dashboard } from './pages/dashboard/dashboard';
import { Ambiente } from './pages/ambiente/ambiente';
import { Movilidad } from './pages/movilidad/movilidad';
import { OcioTurismo } from './pages/ocio-turismo/ocio-turismo';

import {
  AccesoDenegado
} from './pages/acceso-denegado/acceso-denegado';

import {
  Configuracion
} from './pages/configuracion/configuracion';

import {
  Usuarios
} from './pages/configuracion/usuarios/usuarios';

import {
  Roles
} from './pages/configuracion/roles/roles';

import {
  Dependencias
} from './pages/configuracion/dependencias/dependencias';

import {
  CargaMasiva
} from './pages/configuracion/carga-masiva/carga-masiva';

import {
  authGuard
} from './core/guards/auth.guard';

import {
  guestGuard
} from './core/guards/guest.guard';

import {
  permissionGuard
} from './core/guards/permission.guard';

import {
  configuracionRedirectGuard
} from './core/guards/configuracion-redirect.guard';

import {
  PrivateLayout
} from './layout/private-layout/private-layout';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [
      guestGuard
    ]
  },

  {
    path: '',
    component: PrivateLayout,
    canActivate: [
      authGuard
    ],

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'acceso-denegado',
        component: AccesoDenegado
      },

      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [
          permissionGuard([
            'dashboard.ver'
          ])
        ]
      },

      {
        path: 'ambiente',
        component: Ambiente,
        canActivate: [
          permissionGuard([
            'ambiente.ver'
          ])
        ]
      },

      {
        path: 'movilidad',
        component: Movilidad,
        canActivate: [
          permissionGuard([
            'movilidad.ver'
          ])
        ]
      },

      {
        path: 'ocio-turismo',
        component: OcioTurismo,
        canActivate: [
          permissionGuard([
            'turismo.ver'
          ])
        ]
      },

      {
        path: 'configuracion',
        component: Configuracion,

        /*
         * El primer guard redirige a la primera
         * sección permitida cuando se entra exactamente
         * a /configuracion.
         *
         * El segundo permite abrir Configuración cuando
         * el usuario posee al menos uno de sus permisos.
         */
        canActivate: [
          configuracionRedirectGuard,

          permissionGuard(
            [
              'usuarios.ver',
              'roles.ver',
              'dependencias.ver',
              'carga_masiva.ver'
            ],
            'any'
          )
        ],

        children: [
          {
            path: 'usuarios',
            component: Usuarios,
            canActivate: [
              permissionGuard([
                'usuarios.ver'
              ])
            ]
          },

          {
            path: 'roles',
            component: Roles,
            canActivate: [
              permissionGuard([
                'roles.ver'
              ])
            ]
          },

          {
            path: 'dependencias',
            component: Dependencias,
            canActivate: [
              permissionGuard([
                'dependencias.ver'
              ])
            ]
          },

          {
            path: 'carga-masiva',
            component: CargaMasiva,
            canActivate: [
              permissionGuard([
                'carga_masiva.ver'
              ])
            ]
          }
        ]
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];
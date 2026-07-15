import { Routes } from '@angular/router';

import { Login } from './pages/login/login';

import { Dashboard } from './pages/dashboard/dashboard';
import { Ambiente } from './pages/ambiente/ambiente';
import { Movilidad } from './pages/movilidad/movilidad';
import { OcioTurismo } from './pages/ocio-turismo/ocio-turismo';

import { Configuracion } from './pages/configuracion/configuracion';
import { Usuarios } from './pages/configuracion/usuarios/usuarios';
import { Roles } from './pages/configuracion/roles/roles';
import { Dependencias } from './pages/configuracion/dependencias/dependencias';
import { Parametros } from './pages/configuracion/parametros/parametros';
import { CargaMasiva } from './pages/configuracion/carga-masiva/carga-masiva';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

import { PrivateLayout } from './layout/private-layout/private-layout';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard]
  },

  {
    path: '',
    component: PrivateLayout,
    canActivate: [authGuard],

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: Dashboard
      },

      {
        path: 'ambiente',
        component: Ambiente
      },

      {
        path: 'movilidad',
        component: Movilidad
      },

      {
        path: 'ocio-turismo',
        component: OcioTurismo
      },

      {
        path: 'configuracion',
        component: Configuracion,

        children: [
          {
            path: '',
            redirectTo: 'usuarios',
            pathMatch: 'full'
          },

          {
            path: 'usuarios',
            component: Usuarios
          },

          {
            path: 'roles',
            component: Roles
          },

          {
            path: 'dependencias',
            component: Dependencias
          },

          {
            path: 'parametros',
            component: Parametros
          },

          {
            path: 'carga-masiva',
            component: CargaMasiva
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
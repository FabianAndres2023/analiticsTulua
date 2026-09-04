import {
  Routes
} from '@angular/router';


/* =========================================================
 * PÁGINAS PRINCIPALES
 * ========================================================= */

import {
  Login
} from './pages/login/login';

import {
  Dashboard
} from './pages/dashboard/dashboard';

import {
  Ambiente
} from './pages/ambiente/ambiente';

import {
  Movilidad
} from './pages/movilidad/movilidad';


/* =========================================================
 * MOVILIDAD
 * ========================================================= */

import {
  CentroDatosWaze
} from './pages/movilidad/centro-datos-waze/centro-datos-waze';

import {
  SiniestrosViales
} from './pages/movilidad/siniestros-viales/siniestros-viales';

import {
  Semaforica
} from './pages/movilidad/semaforica/semaforica';


/* =========================================================
 * OCIO Y TURISMO
 * ========================================================= */

import {
  OcioTurismo
} from './pages/ocio-turismo/ocio-turismo';

import {
  ActivosTurismo
} from './pages/ocio-turismo/activos-turismo/activos-turismo';


/* =========================================================
 * AMBIENTE
 * ========================================================= */

import {
  EstacionMeteorologica
} from './pages/ambiente/estacion-meteorologica/estacion-meteorologica';


/* =========================================================
 * ACCESO DENEGADO
 * ========================================================= */

import {
  AccesoDenegado
} from './pages/acceso-denegado/acceso-denegado';


/* =========================================================
 * CONFIGURACIÓN
 * ========================================================= */

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


/* =========================================================
 * GUARDS
 * ========================================================= */

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


/* =========================================================
 * LAYOUT PRIVADO
 * ========================================================= */

import {
  PrivateLayout
} from './layout/private-layout/private-layout';


/* =========================================================
 * RUTAS
 * ========================================================= */

export const routes:
  Routes = [


  /* =======================================================
   * RUTA PÚBLICA EMBED
   * ======================================================= */

  {
    path:
      'embed/centro-datos-waze',

    component:
      CentroDatosWaze,

    data: {
      embed:
        true
    }
  },


  /* =======================================================
   * LOGIN
   * ======================================================= */

  {
    path:
      'login',

    component:
      Login,

    canActivate: [
      guestGuard
    ]
  },


  /* =======================================================
   * ÁREA PRIVADA
   * ======================================================= */

  {
    path:
      '',

    component:
      PrivateLayout,

    canActivate: [
      authGuard
    ],

    children: [


      /* ===================================================
       * REDIRECCIÓN INICIAL
       * =================================================== */

      {
        path:
          '',

        redirectTo:
          'dashboard',

        pathMatch:
          'full'
      },


      /* ===================================================
       * ACCESO DENEGADO
       * =================================================== */

      {
        path:
          'acceso-denegado',

        component:
          AccesoDenegado
      },


      /* ===================================================
       * DASHBOARD
       * =================================================== */

      {
        path:
          'dashboard',

        component:
          Dashboard,

        canActivate: [
          permissionGuard([
            'dashboard.ver'
          ])
        ]
      },


      /* ===================================================
       * AMBIENTE
       * =================================================== */

      {
        path:
          'ambiente',

        component:
          Ambiente,

        canActivate: [
          permissionGuard([
            'ambiente.ver'
          ])
        ],

        children: [

          {
            path:
              '',

            redirectTo:
              'estacion-meteorologica',

            pathMatch:
              'full'
          },

          {
            path:
              'estacion-meteorologica',

            component:
              EstacionMeteorologica
          }

        ]
      },


      /* ===================================================
       * MOVILIDAD
       * =================================================== */

      {
        path:
          'movilidad',

        component:
          Movilidad,

        canActivate: [
          permissionGuard([
            'movilidad.ver'
          ])
        ],

        children: [


          /* ===============================================
           * REDIRECCIÓN INICIAL
           * =============================================== */

          {
            path:
              '',

            redirectTo:
              'centro-datos-waze',

            pathMatch:
              'full'
          },


          /* ===============================================
           * CENTRO DE DATOS WAZE
           * =============================================== */

          {
            path:
              'centro-datos-waze',

            component:
              CentroDatosWaze
          },


          /* ===============================================
           * SINIESTROS VIALES
           * =============================================== */

          {
            path:
              'siniestros-viales',

            component:
              SiniestrosViales
          },


          /* ===============================================
           * SEMAFÓRICA
           * =============================================== */

          {
            path:
              'semaforica',

            component:
              Semaforica
          }

        ]
      },


      /* ===================================================
       * OCIO Y TURISMO
       * =================================================== */

      {
        path:
          'ocio-turismo',

        component:
          OcioTurismo,

        canActivate: [
          permissionGuard([
            'turismo.ver'
          ])
        ],

        children: [


          /* ===============================================
           * REDIRECCIÓN INICIAL
           * =============================================== */

          {
            path:
              '',

            redirectTo:
              'activos-turismo',

            pathMatch:
              'full'
          },


          /* ===============================================
           * ACTIVOS TURÍSTICOS
           * =============================================== */

          {
            path:
              'activos-turismo',

            component:
              ActivosTurismo
          }

        ]
      },


      /* ===================================================
       * CONFIGURACIÓN
       * =================================================== */

      {
        path:
          'configuracion',

        component:
          Configuracion,

        canActivate: [

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


          /* ===============================================
           * REDIRECCIÓN AUTOMÁTICA
           * =============================================== */

          {
            path:
              '',

            pathMatch:
              'full',

            canActivate: [
              configuracionRedirectGuard
            ],

            children: []
          },


          /* ===============================================
           * USUARIOS
           * =============================================== */

          {
            path:
              'usuarios',

            component:
              Usuarios,

            canActivate: [
              permissionGuard([
                'usuarios.ver'
              ])
            ]
          },


          /* ===============================================
           * ROLES Y PERMISOS
           * =============================================== */

          {
            path:
              'roles',

            component:
              Roles,

            canActivate: [
              permissionGuard([
                'roles.ver'
              ])
            ]
          },


          /* ===============================================
           * DEPENDENCIAS
           * =============================================== */

          {
            path:
              'dependencias',

            component:
              Dependencias,

            canActivate: [
              permissionGuard([
                'dependencias.ver'
              ])
            ]
          },


          /* ===============================================
           * CARGA MASIVA
           * =============================================== */

          {
            path:
              'carga-masiva',

            component:
              CargaMasiva,

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


  /* =======================================================
   * RUTA NO ENCONTRADA
   * ======================================================= */

  {
    path:
      '**',

    redirectTo:
      ''
  }

];
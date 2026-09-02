import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  LucideCar,
  LucideCloudSun,
  LucideDroplets,
  LucideTriangleAlert
} from '@lucide/angular';

import {
  AuthService
} from '../../core/services/auth.service';

import {
  SupabaseService
} from '../../core/services/supabase.service';


/* =========================================================
 * INTERFACES
 * ========================================================= */

interface ResumenInicio {

  temperatura_promedio_30d:
    number |
    null;

  humedad_promedio_30d:
    number |
    null;

  velocidad_waze_promedio_30d:
    number |
    null;

  siniestros_anio_actual:
    number;

  anio_actual:
    number;

}


/* =========================================================
 * COMPONENTE
 * ========================================================= */

@Component({

  selector:
    'app-dashboard',

  imports: [

    LucideCloudSun,

    LucideDroplets,

    LucideCar,

    LucideTriangleAlert

  ],

  templateUrl:
    './dashboard.html',

  styleUrl:
    './dashboard.scss'

})
export class Dashboard
  implements OnInit, OnDestroy {


  /* =======================================================
   * SERVICIOS
   * ======================================================= */

  private readonly authService =
    inject(
      AuthService
    );


  private readonly supabaseService =
    inject(
      SupabaseService
    );


  /* =======================================================
   * USUARIO
   * ======================================================= */

  readonly profile =
    this.authService
      .currentProfile;


  readonly currentUser =
    this.authService
      .currentUser;


  readonly loadingUser =
    this.authService
      .loadingProfile;


  readonly userName =
    computed(
      () => {

        const profile =
          this.profile();


        const user =
          this.currentUser();


        return (

          profile
            ?.full_name
            ?.trim() ||

          user
            ?.user_metadata
            ?.[
              'full_name'
            ]
            ?.trim() ||

          user
            ?.user_metadata
            ?.[
              'name'
            ]
            ?.trim() ||

          user
            ?.email
            ?.split(
              '@'
            )[0] ||

          'Usuario'

        );

      }
    );


  /* =======================================================
   * ESTADO DEL DASHBOARD
   * ======================================================= */

  readonly resumen =
    signal<
      ResumenInicio |
      null
    >(
      null
    );


  readonly loadingIndicators =
    signal(
      true
    );


  readonly indicatorsError =
    signal<
      string |
      null
    >(
      null
    );


  /* =======================================================
   * VALORES FORMATEADOS
   * ======================================================= */

  readonly temperatura =
    computed(
      () => {

        const value =
          this
            .resumen()
            ?.temperatura_promedio_30d;


        if (
          value === null ||
          value === undefined
        ) {

          return '--';

        }


        return Number(
          value
        )
          .toFixed(
            1
          );

      }
    );


  readonly humedad =
    computed(
      () => {

        const value =
          this
            .resumen()
            ?.humedad_promedio_30d;


        if (
          value === null ||
          value === undefined
        ) {

          return '--';

        }


        return Number(
          value
        )
          .toFixed(
            1
          );

      }
    );


  readonly velocidadWaze =
    computed(
      () => {

        const value =
          this
            .resumen()
            ?.velocidad_waze_promedio_30d;


        if (
          value === null ||
          value === undefined
        ) {

          return '--';

        }


        return Number(
          value
        )
          .toFixed(
            1
          );

      }
    );


  readonly totalSiniestros =
    computed(
      () => {

        const value =
          this
            .resumen()
            ?.siniestros_anio_actual;


        if (
          value === null ||
          value === undefined
        ) {

          return '--';

        }


        return Number(
          value
        )
          .toLocaleString(
            'es-CO'
          );

      }
    );


  readonly anioActual =
    computed(
      () => {

        return (

          this
            .resumen()
            ?.anio_actual ??

          new Date()
            .getFullYear()

        );

      }
    );


  /* =======================================================
   * ACTUALIZACIÓN AUTOMÁTICA
   * ======================================================= */

  private refreshIntervalId:
    ReturnType<
      typeof setInterval
    > |
    null =
      null;


  private readonly refreshIntervalMs =
    60_000;


  /* =======================================================
   * CICLO DE VIDA
   * ======================================================= */

  ngOnInit():
    void {

    /*
     * Primera carga al ingresar al Inicio.
     */

    void this
      .cargarResumen();


    /*
     * Mientras el usuario permanezca en el Dashboard,
     * consultamos nuevamente los indicadores cada minuto.
     */

    this.refreshIntervalId =
      setInterval(
        () => {

          void this
            .cargarResumen(
              true
            );

        },
        this.refreshIntervalMs
      );

  }


  ngOnDestroy():
    void {

    /*
     * Detenemos el intervalo al abandonar el Dashboard
     * para evitar consultas innecesarias.
     */

    if (
      this.refreshIntervalId !==
      null
    ) {

      clearInterval(
        this.refreshIntervalId
      );


      this.refreshIntervalId =
        null;

    }

  }


  /* =======================================================
   * CONSULTAR INDICADORES
   * ======================================================= */

  private async cargarResumen(
    actualizacionSilenciosa =
      false
  ):
    Promise<void> {


    if (
      !actualizacionSilenciosa
    ) {

      this
        .loadingIndicators
        .set(
          true
        );

    }


    try {

      const {
        data,
        error
      } =
        await this
          .supabaseService
          .client
          .rpc(
            'obtener_resumen_inicio'
          );


      if (
        error
      ) {

        throw new Error(
          error.message
        );

      }


      const rows =
        (
          data ??
          []
        ) as ResumenInicio[];


      const resumen =
        rows[0] ??
        null;


      if (
        !resumen
      ) {

        throw new Error(
          'No se encontraron indicadores para mostrar.'
        );

      }


      this
        .resumen
        .set(
          resumen
        );


      this
        .indicatorsError
        .set(
          null
        );


    } catch (
      error
    ) {

      console.error(
        'Error cargando indicadores del inicio:',
        error
      );


      if (
        !actualizacionSilenciosa
      ) {

        this
          .indicatorsError
          .set(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar los indicadores.'
          );

      }


    } finally {

      if (
        !actualizacionSilenciosa
      ) {

        this
          .loadingIndicators
          .set(
            false
          );

      }

    }

  }

}
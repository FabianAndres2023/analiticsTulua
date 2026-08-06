import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute
} from '@angular/router';

import {
  EMPTY,
  catchError,
  exhaustMap,
  finalize,
  switchMap,
  timer
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  DashboardHeaderComponent
} from './components/dashboard-header/dashboard-header';

import {
  DashboardKpisComponent
} from './components/dashboard-kpis/dashboard-kpis';

import {
  DashboardMapComponent
} from './components/dashboard-map/dashboard-map';

import {
  DashboardHistoryChartComponent
} from './components/dashboard-history-chart/dashboard-history-chart';

import {
  DashboardSpeedChartComponent
} from './components/dashboard-speed-chart/dashboard-speed-chart';

import {
  DashboardActivityChartComponent
} from './components/dashboard-activity-chart/dashboard-activity-chart';

import {
  DashboardAlertChartComponent
} from './components/dashboard-alert-chart/dashboard-alert-chart';

import {
  DashboardAlertListComponent
} from './components/dashboard-alert-list/dashboard-alert-list';

import {
  DashboardJamListComponent
} from './components/dashboard-jam-list/dashboard-jam-list';

import {
  WazeDashboardService
} from './services/waze-dashboard.service';

import type {
  WazeDashboardResponse
} from './models/waze-dashboard.model';

@Component({
  selector: 'app-centro-datos-waze',
  standalone: true,

  imports: [
    CommonModule,
    DashboardHeaderComponent,
    DashboardKpisComponent,
    DashboardMapComponent,
    DashboardHistoryChartComponent,
    DashboardSpeedChartComponent,
    DashboardActivityChartComponent,
    DashboardAlertChartComponent,
    DashboardAlertListComponent,
    DashboardJamListComponent
  ],

  templateUrl: './centro-datos-waze.html',
  styleUrl: './centro-datos-waze.scss'
})
export class CentroDatosWaze implements OnInit {

  private readonly wazeService =
    inject(WazeDashboardService);

  private readonly changeDetector =
    inject(ChangeDetectorRef);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly route =
    inject(ActivatedRoute);

  /*
   * Intervalo de actualización automática:
   * 120.000 milisegundos = 2 minutos.
   */
  private readonly refreshIntervalMs =
    120_000;

  /*
   * Indica si la vista fue abierta desde:
   * /embed/centro-datos-waze
   */
  embedMode = false;

  /*
   * Se utiliza durante:
   * - carga inicial;
   * - actualización manual.
   */
  loading = false;

  /*
   * Se utiliza únicamente durante
   * la actualización automática.
   */
  autoUpdating = false;

  error: string | null = null;

  dashboard:
    WazeDashboardResponse | null = null;

  ngOnInit(): void {
    /*
     * La ruta pública define:
     *
     * data: {
     *   embed: true
     * }
     */
    this.embedMode =
      this.route.snapshot.data['embed'] === true;

    /*
     * Primero mostramos los datos almacenados.
     */
    this.cargarDashboard();

    /*
     * Luego iniciamos la actualización automática.
     */
    this.iniciarActualizacionAutomatica();
  }

  /**
   * Consulta la información que ya está almacenada
   * en Supabase sin ejecutar una sincronización nueva.
   */
  cargarDashboard(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.wazeService
      .getDashboard()
      .pipe(
        finalize(() => {
          this.loading = false;

          this.changeDetector
            .detectChanges();
        })
      )
      .subscribe({
        next: (
          response: WazeDashboardResponse
        ) => {
          this.dashboard = response;
        },

        error: (error: unknown) => {
          console.error(
            'Error cargando el dashboard Waze:',
            error
          );

          this.error =
            'No fue posible cargar la información del Centro de Datos Waze.';
        }
      });
  }

  /**
   * Actualización manual.
   *
   * 1. Consulta el feed oficial de Waze.
   * 2. Guarda los datos en Supabase.
   * 3. Consulta nuevamente el dashboard.
   */
  actualizarDatos(): void {
    if (
      this.loading ||
      this.autoUpdating
    ) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.wazeService
      .sincronizarWaze()
      .pipe(
        switchMap(() =>
          this.wazeService
            .getDashboard()
        ),

        finalize(() => {
          this.loading = false;

          this.changeDetector
            .detectChanges();
        })
      )
      .subscribe({
        next: (
          response: WazeDashboardResponse
        ) => {
          this.dashboard = response;
        },

        error: (error: unknown) => {
          console.error(
            'Error sincronizando Waze:',
            error
          );

          this.error =
            'No fue posible sincronizar los datos de Waze. Intenta nuevamente.';
        }
      });
  }

  /**
   * Ejecuta una sincronización cada dos minutos.
   *
   * El primer ciclo empieza después de dos minutos,
   * porque la información almacenada ya se consulta
   * inmediatamente desde ngOnInit().
   */
  private iniciarActualizacionAutomatica(): void {
    timer(
      this.refreshIntervalMs,
      this.refreshIntervalMs
    )
      .pipe(
        /*
         * Evita comenzar otro ciclo cuando
         * el ciclo anterior todavía está activo.
         */
        exhaustMap(() => {
          /*
           * No sincronizamos cuando:
           *
           * - la pestaña está oculta;
           * - existe una carga manual;
           * - ya existe una actualización automática.
           */
          if (
            document.visibilityState ===
              'hidden' ||
            this.loading ||
            this.autoUpdating
          ) {
            return EMPTY;
          }

          this.autoUpdating = true;

          /*
           * Un error automático no reemplaza
           * los datos que el usuario ya está viendo.
           */
          this.error = null;

          return this.wazeService
            .sincronizarWaze()
            .pipe(
              switchMap(() =>
                this.wazeService
                  .getDashboard()
              ),

              catchError(
                (
                  error: unknown
                ) => {
                  console.error(
                    'Error en la actualización automática de Waze:',
                    error
                  );

                  /*
                   * Conservamos la última información
                   * disponible y esperamos el siguiente ciclo.
                   */
                  return EMPTY;
                }
              ),

              finalize(() => {
                this.autoUpdating = false;

                this.changeDetector
                  .detectChanges();
              })
            );
        }),

        /*
         * Cancela el temporizador cuando el usuario
         * abandona esta pantalla.
         */
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: (
          response: WazeDashboardResponse
        ) => {
          this.dashboard = response;

          this.changeDetector
            .detectChanges();
        }
      });
  }

  /**
   * Navegación suave entre secciones
   * de la vista privada.
   */
  scrollToSection(
    sectionId: string
  ): void {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }
}
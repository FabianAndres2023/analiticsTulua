import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  finalize,
  switchMap
} from 'rxjs';

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

  loading = false;

  error: string | null = null;

  dashboard:
    WazeDashboardResponse | null = null;

  ngOnInit(): void {
    /*
     * Al abrir la pantalla solamente consultamos
     * los datos ya almacenados.
     */
    this.cargarDashboard();
  }

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
          this.changeDetector.detectChanges();
        })
      )
      .subscribe({
        next: (
          response: WazeDashboardResponse
        ) => {
          this.dashboard = response;

          console.log(
            'Dashboard Waze recibido:',
            response
          );
        },

        error: (error: unknown) => {
          console.error(
            'Error cargando el dashboard:',
            error
          );

          this.error =
            'No fue posible cargar la información del Centro de Datos Waze.';
        }
      });
  }

  actualizarDatos(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    /*
     * Primero sincroniza el feed de Waze.
     * Cuando termina, vuelve a consultar el dashboard.
     */
    this.wazeService
      .sincronizarWaze()
      .pipe(
        switchMap(() =>
          this.wazeService.getDashboard()
        ),

        finalize(() => {
          this.loading = false;
          this.changeDetector.detectChanges();
        })
      )
      .subscribe({
        next: (
          response: WazeDashboardResponse
        ) => {
          this.dashboard = response;

          console.log(
            'Waze sincronizado y dashboard actualizado:',
            response
          );
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
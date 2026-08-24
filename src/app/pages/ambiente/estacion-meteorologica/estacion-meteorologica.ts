import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  EstacionHeaderComponent,
} from './components/dashboard-header/dashboard-header';

import {
  EstacionKpisComponent,
} from './components/dashboard-kpis/dashboard-kpis';

import {
  ChartClimaGeneralComponent,
} from './components/chart-clima-general/chart-clima-general';

import {
  ChartPrecipitacionComponent,
} from './components/chart-precipitacion/chart-precipitacion';

import {
  ChartPresionComponent,
} from './components/chart-presion/chart-presion';

import {
  ChartVientoAtmosferaComponent,
} from './components/chart-viento-atmosfera/chart-viento-atmosfera';

import {
  EstacionDashboardResponse,
  RangoEstacion,
} from './models/estacion-dashboard.model';

import {
  EstacionDashboardService,
} from './services/estacion-dashboard.service';

@Component({
  selector: 'app-estacion-meteorologica',

  standalone: true,

  imports: [
    EstacionHeaderComponent,
    EstacionKpisComponent,
    ChartClimaGeneralComponent,
    ChartPrecipitacionComponent,
    ChartPresionComponent,
    ChartVientoAtmosferaComponent,
  ],

  templateUrl:
    './estacion-meteorologica.html',

  styleUrl:
    './estacion-meteorologica.scss',
})
export class EstacionMeteorologica
  implements OnInit {

  private readonly dashboardService =
    inject(EstacionDashboardService);

  readonly cargando =
    signal(true);

  readonly error =
    signal<string | null>(null);

  readonly rango =
    signal<RangoEstacion>('24h');

  readonly dashboard =
    signal<EstacionDashboardResponse | null>(
      null,
    );

  readonly estadoActual =
    computed(
      () =>
        this.dashboard()
          ?.estado_actual
        ?? null,
    );

  readonly serie =
    computed(
      () =>
        this.dashboard()
          ?.serie
        ?? [],
    );

  readonly ultimaMedicion =
    computed(() => {

      const estado =
        this.estadoActual();

      if (!estado?.medido_en) {
        return '--';
      }

      return new Date(
        estado.medido_en,
      ).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    });

  async ngOnInit(): Promise<void> {
    await this.cargarDashboard();
  }

  async cambiarRango(
    rango: RangoEstacion,
  ): Promise<void> {
    this.rango.set(rango);

    await this.cargarDashboard();
  }

  scrollToSection(
    sectionId: string,
  ): void {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  }

  private async cargarDashboard():
    Promise<void> {

    this.cargando.set(true);
    this.error.set(null);

    try {

      const data =
        await this.dashboardService
          .getDashboard(
            'sta-001',
            this.rango(),
          );
        console.log('RANGO:', this.rango());
        console.log('SERIE RECIBIDA:', data.serie);
        console.log('CANTIDAD:', data.serie.length);  

      this.dashboard.set(data);

    } catch (error) {

      console.error(
        'Error cargando dashboard:',
        error,
      );

      this.error.set(
        'No fue posible cargar los datos de la estación.',
      );

    } finally {

      this.cargando.set(false);

    }
  }
}

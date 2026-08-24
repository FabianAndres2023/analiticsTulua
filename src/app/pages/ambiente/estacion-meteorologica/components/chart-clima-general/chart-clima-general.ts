import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import {
  ChartConfiguration,
  ChartData,
} from 'chart.js';

import {
  BaseChartDirective,
} from 'ng2-charts';

import {
  LucideThermometer,
} from '@lucide/angular';

import type {
  RangoEstacion,
  SerieTemporal,
} from '../../models/estacion-dashboard.model';

import {
  construirLabelsTiempo,
} from '../../utils/estacion-chart.utils';

@Component({
  selector: 'app-chart-clima-general',

  standalone: true,

  imports: [
    BaseChartDirective,
    LucideThermometer,
  ],

  templateUrl: './chart-clima-general.html',

  styleUrl: './chart-clima-general.scss',
})
export class ChartClimaGeneralComponent
  implements OnChanges {

  @Input()
  serie: SerieTemporal[] = [];

  @Input()
  rango: RangoEstacion = '24h';

  readonly chartType: 'line' = 'line';

  readonly chartOptions:
    ChartConfiguration<'line'>['options'] = {

      responsive: true,

      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: 'index',
      },

      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },

        tooltip: {
          enabled: true,
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },

        y: {
          position: 'left',

          title: {
            display: true,
            text: '°C',
          },
        },

        y1: {
          position: 'right',

          min: 0,
          max: 100,

          grid: {
            drawOnChartArea: false,
          },

          title: {
            display: true,
            text: '%',
          },
        },
      },
    };

  chartData: ChartData<'line'> = {
    labels: [],
    datasets: [],
  };

  ngOnChanges(
    _changes: SimpleChanges,
  ): void {
    this.buildChart();
  }

  private buildChart(): void {

    this.chartData = {
      labels: construirLabelsTiempo(
        this.serie,
        this.rango,
      ),

      datasets: [
        {
          label: 'Temperatura (°C)',

          data: this.serie.map(
            (punto) => punto.temperatura,
          ),

          borderColor: '#ef4444',
          backgroundColor: '#ef4444',

          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,

          tension: 0.25,
          fill: false,

          yAxisID: 'y',
        },

        {
          label: 'Humedad relativa (%)',

          data: this.serie.map(
            (punto) => punto.humedad_relativa,
          ),

          borderColor: '#38bdf8',
          backgroundColor: '#38bdf8',

          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,

          tension: 0.25,
          fill: false,

          yAxisID: 'y1',
        },
      ],
    };
  }
}

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
  LucideWind,
} from '@lucide/angular';

import type {
  RangoEstacion,
  SerieTemporal,
} from '../../models/estacion-dashboard.model';

import {
  construirLabelsTiempo,
} from '../../utils/estacion-chart.utils';

@Component({
  selector: 'app-chart-viento-atmosfera',

  standalone: true,

  imports: [
    BaseChartDirective,
    LucideWind,
  ],

  templateUrl: './chart-viento-atmosfera.html',

  styleUrl: './chart-viento-atmosfera.scss',
})
export class ChartVientoAtmosferaComponent
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

          beginAtZero: true,

          title: {
            display: true,
            text: 'm/s',
          },
        },

        y1: {
          position: 'right',

          beginAtZero: true,

          grid: {
            drawOnChartArea: false,
          },

          title: {
            display: true,
            text: '% / índice',
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
          label: 'Velocidad del viento (m/s)',

          data: this.serie.map(
            (punto) => punto.viento_velocidad,
          ),

          borderColor: '#10b981',
          backgroundColor: '#10b981',

          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,

          tension: 0.25,
          fill: false,

          yAxisID: 'y',
        },

        {
          label: 'Índice UV',

          data: this.serie.map(
            (punto) => punto.indice_uv,
          ),

          borderColor: '#eab308',
          backgroundColor: '#eab308',

          borderDash: [6, 4],

          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,

          tension: 0.25,
          fill: false,

          yAxisID: 'y1',
        },

        {
          label: 'Nubosidad (%)',

          data: this.serie.map(
            (punto) => punto.nubosidad,
          ),

          borderColor: '#94a3b8',
          backgroundColor: '#94a3b8',

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

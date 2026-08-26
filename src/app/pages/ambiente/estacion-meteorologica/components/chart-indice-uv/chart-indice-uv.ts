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
  LucideSun,
} from '@lucide/angular';

import type {
  RangoEstacion,
  SerieTemporal,
} from '../../models/estacion-dashboard.model';

import {
  construirLabelsTiempo,
} from '../../utils/estacion-chart.utils';

@Component({
  selector: 'app-chart-indice-uv',

  standalone: true,

  imports: [
    BaseChartDirective,
    LucideSun,
  ],

  templateUrl: './chart-indice-uv.html',

  styleUrl: './chart-indice-uv.scss',
})
export class ChartIndiceUvComponent
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
          display: false,
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
          beginAtZero: true,

          title: {
            display: true,
            text: 'Índice UV',
          },

          ticks: {
            precision: 1,
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
          label: 'Índice UV',

          data: this.serie.map(
            (punto) => punto.indice_uv,
          ),

          borderColor: '#eab308',
          backgroundColor: '#eab308',

          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,

          tension: 0.25,
          fill: false,
        },
      ],
    };
  }
}
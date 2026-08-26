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
  selector: 'app-chart-viento',

  standalone: true,

  imports: [
    BaseChartDirective,
    LucideWind,
  ],

  templateUrl: './chart-viento.html',

  styleUrl: './chart-viento.scss',
})
export class ChartVientoComponent
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
            text: 'm/s',
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
        },
      ],
    };
  }
}
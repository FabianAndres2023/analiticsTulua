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
  LucideCloud,
} from '@lucide/angular';

import type {
  RangoEstacion,
  SerieTemporal,
} from '../../models/estacion-dashboard.model';

import {
  construirLabelsTiempo,
} from '../../utils/estacion-chart.utils';

@Component({
  selector: 'app-chart-nubosidad',

  standalone: true,

  imports: [
    BaseChartDirective,
    LucideCloud,
  ],

  templateUrl: './chart-nubosidad.html',

  styleUrl: './chart-nubosidad.scss',
})
export class ChartNubosidadComponent
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
          min: 0,
          max: 100,

          title: {
            display: true,
            text: '%',
          },

          ticks: {
            precision: 0,
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
        },
      ],
    };
  }
}
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
  LucideGauge,
} from '@lucide/angular';

import type {
  RangoEstacion,
  SerieTemporal,
} from '../../models/estacion-dashboard.model';

import {
  construirLabelsTiempo,
} from '../../utils/estacion-chart.utils';

@Component({
  selector: 'app-chart-presion',

  standalone: true,

  imports: [
    BaseChartDirective,
    LucideGauge,
  ],

  templateUrl: './chart-presion.html',

  styleUrl: './chart-presion.scss',
})
export class ChartPresionComponent
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
        },

        y: {
          title: {
            display: true,
            text: 'hPa',
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
          label: 'Presión atmosférica (hPa)',

          data: this.serie.map(
            (punto) => punto.presion,
          ),

          borderColor: '#8b5cf6',
          backgroundColor: '#8b5cf6',

          tension: 0.35,
          fill: false,
        },
      ],
    };
  }
}

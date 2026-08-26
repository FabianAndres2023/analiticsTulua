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
  LucideCloudRain,
} from '@lucide/angular';

import type {
  RangoEstacion,
  SerieTemporal,
} from '../../models/estacion-dashboard.model';

import {
  construirLabelsTiempo,
} from '../../utils/estacion-chart.utils';

@Component({
  selector: 'app-chart-precipitacion',

  standalone: true,

  imports: [
    BaseChartDirective,
    LucideCloudRain,
  ],

  templateUrl: './chart-precipitacion.html',

  styleUrl: './chart-precipitacion.scss',
})
export class ChartPrecipitacionComponent
  implements OnChanges {

  @Input()
  serie: SerieTemporal[] = [];

  @Input()
  rango: RangoEstacion = '24h';

  readonly chartType: 'bar' = 'bar';

  readonly chartOptions:
    ChartConfiguration<'bar'>['options'] = {

      responsive: true,

      maintainAspectRatio: false,

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
          beginAtZero: true,

          title: {
            display: true,
            text: 'mm',
          },

          ticks: {
            precision: 1,
          },
        },
      },
    };

  chartData: ChartData<'bar'> = {
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
          label: 'Precipitación (mm)',

          data: this.serie.map(
            (punto) => punto.precipitacion,
          ),

          backgroundColor:
            'rgba(14, 165, 233, 0.78)',

          hoverBackgroundColor: '#0ea5e9',

          borderRadius: 5,

          maxBarThickness: 30,
        },
      ],
    };
  }
}

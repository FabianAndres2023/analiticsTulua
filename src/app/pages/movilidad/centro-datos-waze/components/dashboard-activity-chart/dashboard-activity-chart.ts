import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {
  ChartConfiguration,
  ChartData
} from 'chart.js';

import {
  BaseChartDirective
} from 'ng2-charts';

import {
  LucideRoute
} from '@lucide/angular';

import type {
  WazeResumenHistorico
} from '../../models/waze-dashboard.model';

@Component({
  selector: 'app-dashboard-activity-chart',
  standalone: true,

  imports: [
    BaseChartDirective,
    LucideRoute
  ],

  templateUrl: './dashboard-activity-chart.html',
  styleUrl: './dashboard-activity-chart.scss'
})
export class DashboardActivityChartComponent
  implements OnChanges {

  @Input()
  historico: WazeResumenHistorico[] = [];

  readonly chartType: 'bar' = 'bar';

  readonly chartOptions:
    ChartConfiguration<'bar'>['options'] = {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: 'index'
      },

      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },

        tooltip: {
          enabled: true
        }
      },

      scales: {
        x: {
          stacked: true,

          grid: {
            display: false
          }
        },

        y: {
          stacked: true,
          beginAtZero: true,

          title: {
            display: true,
            text: 'Eventos registrados'
          },

          ticks: {
            precision: 0
          }
        }
      }
    };

  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  ngOnChanges(
    _changes: SimpleChanges
  ): void {
    this.buildChart();
  }

  private buildChart(): void {
    const labels = this.historico.map(
      (registro) =>
        new Date(
          registro.fecha_hora
        ).toLocaleString(
          'es-CO',
          {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }
        )
    );

    this.chartData = {
      labels,

      datasets: [
        {
          label: 'Atascos',

          data: this.historico.map(
            (registro) =>
              registro.total_atascos
          )
        },

        {
          label: 'Alertas',

          data: this.historico.map(
            (registro) =>
              registro.total_alertas
          )
        },

        {
          label: 'Irregularidades',

          data: this.historico.map(
            (registro) =>
              registro.total_irregularidades
          )
        }
      ]
    };
  }
}
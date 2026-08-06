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
  LucideActivity
} from '@lucide/angular';

import type {
  WazeResumenHistorico
} from '../../models/waze-dashboard.model';

@Component({
  selector: 'app-dashboard-history-chart',
  standalone: true,

  imports: [
    BaseChartDirective,
    LucideActivity
  ],

  templateUrl: './dashboard-history-chart.html',
  styleUrl: './dashboard-history-chart.scss'
})
export class DashboardHistoryChartComponent
  implements OnChanges {

  @Input()
  historico: WazeResumenHistorico[] = [];

  readonly chartType: 'line' = 'line';

  readonly chartOptions:
    ChartConfiguration<'line'>['options'] = {

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
          grid: {
            display: false
          }
        },

        y: {
          beginAtZero: true,

          ticks: {
            precision: 0
          }
        }
      }
    };

  chartData: ChartData<'line'> = {
    labels: [],

    datasets: [
      {
        label: 'Atascos',
        data: [],
        tension: 0.35,
        fill: false
      },

      {
        label: 'Alertas',
        data: [],
        tension: 0.35,
        fill: false
      }
    ]
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
        ).toLocaleTimeString(
          'es-CO',
          {
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
          ),

          tension: 0.35,
          fill: false
        },

        {
          label: 'Alertas',

          data: this.historico.map(
            (registro) =>
              registro.total_alertas
          ),

          tension: 0.35,
          fill: false
        }
      ]
    };
  }
}
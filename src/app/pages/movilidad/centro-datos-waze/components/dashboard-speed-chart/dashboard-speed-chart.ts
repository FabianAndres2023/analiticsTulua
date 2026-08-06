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
  LucideGauge
} from '@lucide/angular';

import type {
  WazeResumenHistorico
} from '../../models/waze-dashboard.model';

@Component({
  selector: 'app-dashboard-speed-chart',
  standalone: true,

  imports: [
    BaseChartDirective,
    LucideGauge
  ],

  templateUrl: './dashboard-speed-chart.html',
  styleUrl: './dashboard-speed-chart.scss'
})
export class DashboardSpeedChartComponent
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
          enabled: true,
          callbacks: {
            label: (context) =>
              `Velocidad: ${context.parsed.y ?? 0} km/h`
          }
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

          title: {
            display: true,
            text: 'Velocidad promedio (km/h)'
          },

          ticks: {
            callback: (value) => `${value} km/h`
          }
        }
      }
    };

  chartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  ngOnChanges(
    _changes: SimpleChanges
  ): void {
    this.buildChart();
  }

  get hasSpeedData(): boolean {
    return this.historico.some(
      (registro) =>
        registro.velocidad_promedio_kmh != null
    );
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
          label: 'Velocidad promedio',

          data: this.historico.map(
            (registro) =>
              registro.velocidad_promedio_kmh
          ),

          tension: 0.35,
          fill: true,
          spanGaps: true,

          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }
}
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {
  getWazeEventPresentation
} from '../../utils/waze-event.utils';

import {
  ChartConfiguration,
  ChartData
} from 'chart.js';

import {
  BaseChartDirective
} from 'ng2-charts';

import {
  LucideBellRing
} from '@lucide/angular';

import type {
  WazeAlerta
} from '../../models/waze-dashboard.model';

@Component({
  selector: 'app-dashboard-alert-chart',
  standalone: true,

  imports: [
    BaseChartDirective,
    LucideBellRing
  ],

  templateUrl: './dashboard-alert-chart.html',
  styleUrl: './dashboard-alert-chart.scss'
})
export class DashboardAlertChartComponent
  implements OnChanges {

  @Input()
  alertas: WazeAlerta[] = [];

  readonly chartType: 'doughnut' = 'doughnut';

  readonly chartOptions:
    ChartConfiguration<'doughnut'>['options'] = {

      responsive: true,

      maintainAspectRatio: false,

      cutout: '62%',

      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },

        tooltip: {
          enabled: true
        }
      }
    };

  chartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        label: 'Alertas',
        data: []
      }
    ]
  };

  ngOnChanges(
    _changes: SimpleChanges
  ): void {
    this.buildChart();
  }

  private buildChart(): void {
  const counts =
    new Map<
      string,
      {
        total: number;
        color: string;
      }
    >();

  for (const alerta of this.alertas) {
    const presentation =
      getWazeEventPresentation(
        alerta.tipo,
        alerta.subtipo
      );

    const current =
      counts.get(presentation.label);

    counts.set(
      presentation.label,
      {
        total:
          (current?.total ?? 0) + 1,

        color:
          presentation.color
      }
    );
  }

  const entries =
    Array.from(counts.entries());

  this.chartData = {
    labels: entries.map(
      ([label]) => label
    ),

    datasets: [
      {
        label: 'Alertas',

        data: entries.map(
          ([, value]) => value.total
        ),

        backgroundColor:
          entries.map(
            ([, value]) => value.color
          ),

        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };
}

  private getAlertLabel(
    value: string
  ): string {
    const labels: Record<string, string> = {
      HAZARD:
        'Peligro en la vía',

      HAZARD_ON_ROAD_POT_HOLE:
        'Hueco en la vía',

      HAZARD_ON_SHOULDER_CAR_STOPPED:
        'Vehículo detenido en la berma',

      ACCIDENT:
        'Accidente',

      ROAD_CLOSED:
        'Vía cerrada',

      JAM:
        'Congestión vial'
    };

    return labels[value] ??
      value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(
          /^\w/,
          (letter) => letter.toUpperCase()
        );
  }
}
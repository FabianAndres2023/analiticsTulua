import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import {
  BaseChartDirective,
} from 'ng2-charts';

import type {
  ChartConfiguration,
  ChartData,
} from 'chart.js';

import type {
  PrecipitacionDiariaItem,
} from '../../models/estacion-dashboard.model';

@Component({
  selector: 'app-chart-precipitacion-acumulada',

  standalone: true,

  imports: [
    BaseChartDirective,
  ],

  templateUrl: './chart-precipitacion-acumulada.html',

  styleUrl: './chart-precipitacion-acumulada.scss',
})
export class ChartPrecipitacionAcumuladaComponent
implements OnChanges {

  @Input()
  datos: PrecipitacionDiariaItem[] = [];

  chartType: 'line' = 'line';

  totalAcumulado = 0;

  chartData: ChartData<'line'> = {
    labels: [],
    datasets: [],
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            const valor =
              Number(context.parsed.y ?? 0);

            return `Acumulado: ${valor.toFixed(2)} mm`;
          },
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },

        ticks: {
          autoSkip: true,
          maxTicksLimit: 7,
        },
      },

      y: {
        beginAtZero: true,

        title: {
          display: true,
          text: 'Precipitación acumulada (mm)',
        },

        grid: {
          color: '#edf2f7',
        },
      },
    },
  };

  ngOnChanges(
    changes: SimpleChanges,
  ): void {

    if (changes['datos']) {
      this.construirGrafica();
    }
  }

  private construirGrafica(): void {

    let acumulado = 0;

    const valoresAcumulados =
      this.datos.map((item) => {

        acumulado +=
          Number(item.precipitacion ?? 0);

        return Number(
          acumulado.toFixed(2),
        );
      });

    this.totalAcumulado =
      Number(acumulado.toFixed(2));

    this.chartData = {
      labels:
        this.datos.map(
          (item) =>
            this.formatearFecha(item.fecha),
        ),

      datasets: [
        {
          label: 'Precipitación acumulada',

          data: valoresAcumulados,

          borderWidth: 2,

          pointRadius: 2,

          pointHoverRadius: 5,

          tension: 0.25,

          fill: true,
        },
      ],
    };
  }

  private formatearFecha(
    fecha: string,
  ): string {

    const partes =
      fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}`;
  }
}
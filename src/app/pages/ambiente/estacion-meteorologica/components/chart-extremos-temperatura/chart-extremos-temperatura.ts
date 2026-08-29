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
  ExtremoTemperaturaDiariaItem,
} from '../../models/estacion-dashboard.model';

@Component({
  selector: 'app-chart-extremos-temperatura',

  standalone: true,

  imports: [
    BaseChartDirective,
  ],

  templateUrl: './chart-extremos-temperatura.html',

  styleUrl: './chart-extremos-temperatura.scss',
})
export class ChartExtremosTemperaturaComponent
implements OnChanges {

  @Input()
  datos: ExtremoTemperaturaDiariaItem[] = [];

  chartType: 'line' = 'line';

  minimaPeriodo: number | null = null;
  maximaPeriodo: number | null = null;

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
        display: true,
        position: 'top',
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            const valor =
              Number(context.parsed.y ?? 0);

            return `${context.dataset.label}: ${valor.toFixed(1)} °C`;
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
        title: {
          display: true,
          text: 'Temperatura (°C)',
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

    if (!this.datos.length) {
      this.minimaPeriodo = null;
      this.maximaPeriodo = null;

      this.chartData = {
        labels: [],
        datasets: [],
      };

      return;
    }

    const minimas =
      this.datos.map(
        (item) =>
          Number(item.temperatura_minima),
      );

    const maximas =
      this.datos.map(
        (item) =>
          Number(item.temperatura_maxima),
      );

    this.minimaPeriodo =
      Math.min(...minimas);

    this.maximaPeriodo =
      Math.max(...maximas);

    this.chartData = {
      labels:
        this.datos.map(
          (item) =>
            this.formatearFecha(item.fecha),
        ),

      datasets: [
        {
          label: 'Temperatura máxima',
          data: maximas,

          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          tension: 0.25,
          fill: false,
        },

        {
          label: 'Temperatura mínima',
          data: minimas,

          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          tension: 0.25,
          fill: false,
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
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
  RosaVientoItem,
} from '../../models/estacion-dashboard.model';

@Component({
  selector: 'app-chart-rosa-vientos',

  standalone: true,

  imports: [
    BaseChartDirective,
  ],

  templateUrl: './chart-rosa-vientos.html',

  styleUrl: './chart-rosa-vientos.scss',
})
export class ChartRosaVientosComponent
implements OnChanges {

  @Input()
  datos: RosaVientoItem[] = [];

  chartType: 'polarArea' = 'polarArea';

  chartData: ChartData<'polarArea'> = {
    labels: [],
    datasets: [],
  };

  chartOptions: ChartConfiguration<'polarArea'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;

            const item =
              this.datosOrdenados[index];

            if (!item) {
              return '';
            }

            return [
              `Frecuencia: ${item.porcentaje}%`,
              `Velocidad media: ${item.velocidad_promedio ?? 0} m/s`,
              `Velocidad máxima: ${item.velocidad_maxima ?? 0} m/s`,
            ];
          },
        },
      },
    },

    scales: {
      r: {
        beginAtZero: true,
        startAngle: -22.5,
        
        ticks: {
          display: false,
        },

        grid: {
          color: '#e2e8f0',
        },

        angleLines: {
          color: '#e2e8f0',
        },

        pointLabels: {
          display: true,

          font: {
            size: 13,
            weight: 'bold',
          },

          color: '#334155',
        }

      },
    },
  };

  datosOrdenados: RosaVientoItem[] = [];

  ngOnChanges(
    changes: SimpleChanges,
  ): void {

    if (changes['datos']) {
      this.construirGrafica();
    }
  }

  private construirGrafica(): void {

    const orden = [
      'N',
      'NE',
      'E',
      'SE',
      'S',
      'SO',
      'O',
      'NO',
    ];

    this.datosOrdenados =
      orden.map((direccion) => {

        const encontrado =
          this.datos.find(
            (item) =>
              item.direccion === direccion,
          );

        return (
          encontrado ?? {
            direccion,
            direccion_grados: 0,
            registros: 0,
            porcentaje: 0,
            velocidad_promedio: 0,
            velocidad_maxima: 0,
          }
        );
      });

    this.chartData = {
      labels: orden,

      datasets: [
        {
          label: 'Frecuencia del viento',

          data:
            this.datosOrdenados.map(
              (item) =>
                item.porcentaje,
            ),

          borderWidth: 1,
        },
      ],
    };
  }
}
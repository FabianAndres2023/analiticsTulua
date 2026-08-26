import {
  Component,
  Input,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  LucideArrowUp,
  LucideCloudRain,
  LucideCloudy,
  LucideCompass,
  LucideDroplets,
  LucideGauge,
  LucideSun,
  LucideThermometer,
  LucideWind,
} from '@lucide/angular';

import type {
  EstadoActual,
} from '../../models/estacion-dashboard.model';

import {
  obtenerPresentacionUv,
} from '../../utils/estacion-chart.utils';

@Component({
  selector: 'app-estacion-kpis',

  standalone: true,

  imports: [
    CommonModule,
    LucideArrowUp,
    LucideCloudRain,
    LucideCloudy,
    LucideCompass,
    LucideDroplets,
    LucideGauge,
    LucideSun,
    LucideThermometer,
    LucideWind,
  ],

  templateUrl: './dashboard-kpis.html',

  styleUrl: './dashboard-kpis.scss',
})
export class EstacionKpisComponent {

  @Input()
  estadoActual: EstadoActual | null = null;

  uvPresentacion(
    indiceUv: number | null | undefined,
  ) {
    return obtenerPresentacionUv(indiceUv);
  }
}

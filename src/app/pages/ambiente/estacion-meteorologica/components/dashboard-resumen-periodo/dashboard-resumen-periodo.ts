import {
  Component,
  Input,
} from '@angular/core';

import {
  LucideCloudRain,
  LucideDroplets,
  LucideGauge,
  LucideSun,
  LucideThermometer,
  LucideWind,
} from '@lucide/angular';

import type {
  ResumenEstacion,
} from '../../models/estacion-dashboard.model';

@Component({
  selector: 'app-dashboard-resumen-periodo',

  standalone: true,

  imports: [
    LucideThermometer,
    LucideDroplets,
    LucideCloudRain,
    LucideWind,
    LucideSun,
    LucideGauge,
  ],

  templateUrl: './dashboard-resumen-periodo.html',

  styleUrl: './dashboard-resumen-periodo.scss',
})
export class DashboardResumenPeriodoComponent {

  @Input()
  resumen: ResumenEstacion | null = null;

}
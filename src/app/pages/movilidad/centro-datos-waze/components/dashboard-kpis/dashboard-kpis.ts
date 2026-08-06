import {
  Component,
  Input
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  LucideBellRing,
  LucideGauge,
  LucideRoute,
  LucideTriangleAlert
} from '@lucide/angular';

import type {
  WazeDashboardResponse
} from '../../models/waze-dashboard.model';

@Component({
  selector: 'app-dashboard-kpis',
  standalone: true,

  imports: [
    CommonModule,
    LucideBellRing,
    LucideGauge,
    LucideRoute,
    LucideTriangleAlert
  ],

  templateUrl: './dashboard-kpis.html',
  styleUrl: './dashboard-kpis.scss'
})
export class DashboardKpisComponent {

  @Input()
  dashboard: WazeDashboardResponse | null = null;

}
import {
  Component,
  Input
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  LucideActivity,
  LucideTriangleAlert
} from '@lucide/angular';

import type {
  WazeAtasco
} from '../../models/waze-dashboard.model';

@Component({
  selector: 'app-dashboard-jam-list',
  standalone: true,

  imports: [
    CommonModule,
    LucideActivity,
    LucideTriangleAlert
  ],

  templateUrl: './dashboard-jam-list.html',
  styleUrl: './dashboard-jam-list.scss'
})
export class DashboardJamListComponent {

  @Input()
  atascos: WazeAtasco[] = [];

  @Input()
  retrasoPromedioSegundos: number | null = null;

}
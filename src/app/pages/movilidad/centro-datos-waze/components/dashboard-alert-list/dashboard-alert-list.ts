import {
  Component,
  Input
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  LucideBellRing
} from '@lucide/angular';

import type {
  WazeAlerta
} from '../../models/waze-dashboard.model';

import {
  getWazeEventPresentation
} from '../../utils/waze-event.utils';

@Component({
  selector: 'app-dashboard-alert-list',
  standalone: true,

  imports: [
    CommonModule,
    LucideBellRing
  ],

  templateUrl:
    './dashboard-alert-list.html',

  styleUrl:
    './dashboard-alert-list.scss'
})
export class DashboardAlertListComponent {

  @Input()
  alertas: WazeAlerta[] = [];

  getPresentation(
    alerta: WazeAlerta
  ) {
    return getWazeEventPresentation(
      alerta.tipo,
      alerta.subtipo
    );
  }

  getLocation(
    alerta: WazeAlerta
  ): string {
    return (
      alerta.calle ||
      alerta.ciudad ||
      'Ubicación no disponible'
    );
  }

  getRelativeTime(
    dateValue: string | null
  ): string {
    if (!dateValue) {
      return 'Hora no disponible';
    }

    const date =
      new Date(dateValue);

    const differenceMs =
      Date.now() - date.getTime();

    const minutes =
      Math.max(
        0,
        Math.floor(
          differenceMs / 60000
        )
      );

    if (minutes < 1) {
      return 'Hace menos de un minuto';
    }

    if (minutes < 60) {
      return `Hace ${minutes} min`;
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return hours === 1
        ? 'Hace 1 hora'
        : `Hace ${hours} horas`;
    }

    const days =
      Math.floor(hours / 24);

    return days === 1
      ? 'Hace 1 día'
      : `Hace ${days} días`;
  }
}
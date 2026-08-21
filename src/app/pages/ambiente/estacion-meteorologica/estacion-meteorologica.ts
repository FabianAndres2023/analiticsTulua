import { Component, inject, OnInit } from '@angular/core';

import { EstacionDashboardService } from './services/estacion-dashboard.service';

@Component({
  selector: 'app-estacion-meteorologica',
  standalone: true,
  templateUrl: './estacion-meteorologica.html',
  styleUrl: './estacion-meteorologica.scss',
})
export class EstacionMeteorologica implements OnInit {
  private readonly dashboardService =
    inject(EstacionDashboardService);

  async ngOnInit(): Promise<void> {
    try {
      const data =
        await this.dashboardService.getDashboard(
          'sta-001',
          '24h',
        );

      console.log(
        'AMBIENTE DASHBOARD:',
        data,
      );

      console.log(
        'ESTADO ACTUAL:',
        data.estado_actual,
      );

      console.log(
        'PUNTOS SERIE:',
        data.serie.length,
      );
    } catch (error) {
      console.error(
        'Error cargando dashboard de ambiente:',
        error,
      );
    }
  }
}
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { environment } from '../../../../../environments/environment';

import { SupabaseService } from '../../../../core/services/supabase.service';

import {
  EstacionDashboardResponse,
  RangoEstacion,
} from '../models/estacion-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class EstacionDashboardService {
  private readonly http = inject(HttpClient);
  private readonly supabaseService = inject(SupabaseService);

  private readonly dashboardUrl =
    environment.ambienteDashboardUrl;

  async getDashboard(
    deviceId = 'sta-001',
    rango: RangoEstacion = '24h',
  ): Promise<EstacionDashboardResponse> {
    const {
      data: { session },
      error,
    } =
      await this.supabaseService.client.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.access_token) {
      throw new Error(
        'No existe una sesión autenticada.',
      );
    }

    const headers = new HttpHeaders({
      Authorization:
        `Bearer ${session.access_token}`,
    });

    const url =
      `${this.dashboardUrl}` +
      `?device_id=${encodeURIComponent(deviceId)}` +
      `&rango=${encodeURIComponent(rango)}`;

    return await firstValueFrom(
      this.http
        .get<EstacionDashboardResponse>(
          url,
          { headers },
        )
        .pipe(
          timeout(15000),
        ),
    );
  }
}
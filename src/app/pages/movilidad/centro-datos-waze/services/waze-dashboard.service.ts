import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  timeout
} from 'rxjs';

import {
  environment
} from '../../../../../environments/environment';

import type {
  WazeDashboardResponse
} from '../models/waze-dashboard.model';

export interface WazeSyncResponse {
  success: boolean;
  message: string;

  data?: {
    totalAtascos: number;
    totalAlertas: number;
    totalIrregularidades: number;
  };

  sincronizadoEn?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WazeDashboardService {

  private readonly http =
    inject(HttpClient);

  private readonly dashboardEndpoint =
    environment.wazeDashboardUrl;

  private readonly syncEndpoint =
    environment.wazeSyncUrl;

  getDashboard():
    Observable<WazeDashboardResponse> {

    return this.http
      .get<WazeDashboardResponse>(
        this.dashboardEndpoint
      )
      .pipe(
        timeout(15000)
      );
  }

  sincronizarWaze():
    Observable<WazeSyncResponse> {

    return this.http
      .get<WazeSyncResponse>(
        this.syncEndpoint
      )
      .pipe(
        timeout(30000)
      );
  }
}
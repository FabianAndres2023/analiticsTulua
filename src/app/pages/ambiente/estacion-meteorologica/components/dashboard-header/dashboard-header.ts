import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';

import {
  LucideMapPin,
  LucideRefreshCw,
} from '@lucide/angular';

import * as L from 'leaflet';

import type {
  RangoEstacion,
} from '../../models/estacion-dashboard.model';

@Component({
  selector: 'app-estacion-header',

  standalone: true,

  imports: [
    LucideRefreshCw,
    LucideMapPin,
  ],

  templateUrl: './dashboard-header.html',

  styleUrl: './dashboard-header.scss',
})
export class EstacionHeaderComponent
  implements AfterViewInit, OnDestroy {

  @Input()
  loading = false;

  @Input()
  enLinea = false;

  @Input()
  ultimaMedicion = '--';

  @Input()
  rango: RangoEstacion = '24h';

  @Output()
  cambioRango = new EventEmitter<RangoEstacion>();

  @Output()
  actualizar = new EventEmitter<void>();

  readonly rangos: RangoEstacion[] = [
    '24h',
    '7d',
    '30d',
  ];

  readonly stationLatitude = 4.086115;
  readonly stationLongitude = -76.197753;

  private map?: L.Map;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {

    const stationCoordinates: L.LatLngExpression = [
      this.stationLatitude,
      this.stationLongitude,
    ];

    this.map = L.map(
      'station-location-map',
      {
        center: stationCoordinates,
        zoom: 16,
        zoomControl: true,
        attributionControl: true,
      },
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; OpenStreetMap contributors',
      },
    ).addTo(this.map);

    L.circleMarker(
      stationCoordinates,
      {
        radius: 9,
        weight: 3,
        color: '#0d4f8b',
        fillColor: '#ffffff',
        fillOpacity: 1,
      },
    )
      .addTo(this.map)
      .bindPopup(
        `
          <strong>Estación Meteorológica</strong>
          <br>
          Alcaldía Municipal de Tuluá
        `,
      );

    setTimeout(
      () => this.map?.invalidateSize(),
      0,
    );
  }
}

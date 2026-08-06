import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';

import {
  getWazeEventPresentation
} from '../../utils/waze-event.utils';

import * as L from 'leaflet';

import type {
  WazeAlerta,
  WazeAtasco
} from '../../models/waze-dashboard.model';

@Component({
  selector: 'app-dashboard-map',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-map.html',
  styleUrl: './dashboard-map.scss'
})
export class DashboardMapComponent
  implements AfterViewInit, OnChanges, OnDestroy {

  @Input()
  alertas: WazeAlerta[] = [];

  @Input()
  atascos: WazeAtasco[] = [];

  private readonly tuluaCenter:
    L.LatLngExpression = [
      4.0847,
      -76.1954
    ];

  private map: L.Map | null = null;

  private eventsLayer:
    L.LayerGroup | null = null;

  private viewInitialized = false;

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    this.initializeMap();

    this.renderMapData();
  }

  ngOnChanges(
    _changes: SimpleChanges
  ): void {
    if (
      this.viewInitialized &&
      this.map
    ) {
      this.renderMapData();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.eventsLayer = null;
  }

  private initializeMap(): void {
    const mapElement =
      document.getElementById('waze-map');

    if (!mapElement || this.map) {
      return;
    }

    this.map = L.map(
      mapElement,
      {
        center: this.tuluaCenter,
        zoom: 13,
        zoomControl: true,
        preferCanvas: true
      }
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    this.eventsLayer =
      L.layerGroup().addTo(this.map);

    window.setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private renderMapData(): void {
    if (!this.map || !this.eventsLayer) {
      return;
    }

    this.eventsLayer.clearLayers();

    const visibleLayers: L.Layer[] = [];

    for (const alerta of this.alertas) {
      const layer =
        this.createAlertLayer(alerta);

      if (!layer) {
        continue;
      }

      layer.addTo(this.eventsLayer);
      visibleLayers.push(layer);
    }

    for (const atasco of this.atascos) {
      const layer =
        this.createJamLayer(atasco);

      if (!layer) {
        continue;
      }

      layer.addTo(this.eventsLayer);
      visibleLayers.push(layer);
    }

    if (visibleLayers.length > 0) {
      const group =
        L.featureGroup(visibleLayers);

      const bounds =
        group.getBounds();

      if (bounds.isValid()) {
        this.map.fitBounds(
          bounds,
          {
            padding: [35, 35],
            maxZoom: 16
          }
        );
      }
    } else {
      this.map.setView(
        this.tuluaCenter,
        13
      );
    }

    window.setTimeout(() => {
      this.map?.invalidateSize();
    }, 50);
  }

  private createAlertLayer(
  alerta: WazeAlerta
): L.Marker | null {
  if (
    alerta.latitud == null ||
    alerta.longitud == null ||
    !Number.isFinite(alerta.latitud) ||
    !Number.isFinite(alerta.longitud)
  ) {
    return null;
  }

  const presentation =
    getWazeEventPresentation(
      alerta.tipo,
      alerta.subtipo
    );

  const title =
    this.escapeHtml(
      presentation.label
    );

  const category =
    this.escapeHtml(
      presentation.category
    );

  const location =
    this.escapeHtml(
      alerta.calle ||
      alerta.ciudad ||
      'Ubicación no disponible'
    );

  const icon =
    L.divIcon({
      className: 'waze-event-marker',

      html: `
        <div
          class="waze-event-marker-content"
          style="
            --marker-color:
            ${presentation.color}
          "
        >
          <span>
            ${presentation.icon}
          </span>
        </div>
      `,

      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -20]
    });

  const marker =
    L.marker(
      [
        alerta.latitud,
        alerta.longitud
      ],
      {
        icon
      }
    );

  marker.bindPopup(`
    <div class="waze-map-popup">
      <strong>${title}</strong>
      <span>${location}</span>
      <small>
        Categoría: ${category}
      </small>
      <small>
        Confianza:
        ${alerta.confianza ?? 'No disponible'}
      </small>
      <small>
        Confiabilidad:
        ${alerta.confiabilidad ?? 'No disponible'}
      </small>
      <small>
        Coordenadas:
        ${alerta.latitud.toFixed(5)},
        ${alerta.longitud.toFixed(5)}
      </small>
    </div>
  `);

  marker.bindTooltip(
    title,
    {
      direction: 'top',
      offset: [0, -18]
    }
  );

  return marker;
}

  private createJamLayer(
    atasco: WazeAtasco
  ): L.Polyline | null {
    if (
      !Array.isArray(atasco.geometria) ||
      atasco.geometria.length < 2
    ) {
      return null;
    }

    const points: L.LatLngExpression[] =
      atasco.geometria
        .filter(
          (point) =>
            Number.isFinite(point.x) &&
            Number.isFinite(point.y)
        )
        .map(
          (point) => [
            point.y,
            point.x
          ] as L.LatLngExpression
        );

    if (points.length < 2) {
      return null;
    }

    const line = L.polyline(
      points,
      {
        color: '#f59e0b',
        weight: 7,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }
    );

    const street = this.escapeHtml(
      atasco.calle ||
      'Vía sin identificar'
    );

    const city = this.escapeHtml(
      atasco.ciudad ||
      'Tuluá'
    );

    const speed =
      atasco.velocidad_kmh != null
        ? `${atasco.velocidad_kmh.toFixed(1)} km/h`
        : 'No disponible';

    const delay =
      atasco.retraso_segundos != null
        ? `${atasco.retraso_segundos} segundos`
        : 'No disponible';

    const length =
      atasco.longitud_metros != null
        ? `${atasco.longitud_metros} metros`
        : 'No disponible';

    line.bindPopup(`
      <div class="waze-map-popup">
        <strong>${street}</strong>
        <span>${city}</span>
        <small>
          Nivel de congestión:
          ${atasco.nivel_congestion ?? 'No disponible'}
        </small>
        <small>Velocidad: ${speed}</small>
        <small>Retraso: ${delay}</small>
        <small>Longitud: ${length}</small>
      </div>
    `);

    line.bindTooltip(
      street,
      {
        sticky: true
      }
    );

    return line;
  }

  private getAlertLabel(
    value: string
  ): string {
    const labels: Record<string, string> = {
      HAZARD:
        'Peligro en la vía',

      HAZARD_ON_ROAD_POT_HOLE:
        'Hueco en la vía',

      HAZARD_ON_SHOULDER_CAR_STOPPED:
        'Vehículo detenido en la berma',

      ACCIDENT:
        'Accidente',

      ROAD_CLOSED:
        'Vía cerrada',

      JAM:
        'Congestión vial'
    };

    return labels[value] ??
      value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(
          /^\w/,
          (letter) => letter.toUpperCase()
        );
  }

  private getAlertColor(
    type: string | null,
    subtype: string | null
  ): string {
    const value =
      subtype || type || '';

    if (value.includes('ACCIDENT')) {
      return '#dc2626';
    }

    if (
      value.includes('ROAD_CLOSED') ||
      value.includes('CLOSURE')
    ) {
      return '#7c3aed';
    }

    if (
      value.includes('CAR_STOPPED')
    ) {
      return '#f59e0b';
    }

    if (
      value.includes('POT_HOLE')
    ) {
      return '#ef4444';
    }

    return '#e5484d';
  }

  private escapeHtml(
    value: string
  ): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
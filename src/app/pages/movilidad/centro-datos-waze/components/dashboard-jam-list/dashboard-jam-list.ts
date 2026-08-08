import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  LucideActivity,
  LucideTriangleAlert
} from '@lucide/angular';

import * as L from 'leaflet';

import 'leaflet.heat';

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
export class DashboardJamListComponent
  implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('heatmapContainer')
  heatmapContainer?:
    ElementRef<HTMLDivElement>;

  @Input()
  atascos: WazeAtasco[] = [];

  @Input()
  retrasoPromedioSegundos:
    number | null = null;

  private map:
    L.Map | null = null;

  private heatLayer:
    L.HeatLayer | null = null;

  /*
   * Grupo que contiene las zonas
   * invisibles de interacción.
   */
  private jamLayer:
    L.LayerGroup | null = null;

  /*
   * Renderer SVG exclusivo para
   * detectar los clics sobre los
   * tramos congestionados.
   */
  private jamRenderer:
    L.SVG | null = null;

  private readonly tuluaCenter:
    L.LatLngExpression = [
      4.0847,
      -76.1954
    ];

  private viewInitialized = false;

  ngAfterViewInit(): void {

    this.viewInitialized = true;

    window.setTimeout(
      () => {

        this.initializeMap();

        this.renderHeatmap();

      },
      0
    );
  }

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (!changes['atascos']) {
      return;
    }

    if (!this.viewInitialized) {
      return;
    }

    /*
     * Esperamos a que Angular termine
     * de actualizar el DOM.
     */
    window.setTimeout(
      () => {

        if (!this.map) {
          this.initializeMap();
        }

        this.renderHeatmap();

      },
      0
    );
  }

  ngOnDestroy(): void {

    if (this.map) {

      this.map.remove();

      this.map = null;
    }

    this.heatLayer = null;

    this.jamLayer = null;

    this.jamRenderer = null;
  }

  /*
   * ================================================
   * INICIALIZAR MAPA
   * ================================================
   */

  private initializeMap(): void {

    const element =
      this.heatmapContainer
        ?.nativeElement;

    if (
      !element ||
      this.map
    ) {
      return;
    }

    this.map = L.map(
      element,
      {
        center:
          this.tuluaCenter,

        zoom: 13,

        zoomControl: true
      }
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,

        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(
      this.map
    );

    /*
     * ===========================================
     * PANE PARA INTERACCIÓN
     * ===========================================
     *
     * Esta capa estará por encima del heatmap,
     * pero sus líneas serán completamente
     * transparentes.
     *
     * De esta manera podemos detectar clics
     * sin mostrar rayas sobre el mapa.
     */

    const jamPane =
      this.map.createPane(
        'jamInteractivePane'
      );

    jamPane.style.zIndex =
      '650';

    jamPane.style.pointerEvents =
      'auto';

    /*
     * Renderer SVG para las zonas
     * invisibles de interacción.
     */
    this.jamRenderer =
      L.svg({
        pane:
          'jamInteractivePane'
      });

    this.jamRenderer.addTo(
      this.map
    );

    /*
     * Grupo que contendrá las zonas
     * invisibles de los atascos.
     */
    this.jamLayer =
      L.layerGroup()
        .addTo(
          this.map
        );

    window.setTimeout(
      () => {

        this.map
          ?.invalidateSize();

      },
      100
    );
  }

  /*
   * ================================================
   * RENDERIZAR HEATMAP
   * ================================================
   */

  private renderHeatmap(): void {

    if (!this.map) {
      return;
    }

    /*
     * Eliminamos el heatmap anterior.
     */
    if (this.heatLayer) {

      this.map.removeLayer(
        this.heatLayer
      );

      this.heatLayer = null;
    }

    /*
     * Eliminamos las zonas de interacción
     * anteriores.
     *
     * Esto es importante para que cuando
     * se actualicen los datos cada 2 minutos
     * no queden atascos antiguos clicables.
     */
    this.jamLayer
      ?.clearLayers();

    const heatPoints:
      L.HeatLatLngTuple[] = [];

    const visibleCoordinates:
      L.LatLngExpression[] = [];

    for (
      const atasco
      of this.atascos
    ) {

      if (
        !Array.isArray(
          atasco.geometria
        ) ||
        atasco.geometria.length === 0
      ) {
        continue;
      }

      /*
       * ===========================================
       * INTENSIDAD DEL HEATMAP
       * ===========================================
       */

      const congestionLevel =
        atasco.nivel_congestion
        ?? 1;

      const intensity =
        Math.min(
          Math.max(
            congestionLevel / 5,
            0.15
          ),
          1
        );

      const jamCoordinates:
        L.LatLngExpression[] = [];

      for (
        const point
        of atasco.geometria
      ) {

        if (
          !Number.isFinite(
            point.x
          ) ||
          !Number.isFinite(
            point.y
          )
        ) {
          continue;
        }

        /*
         * En el feed de Waze:
         *
         * x = longitud
         * y = latitud
         */
        const latitude =
          point.y;

        const longitude =
          point.x;

        /*
         * Punto utilizado por el
         * mapa de calor.
         */
        heatPoints.push(
          [
            latitude,
            longitude,
            intensity
          ]
        );

        /*
         * Coordenadas utilizadas
         * para ajustar la vista.
         */
        visibleCoordinates.push(
          [
            latitude,
            longitude
          ]
        );

        /*
         * Coordenadas utilizadas para
         * crear la zona invisible
         * correspondiente al atasco.
         */
        jamCoordinates.push(
          [
            latitude,
            longitude
          ]
        );
      }

      /*
       * Solamente creamos una zona
       * interactiva cuando existen al
       * menos dos puntos.
       */
      if (
        jamCoordinates.length >= 2
      ) {

        this.createInteractiveJamLine(
          atasco,
          jamCoordinates
        );
      }
    }

    /*
     * ================================================
     * SIN DATOS
     * ================================================
     */

    if (
      heatPoints.length === 0
    ) {

      this.map.setView(
        this.tuluaCenter,
        13
      );

      window.setTimeout(
        () => {

          this.map
            ?.invalidateSize();

        },
        50
      );

      return;
    }

    /*
     * ================================================
     * CREAR HEATMAP
     * ================================================
     */

    this.heatLayer =
      L.heatLayer(
        heatPoints,
        {
          radius: 28,

          blur: 22,

          maxZoom: 17,

          minOpacity: 0.35,

          gradient: {
            0.2:
              '#38bdf8',

            0.4:
              '#22c55e',

            0.6:
              '#facc15',

            0.8:
              '#f97316',

            1:
              '#dc2626'
          }
        }
      );

    this.heatLayer.addTo(
      this.map
    );

    /*
     * ================================================
     * AJUSTAR VISTA
     * ================================================
     */

    const bounds =
      L.latLngBounds(
        visibleCoordinates
      );

    if (
      bounds.isValid()
    ) {

      this.map.fitBounds(
        bounds,
        {
          padding: [
            30,
            30
          ],

          maxZoom: 15
        }
      );

    } else {

      this.map.setView(
        this.tuluaCenter,
        13
      );
    }

    /*
     * Forzamos a Leaflet a recalcular
     * correctamente las dimensiones.
     */
    window.setTimeout(
      () => {

        this.map
          ?.invalidateSize();

      },
      50
    );
  }

  /*
   * ================================================
   * ZONA INVISIBLE INTERACTIVA
   * ================================================
   *
   * Esta línea NO se utiliza para representar
   * gráficamente el atasco.
   *
   * Su única función es permitir que el usuario
   * haga clic sobre el sector correspondiente
   * y consulte la información.
   */

  private createInteractiveJamLine(
    atasco: WazeAtasco,
    coordinates:
      L.LatLngExpression[]
  ): void {

    if (
      !this.map ||
      !this.jamLayer ||
      !this.jamRenderer
    ) {
      return;
    }

    /*
     * Creamos una línea suficientemente ancha
     * para facilitar la selección.
     *
     * opacity: 0 hace que sea completamente
     * invisible.
     *
     * Aunque no se vea, SVG conserva la zona
     * interactiva de la línea.
     */
    const polyline =
      L.polyline(
        coordinates,
        {
          pane:
            'jamInteractivePane',

          renderer:
            this.jamRenderer,

          color:
            '#000000',

          /*
           * Área cómoda para hacer clic.
           */
          weight: 20,

          /*
           * IMPORTANTE:
           *
           * La línea nunca será visible.
           */
          opacity: 0,

          lineCap:
            'round',

          lineJoin:
            'round',

          interactive:
            true
        }
      );

    /*
     * ================================================
     * POPUP
     * ================================================
     *
     * No utilizamos tooltip ni resaltamos
     * visualmente la línea.
     *
     * La información solamente aparece
     * cuando el usuario hace clic.
     */

    polyline.bindPopup(
      this.buildJamPopup(
        atasco
      ),
      {
        maxWidth: 360,

        minWidth: 290,

        className:
          'waze-jam-popup',

        /*
         * Leaflet moverá ligeramente el mapa
         * cuando sea necesario para mantener
         * el popup visible.
         */
        autoPan: true,

        autoPanPadding: [
          30,
          30
        ],

        closeButton: true
      }
    );

    /*
     * ================================================
     * CURSOR
     * ================================================
     *
     * La línea continúa siendo invisible,
     * pero el cursor cambia para indicar
     * que existe información disponible.
     */

    polyline.on(
      'add',
      () => {

        const element =
          polyline.getElement();

        if (
          element instanceof
          SVGElement
        ) {

          element.style.cursor =
            'pointer';
        }
      }
    );

    /*
     * Agregamos la zona invisible
     * a la capa de interacción.
     */
    polyline.addTo(
      this.jamLayer
    );
  }

  /*
   * ================================================
   * CONTENIDO DEL POPUP
   * ================================================
   */

  private buildJamPopup(
    atasco: WazeAtasco
  ): string {

    const street =
      this.escapeHtml(
        atasco.calle ||
        'Vía sin identificar'
      );

    const city =
      this.escapeHtml(
        atasco.ciudad ||
        'Tuluá'
      );

    const congestionLevel =
      atasco.nivel_congestion;

    const congestionLabel =
      this.getCongestionLabel(
        congestionLevel
      );

    const color =
      this.getCongestionColor(
        congestionLevel
      );

    /*
     * Velocidad.
     */
    const speed =
      atasco.velocidad_kmh
        != null
        ? `${
            atasco
              .velocidad_kmh
              .toFixed(1)
          } km/h`
        : 'Sin información';

    /*
     * Longitud.
     */
    const length =
      atasco.longitud_metros
        != null
        ? `${
            Math.round(
              atasco
                .longitud_metros
            ).toLocaleString(
              'es-CO'
            )
          } m`
        : 'Sin información';

    /*
     * Retraso en segundos.
     */
    const delay =
      atasco.retraso_segundos
        != null
        ? `${
            Math.round(
              atasco
                .retraso_segundos
            )
          } s`
        : 'Sin información';

    /*
     * Retraso convertido a minutos.
     */
    const delayMinutes =
      atasco.retraso_segundos
        != null
        ? (
            atasco
              .retraso_segundos /
            60
          ).toFixed(1)
        : null;

    return `
      <div class="jam-popup">

        <div
          class="jam-popup-header"
        >

          <span
            class="jam-popup-indicator"
            style="
              background:
                ${color};
            "
          >
          </span>

          <div
            class="jam-popup-title"
          >

            <small>
              Congestión vial
            </small>

            <strong>
              ${street}
            </strong>

          </div>

        </div>

        <div
          class="jam-popup-location"
        >
          ${city}
        </div>

        <div
          class="jam-popup-severity"
        >

          <span
            class="jam-popup-severity-label"
            style="
              color:
                ${color};
            "
          >
            ${congestionLabel}
          </span>

          <strong>

            ${
              congestionLevel != null
                ? `Nivel ${congestionLevel}`
                : 'Nivel no disponible'
            }

          </strong>

        </div>

        <div
          class="jam-popup-grid"
        >

          <div
            class="jam-popup-metric"
          >

            <small>
              Velocidad
            </small>

            <strong>
              ${speed}
            </strong>

          </div>

          <div
            class="jam-popup-metric"
          >

            <small>
              Longitud
            </small>

            <strong>
              ${length}
            </strong>

          </div>

          <div
            class="jam-popup-metric"
          >

            <small>
              Retraso
            </small>

            <strong>
              ${delay}
            </strong>

          </div>

          <div
            class="jam-popup-metric"
          >

            <small>
              Equivalente
            </small>

            <strong>

              ${
                delayMinutes
                  ? `${delayMinutes} min`
                  : '--'
              }

            </strong>

          </div>

        </div>

        <div
          class="jam-popup-help"
        >
          Información reportada por Waze
          para este tramo.
        </div>

      </div>
    `;
  }

  /*
   * ================================================
   * CLASIFICACIÓN DE CONGESTIÓN
   * ================================================
   */

  private getCongestionLabel(
    level:
      number | null | undefined
  ): string {

    if (level == null) {
      return 'Nivel no disponible';
    }

    if (level <= 1) {
      return 'Congestión baja';
    }

    if (level === 2) {
      return 'Congestión moderada';
    }

    if (level === 3) {
      return 'Congestión alta';
    }

    return 'Congestión crítica';
  }

  /*
   * ================================================
   * COLOR SEGÚN NIVEL
   * ================================================
   */

  private getCongestionColor(
    level:
      number | null | undefined
  ): string {

    if (level == null) {
      return '#64748b';
    }

    if (level <= 1) {
      return '#38bdf8';
    }

    if (level === 2) {
      return '#22c55e';
    }

    if (level === 3) {
      return '#facc15';
    }

    if (level === 4) {
      return '#f97316';
    }

    return '#dc2626';
  }

  /*
   * ================================================
   * ESCAPAR HTML
   * ================================================
   */

  private escapeHtml(
    value: string
  ): string {

    return value
      .replaceAll(
        '&',
        '&amp;'
      )
      .replaceAll(
        '<',
        '&lt;'
      )
      .replaceAll(
        '>',
        '&gt;'
      )
      .replaceAll(
        '"',
        '&quot;'
      )
      .replaceAll(
        "'",
        '&#039;'
      );
  }
}
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

import * as LeafletHeat
  from '@linkurious/leaflet-heat';

import type {
  WazeAtasco
} from '../../models/waze-dashboard.model';

/*
 * ================================================
 * TIPOS DEL MAPA DE CALOR
 * ================================================
 */

/*
 * Punto del heatmap:
 *
 * [
 *   latitud,
 *   longitud,
 *   intensidad
 * ]
 */
type HeatPoint = [
  number,
  number,
  number
];

/*
 * Opciones utilizadas
 * por la capa de calor.
 */
interface HeatLayerOptions {
  radius?: number;

  blur?: number;

  maxZoom?: number;

  minOpacity?: number;

  gradient?: {
    [key: number]: string;
  };
}

/*
 * Firma esperada para
 * crear una capa de calor.
 */
type HeatLayerFactory = (
  points: HeatPoint[],
  options?: HeatLayerOptions
) => L.Layer;

/*
 * Compatibilidad con distintas
 * formas de empaquetado.
 */
interface HeatModuleCompatibility {

  heatLayer?:
    HeatLayerFactory;

  default?:
    | HeatLayerFactory
    | {
        heatLayer?:
          HeatLayerFactory;
      };
}

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

  /*
   * ================================================
   * ELEMENTO HTML
   * ================================================
   */

  @ViewChild('heatmapContainer')
  heatmapContainer?:
    ElementRef<HTMLDivElement>;

  /*
   * ================================================
   * INPUTS
   * ================================================
   */

  @Input()
  atascos: WazeAtasco[] = [];

  @Input()
  retrasoPromedioSegundos:
    number | null = null;

  /*
   * ================================================
   * LEAFLET
   * ================================================
   */

  private map:
    L.Map | null = null;

  /*
   * Capa actual del heatmap.
   */
  private heatmapLayer:
    L.Layer | null = null;

  /*
   * Zonas invisibles utilizadas
   * para detectar clics.
   */
  private jamLayer:
    L.LayerGroup | null = null;

  /*
   * Renderer SVG para las
   * líneas invisibles.
   */
  private jamRenderer:
    L.SVG | null = null;

  /*
   * ================================================
   * CONTROL DE INICIALIZACIÓN
   * ================================================
   */

  private viewInitialized = false;

  /*
   * Guardamos los temporizadores
   * utilizados durante la estabilización
   * inicial del mapa.
   */
  private stabilizationTimers:
    number[] = [];

  /*
   * Centro aproximado
   * de Tuluá.
   */
  private readonly tuluaCenter:
    L.LatLngExpression = [
      4.0847,
      -76.1954
    ];

  /*
   * ================================================
   * CICLO DE VIDA
   * ================================================
   */

  ngAfterViewInit(): void {

    this.viewInitialized = true;

    /*
     * Primera inicialización.
     *
     * Esperamos al siguiente ciclo
     * del navegador para que Angular
     * termine de pintar el contenedor.
     */
    window.setTimeout(
      () => {

        this.initializeMap();

        this.renderHeatmap();

        /*
         * En builds de producción el layout
         * puede terminar de calcular sus
         * dimensiones algunos milisegundos
         * después.
         *
         * Por eso hacemos varias verificaciones
         * controladas durante el primer segundo.
         */
        this.scheduleInitialStabilization();

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
     * Cuando llegan datos nuevos
     * esperamos a que Angular termine
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

    /*
     * Cancelamos temporizadores
     * pendientes.
     */
    for (
      const timerId
      of this.stabilizationTimers
    ) {

      window.clearTimeout(
        timerId
      );
    }

    this.stabilizationTimers = [];

    /*
     * Destruimos Leaflet.
     */
    if (this.map) {

      this.map.remove();

      this.map = null;
    }

    this.heatmapLayer = null;

    this.jamLayer = null;

    this.jamRenderer = null;
  }

  /*
   * ================================================
   * ESTABILIZACIÓN INICIAL
   * ================================================
   *
   * Esto resuelve el caso en que el build
   * de producción inicializa Leaflet antes
   * de que el contenedor tenga su tamaño final.
   */

  private scheduleInitialStabilization(): void {

    /*
     * Primera comprobación rápida.
     */
    this.scheduleMapRefresh(
      150
    );

    /*
     * Segunda comprobación cuando
     * el layout ya debería estar estable.
     */
    this.scheduleMapRefresh(
      400
    );

    /*
     * Última comprobación de seguridad.
     *
     * Después de este punto no seguimos
     * redibujando automáticamente.
     */
    this.scheduleMapRefresh(
      900
    );
  }

  /*
   * ================================================
   * PROGRAMAR REAJUSTE
   * ================================================
   */

  private scheduleMapRefresh(
    delayMs: number
  ): void {

    const timerId =
      window.setTimeout(
        () => {

          if (!this.map) {
            return;
          }

          /*
           * Leaflet vuelve a leer
           * ancho y alto reales.
           */
          this.map.invalidateSize({
            animate: false,
            pan: false
          });

          /*
           * Volvemos a construir la capa
           * utilizando el tamaño definitivo
           * del mapa.
           */
          this.renderHeatmap();

        },
        delayMs
      );

    this.stabilizationTimers.push(
      timerId
    );
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

    /*
     * ================================================
     * MAPA
     * ================================================
     */

    this.map =
      L.map(
        element,
        {
          center:
            this.tuluaCenter,

          zoom: 13,

          zoomControl: true,

          /*
           * SVG se utiliza para
           * las geometrías interactivas.
           */
          preferCanvas: false
        }
      );

    /*
     * ================================================
     * OPENSTREETMAP
     * ================================================
     */

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
     * ================================================
     * PANE DE INTERACCIÓN
     * ================================================
     *
     * Las geometrías de Waze estarán
     * en esta capa.
     *
     * Son invisibles, pero clicables.
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
     * ================================================
     * RENDERER SVG
     * ================================================
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
     * ================================================
     * GRUPO DE ATASCOS
     * ================================================
     */

    this.jamLayer =
      L.layerGroup()
        .addTo(
          this.map
        );

    /*
     * Primera actualización
     * de dimensiones.
     */
    window.setTimeout(
      () => {

        this.map
          ?.invalidateSize({
            animate: false,
            pan: false
          });

      },
      50
    );
  }

  /*
   * ================================================
   * RENDERIZAR MAPA DE CALOR
   * ================================================
   */

  private renderHeatmap(): void {

    if (!this.map) {
      return;
    }

    /*
     * ================================================
     * ELIMINAR HEATMAP ANTERIOR
     * ================================================
     */

    if (this.heatmapLayer) {

      this.map.removeLayer(
        this.heatmapLayer
      );

      this.heatmapLayer = null;
    }

    /*
     * ================================================
     * LIMPIAR ZONAS DE CLIC
     * ================================================
     *
     * Es importante para la actualización
     * automática cada dos minutos.
     */

    this.jamLayer
      ?.clearLayers();

    /*
     * ================================================
     * ARRAYS DE DATOS
     * ================================================
     */

    const heatPoints:
      HeatPoint[] = [];

    const visibleCoordinates:
      L.LatLngExpression[] = [];

    /*
     * ================================================
     * PROCESAR ATASCOS
     * ================================================
     */

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
       * INTENSIDAD
       * ===========================================
       */

      const congestionLevel =
        atasco.nivel_congestion
        ?? 1;

      /*
       * Convertimos nivel Waze
       * a intensidad 0 - 1.
       */
      const intensity =
        Math.min(
          Math.max(
            congestionLevel / 5,
            0.15
          ),
          1
        );

      /*
       * Coordenadas del atasco
       * individual.
       */
      const jamCoordinates:
        L.LatLngExpression[] = [];

      /*
       * ===========================================
       * GEOMETRÍA
       * ===========================================
       */

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
         * Waze:
         *
         * x = longitud
         * y = latitud
         */
        const latitude =
          point.y;

        const longitude =
          point.x;

        /*
         * Mapa de calor.
         */
        heatPoints.push(
          [
            latitude,
            longitude,
            intensity
          ]
        );

        /*
         * Ajuste automático
         * de límites.
         */
        visibleCoordinates.push(
          [
            latitude,
            longitude
          ]
        );

        /*
         * Área invisible
         * para clic.
         */
        jamCoordinates.push(
          [
            latitude,
            longitude
          ]
        );
      }

      /*
       * Una polilínea necesita
       * mínimo dos coordenadas.
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

      this.map.invalidateSize({
        animate: false,
        pan: false
      });

      return;
    }

    /*
     * ================================================
     * OBTENER FACTORÍA DEL HEATMAP
     * ================================================
     */

    const heatLayerFactory =
      this.getHeatLayerFactory();

    if (!heatLayerFactory) {

      console.error(
        'No fue posible inicializar el mapa de calor.'
      );

      return;
    }

    /*
     * ================================================
     * CREAR HEATMAP
     * ================================================
     */

    this.heatmapLayer =
      heatLayerFactory(
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

    /*
     * ================================================
     * AGREGAR AL MAPA
     * ================================================
     */

    this.heatmapLayer.addTo(
      this.map
    );

    /*
     * ================================================
     * AJUSTAR MAPA A LOS EVENTOS
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

          maxZoom: 15,

          animate: false
        }
      );

    } else {

      this.map.setView(
        this.tuluaCenter,
        13
      );
    }

    /*
     * ================================================
     * RECALCULAR TAMAÑO
     * ================================================
     */

    window.setTimeout(
      () => {

        this.map
          ?.invalidateSize({
            animate: false,
            pan: false
          });

      },
      50
    );
  }

  /*
   * ================================================
   * OBTENER HEATLAYER
   * ================================================
   *
   * Compatibilidad con diferentes
   * formas de empaquetado del módulo.
   */

  private getHeatLayerFactory():
    HeatLayerFactory | null {

    const heatModule =
      LeafletHeat as unknown as
      HeatModuleCompatibility;

    /*
     * ================================================
     * OPCIÓN 1
     * ================================================
     *
     * module.heatLayer
     */

    if (
      typeof heatModule
        .heatLayer ===
        'function'
    ) {

      return heatModule
        .heatLayer;
    }

    /*
     * ================================================
     * DEFAULT
     * ================================================
     */

    const defaultExport =
      heatModule.default;

    /*
     * ================================================
     * OPCIÓN 2
     * ================================================
     *
     * module.default.heatLayer
     */

    if (
      defaultExport &&
      typeof defaultExport
        === 'object' &&
      'heatLayer'
        in defaultExport &&
      typeof defaultExport
        .heatLayer ===
        'function'
    ) {

      return defaultExport
        .heatLayer;
    }

    /*
     * ================================================
     * OPCIÓN 3
     * ================================================
     *
     * module.default
     */

    if (
      typeof defaultExport
        === 'function'
    ) {

      return defaultExport;
    }

    /*
     * ================================================
     * OPCIÓN 4
     * ================================================
     *
     * L.heatLayer
     */

    const leafletWithHeat =
      L as typeof L & {
        heatLayer?:
          HeatLayerFactory;
      };

    if (
      typeof leafletWithHeat
        .heatLayer ===
        'function'
    ) {

      return leafletWithHeat
        .heatLayer;
    }

    /*
     * ================================================
     * ERROR DE DIAGNÓSTICO
     * ================================================
     */

    console.error(
      'No se encontró una función heatLayer válida.'
    );

    console.error(
      'Contenido de @linkurious/leaflet-heat:',
      LeafletHeat
    );

    return null;
  }

  /*
   * ================================================
   * ZONA INVISIBLE INTERACTIVA
   * ================================================
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
     * Línea totalmente transparente.
     *
     * No representa visualmente
     * el atasco.
     *
     * Solamente sirve para
     * detectar el clic.
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
           * Superficie cómoda
           * para hacer clic.
           */
          weight: 20,

          /*
           * Invisible.
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

    /*
     * Vía.
     */
    const street =
      this.escapeHtml(
        atasco.calle ||
        'Vía sin identificar'
      );

    /*
     * Ciudad.
     */
    const city =
      this.escapeHtml(
        atasco.ciudad ||
        'Tuluá'
      );

    /*
     * Nivel.
     */
    const congestionLevel =
      atasco.nivel_congestion;

    /*
     * Texto del nivel.
     */
    const congestionLabel =
      this.getCongestionLabel(
        congestionLevel
      );

    /*
     * Color del nivel.
     */
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
     * Retraso.
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
     * Equivalente en minutos.
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

    /*
     * ================================================
     * HTML
     * ================================================
     */

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
   * CLASIFICACIÓN
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
   * COLOR
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
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import * as L from 'leaflet';

import {
  LucideBuilding2,
  LucideCoffee,
  LucideCompass,
  LucideHotel,
  LucideMapPin,
  LucideMapPinned,
  LucideRefreshCw,
  LucideShoppingBag,
  LucideUtensils
} from '@lucide/angular';

import {
  TourismAsset,
  TourismAssetCategory,
  TourismAssetsService,
  TourismAssetsSummary
} from '../../../core/services/tourism-assets.service';


/* =========================================================
 * FILTROS
 * ========================================================= */

type TourismFilter =
  | 'ALL'
  | TourismAssetCategory;


/* =========================================================
 * OPCIÓN DE CATEGORÍA
 * ========================================================= */

interface TourismCategoryOption {

  value:
    TourismFilter;

  label:
    string;

  shortLabel:
    string;
}


/* =========================================================
 * ESTILO DE MAPA
 * ========================================================= */

interface TourismCategoryMapStyle {

  color:
    string;

  label:
    string;
}


@Component({

  selector:
    'app-activos-turismo',

  standalone:
    true,

  imports: [

    CommonModule,

    LucideBuilding2,

    LucideCoffee,

    LucideCompass,

    LucideHotel,

    LucideMapPin,

    LucideMapPinned,

    LucideRefreshCw,

    LucideShoppingBag,

    LucideUtensils
  ],

  templateUrl:
    './activos-turismo.html',

  styleUrl:
    './activos-turismo.scss'
})
export class ActivosTurismo
  implements OnInit, OnDestroy {


  /* =======================================================
   * REFERENCIA AL MAPA
   * ======================================================= */

  @ViewChild(
    'tourismMap'
  )
  set tourismMapElement(
    element:
      ElementRef<HTMLDivElement> | undefined
  ) {

    if (
      !element ||
      this.map ||
      this.loading ||
      this.errorMessage
    ) {

      return;
    }


    this.mapContainer =
      element.nativeElement;


    this.scheduleMapInitialization();
  }


  /* =======================================================
   * DATOS
   * ======================================================= */

  assets:
    TourismAsset[] = [];


  /* =======================================================
   * RESUMEN
   * ======================================================= */

  summary:
    TourismAssetsSummary =
    this.createEmptySummary();


  /* =======================================================
   * ESTADO
   * ======================================================= */

  loading =
    true;

  errorMessage =
    '';

  activeFilter:
    TourismFilter =
    'ALL';

  selectedAssetId:
    number | null =
    null;


  /* =======================================================
   * LEAFLET
   * ======================================================= */

  private map:
    L.Map | null =
    null;

  private mapContainer:
    HTMLDivElement | null =
    null;

  private markersLayer:
    L.LayerGroup | null =
    null;

  private readonly markerByAssetId =
    new Map<number, L.Marker>();

  private mapInitializationPending =
    false;


  private readonly tuluaCenter:
    L.LatLngExpression = [
      4.0847,
      -76.1954
    ];


  /* =======================================================
   * CATEGORÍAS
   * ======================================================= */

  readonly categories:
    TourismCategoryOption[] = [

    {
      value:
        'ALL',

      label:
        'Todos',

      shortLabel:
        'Todos'
    },

    {
      value:
        'HOTEL',

      label:
        'Hoteles y alojamientos',

      shortLabel:
        'Alojamientos'
    },

    {
      value:
        'GASTRONOMIA',

      label:
        'Gastronomía',

      shortLabel:
        'Gastronomía'
    },

    {
      value:
        'AGENCIA',

      label:
        'Agencias operadoras',

      shortLabel:
        'Agencias'
    },

    {
      value:
        'CAFE',

      label:
        'Cafés',

      shortLabel:
        'Cafés'
    },

    {
      value:
        'ARTESANIA_RECUERDO',

      label:
        'Artesanías y recuerdos',

      shortLabel:
        'Artesanías'
    }
  ];


  /* =======================================================
   * ESTILOS DE CATEGORÍAS
   * ======================================================= */

  private readonly mapCategoryStyles:
    Record<
      TourismAssetCategory,
      TourismCategoryMapStyle
    > = {

    HOTEL: {

      color:
        '#2474b8',

      label:
        'Alojamiento'
    },

    GASTRONOMIA: {

      color:
        '#e57c00',

      label:
        'Gastronomía'
    },

    AGENCIA: {

      color:
        '#7c3aed',

      label:
        'Agencia'
    },

    CAFE: {

      color:
        '#8b5e3c',

      label:
        'Café'
    },

    ARTESANIA_RECUERDO: {

      color:
        '#0f8a73',

      label:
        'Artesanía'
    }
  };


  /* =======================================================
   * CONSTRUCTOR
   * ======================================================= */

  constructor(

    private readonly tourismAssetsService:
      TourismAssetsService,

    private readonly changeDetectorRef:
      ChangeDetectorRef,

    private readonly ngZone:
      NgZone

  ) {}


  /* =======================================================
   * INICIALIZACIÓN
   * ======================================================= */

  async ngOnInit():
    Promise<void> {

    await this.loadAssets();
  }


  /* =======================================================
   * DESTRUCCIÓN
   * ======================================================= */

  ngOnDestroy():
    void {

    this.destroyMap();
  }


  /* =======================================================
   * CARGAR ACTIVOS
   * ======================================================= */

  async loadAssets(
    forceRefresh:
      boolean = false
  ): Promise<void> {

    this.loading =
      true;

    this.errorMessage =
      '';

    this.selectedAssetId =
      null;


    this.changeDetectorRef
      .detectChanges();


    try {

      const assets =
        await this.tourismAssetsService
          .getActiveAssets(
            forceRefresh
          );


      /*
       * Nos aseguramos de volver a la zona
       * de Angular antes de modificar la vista.
       */

      this.ngZone.run(
        () => {

          this.assets =
            assets;


          this.summary =
            this.tourismAssetsService
              .getSummary(
                assets
              );


          this.loading =
            false;


          this.changeDetectorRef
            .detectChanges();
        }
      );


      /*
       * El HTML ya fue pintado.
       * Ahora dejamos que ViewChild detecte
       * el contenedor y monte Leaflet.
       */

      this.scheduleMapInitialization();

    } catch (
      error
    ) {

      console.error(
        'Error cargando activos turísticos:',
        error
      );


      this.ngZone.run(
        () => {

          this.assets =
            [];


          this.summary =
            this.createEmptySummary();


          this.errorMessage =
            error instanceof Error
              ? error.message
              : 'No fue posible cargar los activos turísticos.';


          this.loading =
            false;


          this.changeDetectorRef
            .detectChanges();
        }
      );
    }
  }


  /* =======================================================
   * ACTIVOS FILTRADOS
   * ======================================================= */

  get filteredAssets():
    TourismAsset[] {

    if (
      this.activeFilter === 'ALL'
    ) {

      return this.assets;
    }


    return this.assets.filter(
      asset =>
        asset.categoria ===
        this.activeFilter
    );
  }


  /* =======================================================
   * ACTIVOS DEL MAPA
   * ======================================================= */

  get mappedAssets():
    TourismAsset[] {

    return this.filteredAssets.filter(
      asset =>
        asset.latitud !== null &&
        asset.longitud !== null
    );
  }


  /* =======================================================
   * CAMBIAR FILTRO
   * ======================================================= */

  setFilter(
    filter:
      TourismFilter
  ): void {

    this.activeFilter =
      filter;


    this.selectedAssetId =
      null;


    this.changeDetectorRef
      .detectChanges();


    window.requestAnimationFrame(
      () => {

        this.refreshMapMarkers();
      }
    );
  }


  /* =======================================================
   * FILTRO ACTIVO
   * ======================================================= */

  isFilterActive(
    filter:
      TourismFilter
  ): boolean {

    return this.activeFilter ===
      filter;
  }


  /* =======================================================
   * TOTAL REGISTRADO
   * ======================================================= */

  getCategoryCount(
    category:
      TourismFilter
  ): number {

    if (
      category === 'ALL'
    ) {

      return this.summary.total;
    }


    return this.summary
      .porCategoria[
        category
      ] ?? 0;
  }


  /* =======================================================
   * TOTAL GEOLOCALIZADO
   * ======================================================= */

  getMapCategoryCount(
    category:
      TourismFilter
  ): number {

    const geolocated =
      this.assets.filter(
        asset =>
          asset.latitud !== null &&
          asset.longitud !== null
      );


    if (
      category === 'ALL'
    ) {

      return geolocated.length;
    }


    return geolocated.filter(
      asset =>
        asset.categoria ===
        category
    ).length;
  }


  /* =======================================================
   * PORCENTAJE
   * ======================================================= */

  getCategoryPercentage(
    category:
      TourismAssetCategory
  ): number {

    if (
      this.summary.total <= 0
    ) {

      return 0;
    }


    const count =
      this.summary
        .porCategoria[
          category
        ] ?? 0;


    return (
      count /
      this.summary.total
    ) * 100;
  }


  /* =======================================================
   * ETIQUETA DE CATEGORÍA
   * ======================================================= */

  getCategoryLabel(
    category:
      TourismAssetCategory
  ): string {

    switch (
      category
    ) {

      case 'HOTEL':

        return 'Hoteles y alojamientos';


      case 'GASTRONOMIA':

        return 'Gastronomía';


      case 'AGENCIA':

        return 'Agencias operadoras';


      case 'CAFE':

        return 'Cafés';


      case 'ARTESANIA_RECUERDO':

        return 'Artesanías y recuerdos';
    }
  }


  /* =======================================================
   * PRECISIÓN
   * ======================================================= */

  getPrecisionLabel(
    asset:
      TourismAsset
  ): string {

    switch (
      asset.precision_ubicacion
    ) {

      case 'EXACTA':

        return 'Ubicación exacta';


      case 'APROXIMADA':

        return 'Ubicación aproximada';


      case 'PENDIENTE':

        return 'Ubicación pendiente';
    }
  }


  /* =======================================================
   * URL SITIO WEB
   * ======================================================= */

  getWebsiteUrl(
    website:
      string | null
  ): string | null {

    if (
      !website
    ) {

      return null;
    }


    const normalized =
      website.trim();


    if (
      !normalized
    ) {

      return null;
    }


    if (
      normalized.startsWith(
        'http://'
      ) ||
      normalized.startsWith(
        'https://'
      )
    ) {

      return normalized;
    }


    return `https://${normalized}`;
  }


  /* =======================================================
   * ENFOCAR ACTIVO
   * ======================================================= */

  focusAsset(
    asset:
      TourismAsset
  ): void {

    if (
      !this.map ||
      asset.latitud === null ||
      asset.longitud === null
    ) {

      return;
    }


    this.selectedAssetId =
      asset.id;


    this.changeDetectorRef
      .detectChanges();


    this.updateMarkerSelection();


    const marker =
      this.markerByAssetId.get(
        asset.id
      );


    this.map.flyTo(
      [
        Number(
          asset.latitud
        ),
        Number(
          asset.longitud
        )
      ],
      17,
      {

        animate:
          true,

        duration:
          0.7
      }
    );


    if (
      marker
    ) {

      window.setTimeout(
        () => {

          marker.openPopup();

        },
        350
      );
    }
  }


  /* =======================================================
   * TRACK BY
   * ======================================================= */

  trackByAssetId(
    _index:
      number,

    asset:
      TourismAsset
  ): number {

    return asset.id;
  }


  trackByCategory(
    _index:
      number,

    category:
      TourismCategoryOption
  ): TourismFilter {

    return category.value;
  }


  /* =======================================================
   * PROGRAMAR MAPA
   * ======================================================= */

  private scheduleMapInitialization():
    void {

    if (
      this.mapInitializationPending
    ) {

      return;
    }


    this.mapInitializationPending =
      true;


    window.requestAnimationFrame(
      () => {

        window.requestAnimationFrame(
          () => {

            this.mapInitializationPending =
              false;


            if (
              this.map
            ) {

              this.map.invalidateSize();


              this.refreshMapMarkers();


              return;
            }


            if (
              this.mapContainer
            ) {

              this.initializeMap(
                this.mapContainer
              );
            }
          }
        );
      }
    );
  }


  /* =======================================================
   * INICIALIZAR LEAFLET
   * ======================================================= */

  private initializeMap(
    container:
      HTMLDivElement
  ): void {

    if (
      this.map
    ) {

      return;
    }


    this.map =
      L.map(
        container,
        {

          center:
            this.tuluaCenter,

          zoom:
            13,

          zoomControl:
            true,

          attributionControl:
            true,

          preferCanvas:
            true
        }
      );


    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {

        minZoom:
          3,

        maxZoom:
          19,

        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(
      this.map
    );


    this.markersLayer =
      L.layerGroup()
        .addTo(
          this.map
        );


    this.refreshMapMarkers();


    window.setTimeout(
      () => {

        this.map?.invalidateSize();

      },
      150
    );
  }


  /* =======================================================
   * ACTUALIZAR MARCADORES
   * ======================================================= */

  private refreshMapMarkers():
    void {

    if (
      !this.map ||
      !this.markersLayer
    ) {

      return;
    }


    this.markersLayer
      .clearLayers();


    this.markerByAssetId
      .clear();


    for (
      const asset
      of this.mappedAssets
    ) {

      if (
        asset.latitud === null ||
        asset.longitud === null
      ) {

        continue;
      }


      const latitude =
        Number(
          asset.latitud
        );


      const longitude =
        Number(
          asset.longitud
        );


      if (
        !Number.isFinite(
          latitude
        ) ||
        !Number.isFinite(
          longitude
        )
      ) {

        continue;
      }


      const marker =
        L.marker(
          [
            latitude,
            longitude
          ],
          {

            icon:
              this.createMarkerIcon(
                asset
              ),

            title:
              asset.nombre
          }
        );


      marker.bindPopup(
        this.createPopupContent(
          asset
        ),
        {

          maxWidth:
            320,

          minWidth:
            230,

          closeButton:
            true
        }
      );


      marker.on(
        'click',
        () => {

          this.ngZone.run(
            () => {

              this.selectedAssetId =
                asset.id;


              this.changeDetectorRef
                .detectChanges();
            }
          );


          this.updateMarkerSelection();
        }
      );


      marker.addTo(
        this.markersLayer
      );


      this.markerByAssetId.set(
        asset.id,
        marker
      );
    }


    this.map.invalidateSize();


    this.fitMapToVisibleMarkers();


    this.updateMarkerSelection();
  }


  /* =======================================================
   * ICONO
   * ======================================================= */

  private createMarkerIcon(
    asset:
      TourismAsset
  ): L.DivIcon {

    const style =
      this.mapCategoryStyles[
        asset.categoria
      ];


    const opacity =
      asset.precision_ubicacion ===
      'APROXIMADA'
        ? '0.84'
        : '1';


    const html = `
      <div
        class="tourism-marker"
        style="
          --marker-color: ${style.color};
          opacity: ${opacity};
        "
      >
        <span></span>
      </div>
    `;


    return L.divIcon(
      {

        html,

        className:
          'tourism-marker-wrapper',

        iconSize: [
          36,
          36
        ],

        iconAnchor: [
          18,
          36
        ],

        popupAnchor: [
          0,
          -36
        ]
      }
    );
  }


  /* =======================================================
   * POPUP
   * ======================================================= */

  private createPopupContent(
    asset:
      TourismAsset
  ): string {

    const style =
      this.mapCategoryStyles[
        asset.categoria
      ];


    const website =
      this.getWebsiteUrl(
        asset.sitio_web
      );


    const subcategory =
      asset.subcategoria
        ? `
          <div class="tourism-popup-subcategory">
            ${this.escapeHtml(asset.subcategoria)}
          </div>
        `
        : '';


    const address =
      asset.direccion
        ? `
          <div class="tourism-popup-row">
            <strong>Dirección:</strong>
            ${this.escapeHtml(asset.direccion)}
          </div>
        `
        : '';


    const phone =
      asset.telefono
        ? `
          <div class="tourism-popup-row">
            <strong>Teléfono:</strong>
            ${this.escapeHtml(asset.telefono)}
          </div>
        `
        : '';


    const email =
      asset.correo
        ? `
          <div class="tourism-popup-row">
            <strong>Correo:</strong>
            ${this.escapeHtml(asset.correo)}
          </div>
        `
        : '';


    const websiteLink =
      website
        ? `
          <a
            class="tourism-popup-link"
            href="${this.escapeHtml(website)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visitar sitio web
          </a>
        `
        : '';


    return `
      <div class="tourism-popup">

        <span
          class="tourism-popup-category"
          style="
            color: ${style.color};
            background: ${style.color}18;
          "
        >
          ${this.escapeHtml(style.label)}
        </span>

        <strong class="tourism-popup-title">
          ${this.escapeHtml(asset.nombre)}
        </strong>

        ${subcategory}

        ${address}

        ${phone}

        ${email}

        <span class="tourism-popup-precision">
          ${this.escapeHtml(
            this.getPrecisionLabel(
              asset
            )
          )}
        </span>

        ${websiteLink}

      </div>
    `;
  }


  /* =======================================================
   * SELECCIÓN DE MARCADOR
   * ======================================================= */

  private updateMarkerSelection():
    void {

    for (
      const [
        assetId,
        marker
      ]
      of this.markerByAssetId
    ) {

      const element =
        marker.getElement();


      if (
        !element
      ) {

        continue;
      }


      element.classList.toggle(
        'tourism-marker-selected',
        assetId ===
          this.selectedAssetId
      );
    }
  }


  /* =======================================================
   * AJUSTAR VISTA
   * ======================================================= */

  private fitMapToVisibleMarkers():
    void {

    if (
      !this.map
    ) {

      return;
    }


    const coordinates:
      L.LatLng[] = [];


    for (
      const asset
      of this.mappedAssets
    ) {

      if (
        asset.latitud === null ||
        asset.longitud === null
      ) {

        continue;
      }


      const latitude =
        Number(
          asset.latitud
        );


      const longitude =
        Number(
          asset.longitud
        );


      if (
        Number.isFinite(
          latitude
        ) &&
        Number.isFinite(
          longitude
        )
      ) {

        coordinates.push(
          L.latLng(
            latitude,
            longitude
          )
        );
      }
    }


    if (
      coordinates.length === 0
    ) {

      this.map.setView(
        this.tuluaCenter,
        13
      );

      return;
    }


    if (
      coordinates.length === 1
    ) {

      this.map.setView(
        coordinates[0],
        16
      );

      return;
    }


    this.map.fitBounds(
      L.latLngBounds(
        coordinates
      ),
      {

        padding: [
          40,
          40
        ],

        maxZoom:
          16,

        animate:
          true
      }
    );
  }


  /* =======================================================
   * ESCAPAR HTML
   * ======================================================= */

  private escapeHtml(
    value:
      string
  ): string {

    return value
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );
  }


  /* =======================================================
   * DESTRUIR MAPA
   * ======================================================= */

  private destroyMap():
    void {

    if (
      this.map
    ) {

      this.map.remove();
    }


    this.map =
      null;


    this.mapContainer =
      null;


    this.markersLayer =
      null;


    this.markerByAssetId
      .clear();
  }


  /* =======================================================
   * RESUMEN VACÍO
   * ======================================================= */

  private createEmptySummary():
    TourismAssetsSummary {

    return {

      total:
        0,

      ubicados:
        0,

      sinUbicacion:
        0,

      exactos:
        0,

      aproximados:
        0,

      pendientes:
        0,

      porCategoria: {

        HOTEL:
          0,

        GASTRONOMIA:
          0,

        AGENCIA:
          0,

        CAFE:
          0,

        ARTESANIA_RECUERDO:
          0
      }
    };
  }
}
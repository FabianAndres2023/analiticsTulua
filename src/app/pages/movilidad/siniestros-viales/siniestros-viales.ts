import { CommonModule } from '@angular/common';

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  SupabaseService
} from '../../../core/services/supabase.service';

import {
  ComparativaAnual
} from './comparativa-anual/comparativa-anual';


/* =========================================================
 * INTERFACES
 * ========================================================= */

interface SiniestroVial {

  id: number;

  numero_caso: number | null;

  anio: number;

  fecha: string | null;

  hora: string | null;

  latitud:
    number |
    string |
    null;

  longitud:
    number |
    string |
    null;

  direccion_hecho:
    string |
    null;

  barrio_hecho:
    string |
    null;

  clase_accidente:
    string |
    null;

  gravedad_accidente:
    string |
    null;

  tipo_accidente:
    string |
    null;

  dia_semana:
    string |
    null;

  mes:
    number |
    null;

  numero_mes:
    number |
    null;
}


interface PersonaSiniestro {

  id: number;

  siniestro_id: number;

  tipo_actor:
    string |
    null;

  sexo:
    string |
    null;

  edad:
    number |
    null;

  gravedad:
    string |
    null;
}


interface VehiculoSiniestro {

  id: number;

  siniestro_id: number;

  clase_servicio:
    string |
    null;

  clase_vehiculo:
    string |
    null;

  modalidad_transporte:
    string |
    null;
}


interface DistribucionItem {

  nombre: string;

  cantidad: number;

  porcentaje: number;
}


interface KpisSiniestros {

  total: number;

  victimasFatales: number;

  personasInvolucradas: number;

  vehiculosInvolucrados: number;

  mesMasCritico: string;

  totalMesCritico: number;

  diaMasCritico: string;

  totalDiaCritico: number;
}


declare global {

  interface Window {
    L?: any;
  }
}


/* =========================================================
 * COMPONENTE
 * ========================================================= */

@Component({

  selector:
    'app-siniestros-viales',

  standalone:
    true,

  imports: [
    CommonModule,
    FormsModule,
    ComparativaAnual
  ],

  templateUrl:
    './siniestros-viales.html',

  styleUrl:
    './siniestros-viales.scss'
})

export class SiniestrosViales
  implements
    AfterViewInit,
    OnDestroy {


  /* =======================================================
   * SERVICIOS
   * ======================================================= */

  private readonly supabaseService =
    inject(
      SupabaseService
    );


  private readonly cdr =
    inject(
      ChangeDetectorRef
    );


  private get supabase() {

    return this
      .supabaseService
      .client;
  }


  /* =======================================================
   * ESTADO
   * ======================================================= */

  cargando =
    false;


  error =
    '';


  filtroAplicado =
    false;


  mapaListo =
    false;


  private vistaInicializada =
    false;


  /* =======================================================
   * FILTROS
   * ======================================================= */

  fechaInicio =
    '';


  fechaFin =
    '';


  /* =======================================================
   * DATOS CRUDOS
   * ======================================================= */

  siniestros:
    SiniestroVial[] = [];


  personas:
    PersonaSiniestro[] = [];


  vehiculos:
    VehiculoSiniestro[] = [];


  /* =======================================================
   * DISTRIBUCIONES
   * ======================================================= */

  distribucionMensual:
    DistribucionItem[] = [];


  distribucionDias:
    DistribucionItem[] = [];


  distribucionGravedad:
    DistribucionItem[] = [];


  distribucionClase:
    DistribucionItem[] = [];


  distribucionActores:
    DistribucionItem[] = [];


  distribucionSexo:
    DistribucionItem[] = [];


  distribucionEdad:
    DistribucionItem[] = [];


  distribucionVehiculos:
    DistribucionItem[] = [];


  distribucionDirecciones:
    DistribucionItem[] = [];


  /* =======================================================
   * KPI
   * ======================================================= */

  kpis:
    KpisSiniestros = {

      total:
        0,

      victimasFatales:
        0,

      personasInvolucradas:
        0,

      vehiculosInvolucrados:
        0,

      mesMasCritico:
        'Sin datos',

      totalMesCritico:
        0,

      diaMasCritico:
        'Sin datos',

      totalDiaCritico:
        0
    };


  /* =======================================================
   * MAPA
   * ======================================================= */

  private mapa:
    any = null;


  private capaMarcadores:
    any = null;


  /* =======================================================
   * PALETAS
   * ======================================================= */

  readonly coloresGravedad = [
    '#2d78b8',
    '#dc5260',
    '#22a06b',
    '#f59e0b',
    '#718096'
  ];


  readonly coloresSexo = [
    '#2d78b8',
    '#ef6e9b',
    '#7a8ca3',
    '#22a06b'
  ];


  readonly coloresActores = [
    '#071a52',
    '#2d78b8',
    '#f59e0b',
    '#22a06b',
    '#7a8ca3'
  ];


  readonly coloresVehiculos = [
    '#4d5fc1',
    '#2d78b8',
    '#22a06b',
    '#f59e0b',
    '#dc5260',
    '#7c6ee6',
    '#718096',
    '#13a0a5'
  ];


  /* =======================================================
   * CICLO DE VIDA
   * ======================================================= */

  ngAfterViewInit():
    void {

    this.vistaInicializada =
      true;

    void this
      .inicializarMapa();
  }


  ngOnDestroy():
    void {

    if (
      this.mapa
    ) {

      this.mapa
        .remove();

      this.mapa =
        null;
    }
  }


  /* =======================================================
   * APLICAR FILTROS
   * ======================================================= */

  async aplicarFiltros():
    Promise<void> {


    this.error =
      '';


    if (
      !this.fechaInicio ||
      !this.fechaFin
    ) {

      this.error =
        'Selecciona una fecha inicial y una fecha final para consultar la información.';

      return;
    }


    if (
      this.fechaInicio >
      this.fechaFin
    ) {

      this.error =
        'La fecha inicial no puede ser mayor que la fecha final.';

      return;
    }


    const anioInicial =
      Number(
        this.fechaInicio
          .substring(
            0,
            4
          )
      );


    const anioFinal =
      Number(
        this.fechaFin
          .substring(
            0,
            4
          )
      );


    if (
      anioInicial !== 2026 ||
      anioFinal !== 2026
    ) {

      this.error =
        'Este tablero corresponde al año 2026. Para otros años utilizaremos la comparativa anual.';

      return;
    }


    await this
      .cargarDashboard();
  }


  /* =======================================================
   * RESTABLECER
   * ======================================================= */

  restablecerFiltros():
    void {


    this.fechaInicio =
      '';


    this.fechaFin =
      '';


    this.error =
      '';


    this.filtroAplicado =
      false;


    this.limpiarDatos();


    this.actualizarMapa();
  }


  /* =======================================================
   * CARGAR DASHBOARD
   * ======================================================= */

  private async cargarDashboard():
    Promise<void> {


    if (
      this.cargando
    ) {
      return;
    }


    this.cargando =
      true;


    this.error =
      '';


    try {


      const {
        data,
        error
      } =
        await this.supabase
          .from(
            'siniestros_viales'
          )
          .select(`
            id,
            numero_caso,
            anio,
            fecha,
            hora,
            latitud,
            longitud,
            direccion_hecho,
            barrio_hecho,
            clase_accidente,
            gravedad_accidente,
            tipo_accidente,
            dia_semana,
            mes,
            numero_mes
          `)
          .eq(
            'anio',
            2026
          )
          .gte(
            'fecha',
            this.fechaInicio
          )
          .lte(
            'fecha',
            this.fechaFin
          )
          .order(
            'fecha',
            {
              ascending:
                true
            }
          );


      if (
        error
      ) {

        throw error;
      }


      this.siniestros =
        (
          data ??
          []
        ) as SiniestroVial[];


      await this
        .cargarDatosRelacionados();


      this
        .calcularEstadisticas();


      this.filtroAplicado =
        true;


    } catch (
      error
    ) {


      console.error(
        'Error cargando dashboard:',
        error
      );


      this.error =
        error instanceof Error
          ? error.message
          : 'No fue posible cargar la información de siniestros viales.';


      this
        .limpiarDatos();


    } finally {


      this.cargando =
        false;


      this.cdr
        .detectChanges();


      if (
        this.vistaInicializada
      ) {

        await this
          .inicializarMapa();

        this
          .actualizarMapa();
      }
    }
  }


  /* =======================================================
   * DATOS RELACIONADOS
   * ======================================================= */

  private async cargarDatosRelacionados():
    Promise<void> {


    const ids =
      this.siniestros
        .map(
          siniestro =>
            siniestro.id
        );


    if (
      ids.length === 0
    ) {

      this.personas =
        [];


      this.vehiculos =
        [];


      return;
    }


    const [
      personasResponse,
      vehiculosResponse
    ] =
      await Promise.all([


        this.supabase
          .from(
            'siniestros_personas'
          )
          .select(`
            id,
            siniestro_id,
            tipo_actor,
            sexo,
            edad,
            gravedad
          `)
          .in(
            'siniestro_id',
            ids
          ),


        this.supabase
          .from(
            'siniestros_vehiculos'
          )
          .select(`
            id,
            siniestro_id,
            clase_servicio,
            clase_vehiculo,
            modalidad_transporte
          `)
          .in(
            'siniestro_id',
            ids
          )

      ]);


    if (
      personasResponse.error
    ) {

      throw personasResponse.error;
    }


    if (
      vehiculosResponse.error
    ) {

      throw vehiculosResponse.error;
    }


    this.personas =
      (
        personasResponse.data ??
        []
      ) as PersonaSiniestro[];


    this.vehiculos =
      (
        vehiculosResponse.data ??
        []
      ) as VehiculoSiniestro[];
  }


  /* =======================================================
   * CALCULAR ESTADÍSTICAS
   * ======================================================= */

  private calcularEstadisticas():
    void {


    this.kpis.total =
      this.siniestros.length;


    this.kpis.personasInvolucradas =
      this.personas.length;


    this.kpis.vehiculosInvolucrados =
      this.vehiculos.length;


    this.kpis.victimasFatales =
      this.personas
        .filter(
          persona => {

            const gravedad =
              this.normalizarTexto(
                persona.gravedad
              );


            return (
              gravedad.includes(
                'MUERTO'
              ) ||
              gravedad.includes(
                'FALLEC'
              )
            );
          }
        )
        .length;


    /* =====================================================
     * MESES
     * ===================================================== */

    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];


    this.distribucionMensual =
      meses
        .map(
          (
            mes,
            indice
          ) => {


            const cantidad =
              this.siniestros
                .filter(
                  siniestro =>
                    this.obtenerNumeroMes(
                      siniestro
                    ) ===
                    indice + 1
                )
                .length;


            return {

              nombre:
                mes,

              cantidad,

              porcentaje:
                0
            };
          }
        )
        .filter(
          item =>
            item.cantidad >
            0
        );


    this
      .aplicarPorcentajes(
        this.distribucionMensual
      );


    const mesMasCritico =
      this.obtenerMayor(
        this.distribucionMensual
      );


    this.kpis.mesMasCritico =
      mesMasCritico?.nombre ??
      'Sin datos';


    this.kpis.totalMesCritico =
      mesMasCritico?.cantidad ??
      0;


    /* =====================================================
     * DÍAS
     * ===================================================== */

    const dias = [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo'
    ];


    this.distribucionDias =
      dias.map(
        dia => {


          const cantidad =
            this.siniestros
              .filter(
                siniestro =>
                  this.obtenerDiaSemana(
                    siniestro.fecha
                  ) ===
                  dia
              )
              .length;


          return {

            nombre:
              dia,

            cantidad,

            porcentaje:
              0
          };
        }
      );


    this
      .aplicarPorcentajes(
        this.distribucionDias
      );


    const diaMasCritico =
      this.obtenerMayor(
        this.distribucionDias
      );


    this.kpis.diaMasCritico =
      diaMasCritico?.nombre ??
      'Sin datos';


    this.kpis.totalDiaCritico =
      diaMasCritico?.cantidad ??
      0;


    /* =====================================================
     * DIRECCIONES
     * ===================================================== */

    this.distribucionDirecciones =
      this.agruparValores(
        this.siniestros
          .map(
            siniestro =>
              this.formatearDireccion(
                siniestro.direccion_hecho
              )
          )
          .filter(
            direccion =>
              direccion !==
              'Sin dirección'
          )
      );


    /* =====================================================
     * GRAVEDAD
     * ===================================================== */

    this.distribucionGravedad =
      this.agruparValores(
        this.siniestros.map(
          siniestro =>
            this.formatearTexto(
              siniestro.gravedad_accidente,
              'Sin dato'
            )
        )
      );


    /* =====================================================
     * CLASE
     * ===================================================== */

    this.distribucionClase =
      this.agruparValores(
        this.siniestros.map(
          siniestro =>
            this.formatearTexto(
              siniestro.clase_accidente,
              'Sin dato'
            )
        )
      );


    /* =====================================================
     * ACTORES
     * ===================================================== */

    this.distribucionActores =
      this.agruparValores(
        this.personas.map(
          persona =>
            this.nombreActor(
              persona.tipo_actor
            )
        )
      );


    /* =====================================================
     * SEXO
     * ===================================================== */

    this.distribucionSexo =
      this.agruparValores(
        this.personas.map(
          persona =>
            this.nombreSexo(
              persona.sexo
            )
        )
      );


    /* =====================================================
     * EDAD
     * ===================================================== */

    this.distribucionEdad =
      this.agruparValores(
        this.personas.map(
          persona =>
            this.rangoEdad(
              persona.edad
            )
        )
      );


    /* =====================================================
     * VEHÍCULOS
     * ===================================================== */

    this.distribucionVehiculos =
      this.agruparValores(
        this.vehiculos.map(
          vehiculo =>
            this.formatearTexto(
              vehiculo.clase_vehiculo,
              'Sin clasificar'
            )
        )
      );
  }


  /* =======================================================
   * DIRECCIONES - PRESENTACIÓN
   * ======================================================= */

  get direccionesPrincipales():
    DistribucionItem[] {

    return this.distribucionDirecciones
      .slice(
        0,
        10
      );
  }


  get direccionPrincipal():
    DistribucionItem |
    null {

    return (
      this.distribucionDirecciones[0] ??
      null
    );
  }


  get totalDireccionesIdentificadas():
    number {

    return this.distribucionDirecciones
      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.cantidad,
        0
      );
  }


  get cantidadDireccionesUnicas():
    number {

    return this.distribucionDirecciones
      .length;
  }


  get siniestrosSinDireccion():
    number {

    return this.siniestros
      .filter(
        siniestro =>
          !String(
            siniestro.direccion_hecho ??
            ''
          )
            .trim()
      )
      .length;
  }


  /* =======================================================
   * VEHÍCULOS - PRESENTACIÓN
   * ======================================================= */

  get vehiculosPrincipales():
    DistribucionItem[] {

    return this.distribucionVehiculos
      .slice(
        0,
        6
      );
  }


  get vehiculosOtrosCantidad():
    number {

    return this.distribucionVehiculos
      .slice(
        6
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.cantidad,
        0
      );
  }


  get vehiculosOtrosPorcentaje():
    number {

    if (
      this.kpis.vehiculosInvolucrados ===
      0
    ) {

      return 0;
    }


    return (
      this.vehiculosOtrosCantidad /
      this.kpis.vehiculosInvolucrados
    ) *
    100;
  }


  get vehiculoPrincipal():
    DistribucionItem |
    null {

    return (
      this.distribucionVehiculos[0] ??
      null
    );
  }


  esTipoVehiculo(
    nombre:
      string,
    tipo:
      string
  ):
    boolean {

    const nombreNormalizado =
      this.normalizarTexto(
        nombre
      );


    const tipoNormalizado =
      this.normalizarTexto(
        tipo
      );


    return nombreNormalizado
      .includes(
        tipoNormalizado
      );
  }


  /* =======================================================
   * LIMPIAR DASHBOARD
   * ======================================================= */

  private limpiarDatos():
    void {


    this.siniestros =
      [];


    this.personas =
      [];


    this.vehiculos =
      [];


    this.distribucionMensual =
      [];


    this.distribucionDias =
      [];


    this.distribucionGravedad =
      [];


    this.distribucionClase =
      [];


    this.distribucionActores =
      [];


    this.distribucionSexo =
      [];


    this.distribucionEdad =
      [];


    this.distribucionVehiculos =
      [];


    this.distribucionDirecciones =
      [];


    this.kpis = {

      total:
        0,

      victimasFatales:
        0,

      personasInvolucradas:
        0,

      vehiculosInvolucrados:
        0,

      mesMasCritico:
        'Sin datos',

      totalMesCritico:
        0,

      diaMasCritico:
        'Sin datos',

      totalDiaCritico:
        0
    };
  }


  /* =======================================================
   * NAVEGACIÓN
   * ======================================================= */

  scrollToSection(
    id:
      string
  ):
    void {


    document
      .getElementById(
        id
      )
      ?.scrollIntoView(
        {

          behavior:
            'smooth',

          block:
            'start'
        }
      );
  }


  /* =======================================================
   * TOOLTIP
   * ======================================================= */

  tooltipCantidad(
    item:
      DistribucionItem,
    descripcion:
      string
  ):
    string {


    return (
      `${item.nombre}: ` +
      `${item.cantidad} ${descripcion} ` +
      `(${item.porcentaje.toFixed(1)}%)`
    );
  }


  /* =======================================================
   * MAPA
   * ======================================================= */

  private async inicializarMapa():
    Promise<void> {


    if (
      !this.vistaInicializada
    ) {
      return;
    }


    try {


      await this
        .cargarLeaflet();


      const L =
        window.L;


      if (
        !L
      ) {
        return;
      }


      if (
        this.mapa
      ) {

        this
          .actualizarMapa();

        return;
      }


      const contenedor =
        document.getElementById(
          'siniestros-map'
        );


      if (
        !contenedor
      ) {
        return;
      }


      this.mapa =
        L.map(
          contenedor,
          {

            zoomControl:
              true,

            attributionControl:
              true
          }
        )
        .setView(
          [
            4.0847,
            -76.1954
          ],
          13
        );


      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {

          maxZoom:
            19,

          attribution:
            '&copy; OpenStreetMap'
        }
      )
        .addTo(
          this.mapa
        );


      this.capaMarcadores =
        L
          .layerGroup()
          .addTo(
            this.mapa
          );


      this.mapaListo =
        true;


      this
        .actualizarMapa();


      setTimeout(
        () =>
          this.mapa
            ?.invalidateSize(),
        150
      );


    } catch (
      error
    ) {


      console.error(
        'No fue posible inicializar Leaflet:',
        error
      );
    }
  }


  private actualizarMapa():
    void {


    const L =
      window.L;


    if (
      !L ||
      !this.mapa ||
      !this.capaMarcadores
    ) {
      return;
    }


    this.capaMarcadores
      .clearLayers();


    const puntos:
      [number, number][] = [];


    this.siniestros
      .forEach(
        siniestro => {


          const latitud =
            Number(
              siniestro.latitud
            );


          const longitud =
            Number(
              siniestro.longitud
            );


          if (
            !Number.isFinite(
              latitud
            ) ||
            !Number.isFinite(
              longitud
            )
          ) {
            return;
          }


          puntos.push(
            [
              latitud,
              longitud
            ]
          );


          const gravedad =
            this.normalizarTexto(
              siniestro.gravedad_accidente
            );


          let color =
            '#2d78b8';


          if (
            gravedad.includes(
              'MUERTO'
            )
          ) {

            color =
              '#dc5260';

          } else if (
            gravedad.includes(
              'DANO'
            )
          ) {

            color =
              '#22a06b';
          }


          const marcador =
            L.circleMarker(
              [
                latitud,
                longitud
              ],
              {

                radius:
                  7,

                color:
                  '#ffffff',

                weight:
                  2,

                fillColor:
                  color,

                fillOpacity:
                  0.9
              }
            );


          const contenido =
            `
              <div
                style="
                  min-width:220px;
                  font-family:Arial,sans-serif;
                "
              >

                <strong
                  style="
                    display:block;
                    color:#071a52;
                    font-size:14px;
                    margin-bottom:8px;
                  "
                >
                  Siniestro
                  #${this.escapeHtml(
                    String(
                      siniestro.numero_caso ??
                      '—'
                    )
                  )}
                </strong>

                <div
                  style="
                    color:#526174;
                    font-size:12px;
                    line-height:1.7;
                  "
                >

                  <b>Fecha:</b>
                  ${this.escapeHtml(
                    this.formatearFechaVisible(
                      siniestro.fecha
                    )
                  )}

                  <br>

                  <b>Gravedad:</b>
                  ${this.escapeHtml(
                    this.formatearTexto(
                      siniestro.gravedad_accidente,
                      'Sin dato'
                    )
                  )}

                  <br>

                  <b>Clase:</b>
                  ${this.escapeHtml(
                    this.formatearTexto(
                      siniestro.clase_accidente,
                      'Sin dato'
                    )
                  )}

                  <br>

                  <b>Dirección:</b>
                  ${this.escapeHtml(
                    siniestro.direccion_hecho ??
                    'Sin información'
                  )}

                </div>

              </div>
            `;


          marcador
            .bindPopup(
              contenido
            );


          marcador
            .bindTooltip(
              `Caso ${
                siniestro.numero_caso ??
                '—'
              }`,
              {

                direction:
                  'top',

                offset:
                  [
                    0,
                    -5
                  ]
              }
            );


          marcador
            .addTo(
              this.capaMarcadores
            );
        }
      );


    if (
      puntos.length >
      0
    ) {


      const bounds =
        L.latLngBounds(
          puntos
        );


      this.mapa
        .fitBounds(
          bounds,
          {

            padding:
              [
                30,
                30
              ],

            maxZoom:
              15
          }
        );


    } else {


      this.mapa
        .setView(
          [
            4.0847,
            -76.1954
          ],
          13
        );
    }


    setTimeout(
      () =>
        this.mapa
          ?.invalidateSize(),
      100
    );
  }


  private cargarLeaflet():
    Promise<void> {


    return new Promise(
      (
        resolve,
        reject
      ) => {


        if (
          window.L
        ) {

          resolve();

          return;
        }


        const cssId =
          'leaflet-dashboard-css';


        if (
          !document
            .getElementById(
              cssId
            )
        ) {


          const link =
            document
              .createElement(
                'link'
              );


          link.id =
            cssId;


          link.rel =
            'stylesheet';


          link.href =
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';


          document.head
            .appendChild(
              link
            );
        }


        const scriptId =
          'leaflet-dashboard-js';


        const existente =
          document
            .getElementById(
              scriptId
            ) as
              HTMLScriptElement |
              null;


        if (
          existente
        ) {


          if (
            window.L
          ) {

            resolve();

          } else {

            existente
              .addEventListener(
                'load',
                () =>
                  resolve(),
                {

                  once:
                    true
                }
              );
          }


          return;
        }


        const script =
          document
            .createElement(
              'script'
            );


        script.id =
          scriptId;


        script.src =
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';


        script.async =
          true;


        script.onload =
          () =>
            resolve();


        script.onerror =
          () =>
            reject(
              new Error(
                'No fue posible cargar Leaflet.'
              )
            );


        document.body
          .appendChild(
            script
          );
      }
    );
  }


  /* =======================================================
   * DONUT
   * ======================================================= */

  obtenerDonut(
    items:
      DistribucionItem[],
    colores:
      string[]
  ):
    string {


    if (
      items.length ===
      0
    ) {

      return (
        '#edf2f7 0deg 360deg'
      );
    }


    const total =
      items.reduce(
        (
          acumulado,
          item
        ) =>
          acumulado +
          item.cantidad,
        0
      );


    if (
      total ===
      0
    ) {

      return (
        '#edf2f7 0deg 360deg'
      );
    }


    let actual =
      0;


    const segmentos:
      string[] = [];


    items.forEach(
      (
        item,
        indice
      ) => {


        const grados =
          (
            item.cantidad /
            total
          ) *
          360;


        const inicio =
          actual;


        const fin =
          actual +
          grados;


        segmentos.push(
          `${
            colores[
              indice %
              colores.length
            ]
          } ${inicio}deg ${fin}deg`
        );


        actual =
          fin;
      }
    );


    return segmentos
      .join(
        ', '
      );
  }


  colorItem(
    indice:
      number,
    colores:
      string[]
  ):
    string {


    return colores[
      indice %
      colores.length
    ];
  }


  /* =======================================================
   * GRÁFICAS
   * ======================================================= */

  maxCantidad(
    items:
      DistribucionItem[]
  ):
    number {


    if (
      items.length ===
      0
    ) {
      return 1;
    }


    return Math.max(
      ...items.map(
        item =>
          item.cantidad
      ),
      1
    );
  }


  alturaBarra(
    cantidad:
      number,
    items:
      DistribucionItem[]
  ):
    number {


    const maximo =
      this.maxCantidad(
        items
      );


    if (
      cantidad ===
      0
    ) {
      return 0;
    }


    return Math.max(
      (
        cantidad /
        maximo
      ) *
      100,
      5
    );
  }


  anchoBarra(
    cantidad:
      number,
    items:
      DistribucionItem[]
  ):
    number {


    const maximo =
      this.maxCantidad(
        items
      );


    return (
      cantidad /
      maximo
    ) *
    100;
  }


  /* =======================================================
   * AGRUPACIONES
   * ======================================================= */

  private agruparValores(
    valores:
      string[]
  ):
    DistribucionItem[] {


    const mapa =
      new Map<
        string,
        number
      >();


    valores
      .forEach(
        valor => {


          mapa.set(
            valor,
            (
              mapa.get(
                valor
              ) ??
              0
            ) +
            1
          );
        }
      );


    const resultado =
      Array
        .from(
          mapa.entries()
        )
        .map(
          (
            [
              nombre,
              cantidad
            ]
          ) => ({

            nombre,

            cantidad,

            porcentaje:
              0
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.cantidad -
            a.cantidad
        );


    this
      .aplicarPorcentajes(
        resultado
      );


    return resultado;
  }


  private aplicarPorcentajes(
    items:
      DistribucionItem[]
  ):
    void {


    const total =
      items.reduce(
        (
          acumulado,
          item
        ) =>
          acumulado +
          item.cantidad,
        0
      );


    items.forEach(
      item => {


        item.porcentaje =
          total >
          0

            ? (
                item.cantidad /
                total
              ) *
              100

            : 0;
      }
    );
  }


  private obtenerMayor(
    items:
      DistribucionItem[]
  ):
    DistribucionItem |
    null {


    if (
      items.length ===
      0
    ) {
      return null;
    }


    return [
      ...items
    ]
      .sort(
        (
          a,
          b
        ) =>
          b.cantidad -
          a.cantidad
      )[0];
  }


  /* =======================================================
   * FECHAS
   * ======================================================= */

  private obtenerNumeroMes(
    siniestro:
      SiniestroVial
  ):
    number |
    null {


    if (
      siniestro.fecha
    ) {


      const partes =
        siniestro.fecha
          .split(
            '-'
          );


      const mes =
        Number(
          partes[1]
        );


      if (
        Number.isFinite(
          mes
        )
      ) {

        return mes;
      }
    }


    return (
      siniestro.numero_mes ??
      siniestro.mes ??
      null
    );
  }


  private obtenerDiaSemana(
    fecha:
      string |
      null
  ):
    string {


    if (
      !fecha
    ) {
      return 'Sin dato';
    }


    const partes =
      fecha
        .split(
          '-'
        )
        .map(
          valor =>
            Number(
              valor
            )
        );


    if (
      partes.length !==
      3
    ) {
      return 'Sin dato';
    }


    const [
      anio,
      mes,
      dia
    ] =
      partes;


    const fechaLocal =
      new Date(
        anio,
        mes - 1,
        dia,
        12,
        0,
        0
      );


    const dias = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado'
    ];


    return dias[
      fechaLocal
        .getDay()
    ];
  }


  private formatearFechaVisible(
    fecha:
      string |
      null
  ):
    string {


    if (
      !fecha
    ) {
      return 'Sin fecha';
    }


    const [
      anio,
      mes,
      dia
    ] =
      fecha.split(
        '-'
      );


    return `${dia}/${mes}/${anio}`;
  }


  /* =======================================================
   * DIRECCIONES
   * ======================================================= */

  private formatearDireccion(
    valor:
      string |
      null
  ):
    string {


    let direccion =
      String(
        valor ??
        ''
      )
        .trim();


    if (
      !direccion
    ) {

      return 'Sin dirección';
    }


    direccion =
      direccion
        .normalize(
          'NFD'
        )
        .replace(
          /[\u0300-\u036f]/g,
          ''
        )
        .toUpperCase()
        .replace(
          /\./g,
          ' '
        )
        .replace(
          /,/g,
          ' '
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim();


    direccion =
      direccion
        .replace(
          /\bCRA\b/g,
          'CARRERA'
        )
        .replace(
          /\bCR\b/g,
          'CARRERA'
        )
        .replace(
          /\bKR\b/g,
          'CARRERA'
        )
        .replace(
          /\bKRA\b/g,
          'CARRERA'
        )
        .replace(
          /\bCL\b/g,
          'CALLE'
        )
        .replace(
          /\bCLL\b/g,
          'CALLE'
        )
        .replace(
          /\bAV\b/g,
          'AVENIDA'
        )
        .replace(
          /\bAVDA\b/g,
          'AVENIDA'
        )
        .replace(
          /\bDG\b/g,
          'DIAGONAL'
        )
        .replace(
          /\bDIAG\b/g,
          'DIAGONAL'
        )
        .replace(
          /\bTV\b/g,
          'TRANSVERSAL'
        )
        .replace(
          /\bTRANSV\b/g,
          'TRANSVERSAL'
        );


    direccion =
      direccion
        .replace(
          /\b(?:NO|NRO|NUMERO)\s*\.?\s*/g,
          '# '
        )
        .replace(
          /\s*#\s*/g,
          ' # '
        )
        .replace(
          /\s*-\s*/g,
          '-'
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim();


    return direccion
      .toLowerCase()
      .replace(
        /\b\w/g,
        letra =>
          letra.toUpperCase()
      );
  }


  /* =======================================================
   * PERSONAS
   * ======================================================= */

  private nombreActor(
    valor:
      string |
      null
  ):
    string {


    const actor =
      this.normalizarTexto(
        valor
      );


    if (
      actor ===
      'CONDUCTOR'
    ) {
      return 'Conductores';
    }


    if (
      actor ===
      'ACOMPANANTE'
    ) {
      return 'Acompañantes';
    }


    if (
      actor ===
      'PEATON'
    ) {
      return 'Peatones';
    }


    if (
      !actor
    ) {
      return 'Sin dato';
    }


    return this
      .formatearTexto(
        valor,
        'Otros'
      );
  }


  private nombreSexo(
    valor:
      string |
      null
  ):
    string {


    const sexo =
      this.normalizarTexto(
        valor
      );


    if (
      sexo ===
        'M' ||
      sexo ===
        'MASCULINO' ||
      sexo ===
        'HOMBRE'
    ) {

      return 'Masculino';
    }


    if (
      sexo ===
        'F' ||
      sexo ===
        'FEMENINO' ||
      sexo ===
        'MUJER'
    ) {

      return 'Femenino';
    }


    return 'Sin dato';
  }


  private rangoEdad(
    edad:
      number |
      null
  ):
    string {


    const numero =
      Number(
        edad
      );


    if (
      !Number.isFinite(
        numero
      ) ||
      numero <
      0
    ) {

      return 'Sin dato';
    }


    if (
      numero <=
      17
    ) {
      return '0 – 17';
    }


    if (
      numero <=
      25
    ) {
      return '18 – 25';
    }


    if (
      numero <=
      35
    ) {
      return '26 – 35';
    }


    if (
      numero <=
      45
    ) {
      return '36 – 45';
    }


    if (
      numero <=
      60
    ) {
      return '46 – 60';
    }


    return '61+';
  }


  /* =======================================================
   * TEXTO
   * ======================================================= */

  private normalizarTexto(
    valor:
      unknown
  ):
    string {


    return String(
      valor ??
      ''
    )
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .trim()
      .toUpperCase();
  }


  private formatearTexto(
    valor:
      string |
      null,
    defecto:
      string
  ):
    string {


    const texto =
      String(
        valor ??
        ''
      )
        .trim();


    if (
      !texto
    ) {

      return defecto;
    }


    return texto
      .toLowerCase()
      .replace(
        /\b\w/g,
        letra =>
          letra.toUpperCase()
      );
  }


  private escapeHtml(
    valor:
      string
  ):
    string {


    return valor
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
}
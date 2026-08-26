import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  SupabaseService
} from '../../../../core/services/supabase.service';


/* ============================================================
 * TIPOS
 * ============================================================ */

type MetricaComparativa =
  | 'cantidad_siniestros'
  | 'personas_fallecidas'
  | 'accidentes_con_lesionados';


type IconoComparacion =
  | 'siniestros'
  | 'fallecidos'
  | 'lesionados';


/* ============================================================
 * INTERFACES
 * ============================================================ */

interface ComparativaMensual {

  anio: number;

  mes: number;

  cantidad_siniestros: number;

  personas_fallecidas: number;

  accidentes_con_lesionados: number;

  solo_danos: number;

  fuente: string;
}


interface MesComparado {

  mes: number;

  nombre: string;

  abreviatura: string;

  valorBase: number;

  valorComparado: number;

  variacion: number | null;

  alturaBase: number;

  alturaComparado: number;
}


interface ResumenComparacion {

  metrica:
    MetricaComparativa;

  titulo:
    string;

  subtitulo:
    string;

  descripcion:
    string;

  icono:
    IconoComparacion;

  valorBase:
    number;

  valorComparado:
    number;

  diferencia:
    number;

  variacion:
    number | null;

  maximo:
    number;

  meses:
    MesComparado[];
}


interface TooltipComparativa {

  visible: boolean;

  x: number;

  y: number;

  titulo: string;

  valor: string;

  detalle: string;
}


/* ============================================================
 * COMPONENTE
 * ============================================================ */

@Component({

  selector:
    'app-comparativa-anual',

  standalone:
    true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './comparativa-anual.html',

  styleUrl:
    './comparativa-anual.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})

export class ComparativaAnual
implements OnInit {


  /* ==========================================================
   * SERVICIOS
   * ========================================================== */

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


  /* ==========================================================
   * ESTADO
   * ========================================================== */

  loading =
    false;


  error =
    '';


  comparacionAplicada =
    false;


  /* ==========================================================
   * DATOS
   * ========================================================== */

  comparativaMensual:
    ComparativaMensual[] = [];


  /* ==========================================================
   * FILTROS VISIBLES
   * ========================================================== */

  anioBaseSeleccionado:
    number | null = null;


  anioComparadoSeleccionado:
    number | null = null;


  mesDesdeSeleccionado:
    number | null = null;


  mesHastaSeleccionado:
    number | null = null;


  /* ==========================================================
   * FILTROS APLICADOS
   * ========================================================== */

  anioBase:
    number | null = null;


  anioComparado:
    number | null = null;


  mesDesde:
    number | null = null;


  mesHasta:
    number | null = null;


  /* ==========================================================
   * TOOLTIP
   * ========================================================== */

  tooltip:
    TooltipComparativa = {

      visible:
        false,

      x:
        0,

      y:
        0,

      titulo:
        '',

      valor:
        '',

      detalle:
        ''
    };


  /* ==========================================================
   * MESES
   * ========================================================== */

  readonly mesesCompletos:
    string[] = [

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


  readonly mesesAbreviados:
    string[] = [

      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ];


  /* ==========================================================
   * COLORES
   * ========================================================== */

  readonly colorBase =
    '#173b7a';


  readonly colorComparado =
    '#2d78b8';


  /* ==========================================================
   * CICLO DE VIDA
   * ========================================================== */

  ngOnInit():
    void {

    void this
      .cargarComparativa();
  }


  /* ==========================================================
   * CARGA
   * ========================================================== */

  async cargarComparativa():
    Promise<void> {


    if (
      this.loading
    ) {

      return;
    }


    this.loading =
      true;


    this.error =
      '';


    this.cdr
      .markForCheck();


    try {


      const {
        data,
        error
      } =
        await this.supabase
          .rpc(
            'obtener_comparativa_anual'
          );


      if (
        error
      ) {

        throw new Error(
          error.message
        );
      }


      const registros:
        Record<string, unknown>[] =
        Array.isArray(
          data
        )
          ? data as Record<string, unknown>[]
          : [];


      this.comparativaMensual =
        registros

          .map(
            (
              item:
                Record<string, unknown>
            ):
              ComparativaMensual => ({

              anio:
                Number(
                  item['anio'] ??
                  0
                ),

              mes:
                Number(
                  item['mes'] ??
                  0
                ),

              cantidad_siniestros:
                Number(
                  item[
                    'cantidad_siniestros'
                  ] ??
                  0
                ),

              personas_fallecidas:
                Number(
                  item[
                    'personas_fallecidas'
                  ] ??
                  0
                ),

              accidentes_con_lesionados:
                Number(
                  item[
                    'accidentes_con_lesionados'
                  ] ??
                  0
                ),

              solo_danos:
                Number(
                  item[
                    'solo_danos'
                  ] ??
                  0
                ),

              fuente:
                String(
                  item['fuente'] ??
                  ''
                )
            })
          )

          .filter(
            (
              item:
                ComparativaMensual
            ) =>
              item.anio >
                0 &&
              item.mes >=
                1 &&
              item.mes <=
                12
          )

          .sort(
            (
              a:
                ComparativaMensual,

              b:
                ComparativaMensual
            ) => {

              if (
                a.anio !==
                b.anio
              ) {

                return (
                  a.anio -
                  b.anio
                );
              }


              return (
                a.mes -
                b.mes
              );
            }
          );


      this
        .inicializarFiltros();


    } catch (
      error
    ) {


      console.error(
        'Error cargando comparativa anual:',
        error
      );


      this.error =
        error instanceof Error
          ? error.message
          : 'No fue posible cargar la comparativa anual.';


      this.comparativaMensual =
        [];


      this.comparacionAplicada =
        false;


    } finally {


      this.loading =
        false;


      this.cdr
        .markForCheck();
    }
  }


  /* ==========================================================
   * AÑOS
   * ========================================================== */

  get aniosDisponibles():
    number[] {


    return [
      ...new Set(
        this.comparativaMensual
          .map(
            (
              item:
                ComparativaMensual
            ) =>
              item.anio
          )
      )
    ]
      .sort(
        (
          a:
            number,

          b:
            number
        ) =>
          b -
          a
      );
  }


  /* ==========================================================
   * INICIALIZAR FILTROS
   * ========================================================== */

  private inicializarFiltros():
    void {


    this.anioBaseSeleccionado =
      null;


    this.anioComparadoSeleccionado =
      null;


    this.mesDesdeSeleccionado =
      null;


    this.mesHastaSeleccionado =
      null;


    this.anioBase =
      null;


    this.anioComparado =
      null;


    this.mesDesde =
      null;


    this.mesHasta =
      null;


    this.comparacionAplicada =
      false;


    this.error =
      '';


    this.ocultarTooltip();


    this.cdr
      .markForCheck();
  }


  /* ==========================================================
   * CAMBIO DE FILTROS
   * ========================================================== */

  onCambioFiltro():
    void {


    this.error =
      '';


    /*
     * Los selectores solamente preparan
     * la comparación.
     *
     * No modifican los filtros aplicados.
     */


    if (
      this.anioBaseSeleccionado ===
        null ||
      this.anioComparadoSeleccionado ===
        null
    ) {


      this.mesDesdeSeleccionado =
        null;


      this.mesHastaSeleccionado =
        null;


      this.cdr
        .markForCheck();


      return;
    }


    if (
      this.anioBaseSeleccionado ===
      this.anioComparadoSeleccionado
    ) {


      this.mesDesdeSeleccionado =
        null;


      this.mesHastaSeleccionado =
        null;


      this.error =
        'Selecciona dos años diferentes.';


      this.cdr
        .markForCheck();


      return;
    }


    /*
     * Al cambiar los años obligamos al
     * usuario a elegir nuevamente los meses.
     */

    this.mesDesdeSeleccionado =
      null;


    this.mesHastaSeleccionado =
      null;


    this.ocultarTooltip();


    this.cdr
      .markForCheck();
  }


  /* ==========================================================
   * APLICAR
   * ========================================================== */

  aplicarComparacion():
    void {


    this.error =
      '';


    if (
      this.anioBaseSeleccionado ===
        null ||
      this.anioComparadoSeleccionado ===
        null
    ) {


      this.error =
        'Selecciona los dos años que deseas comparar.';


      this.cdr
        .markForCheck();


      return;
    }


    if (
      this.anioBaseSeleccionado ===
      this.anioComparadoSeleccionado
    ) {


      this.error =
        'Los años seleccionados deben ser diferentes.';


      this.cdr
        .markForCheck();


      return;
    }


    if (
      this.mesDesdeSeleccionado ===
        null ||
      this.mesHastaSeleccionado ===
        null
    ) {


      this.error =
        'Selecciona el mes inicial y el mes final.';


      this.cdr
        .markForCheck();


      return;
    }


    if (
      this.mesDesdeSeleccionado >
      this.mesHastaSeleccionado
    ) {


      this.error =
        'El mes inicial no puede ser posterior al mes final.';


      this.cdr
        .markForCheck();


      return;
    }


    const ultimoMesComun =
      this.obtenerUltimoMesComun(
        this.anioBaseSeleccionado,
        this.anioComparadoSeleccionado
      );


    if (
      ultimoMesComun <=
      0
    ) {


      this.error =
        'No existe información comparable entre los años seleccionados.';


      this.cdr
        .markForCheck();


      return;
    }


    if (
      this.mesHastaSeleccionado >
      ultimoMesComun
    ) {


      this.error =
        (
          'El período seleccionado supera la información disponible. ' +
          `Para estos años solamente existe información comparable hasta ${
            this.nombreMes(
              ultimoMesComun
            )
          }.`
        );


      this.cdr
        .markForCheck();


      return;
    }


    this.anioBase =
      this.anioBaseSeleccionado;


    this.anioComparado =
      this.anioComparadoSeleccionado;


    this.mesDesde =
      this.mesDesdeSeleccionado;


    this.mesHasta =
      this.mesHastaSeleccionado;


    this.comparacionAplicada =
      true;


    this.ocultarTooltip();


    this.cdr
      .markForCheck();
  }


  /* ==========================================================
   * RESTABLECER
   * ========================================================== */

  restablecerFiltros():
    void {


    this.inicializarFiltros();
  }


  /* ==========================================================
   * ÚLTIMO MES
   * ========================================================== */

  private ultimoMesAnio(
    anio:
      number | null
  ):
    number {


    if (
      anio ===
      null
    ) {

      return 0;
    }


    const meses =
      this.comparativaMensual

        .filter(
          (
            item:
              ComparativaMensual
          ) =>
            item.anio ===
            anio
        )

        .map(
          (
            item:
              ComparativaMensual
          ) =>
            item.mes
        );


    if (
      meses.length ===
      0
    ) {

      return 0;
    }


    return Math.max(
      ...meses
    );
  }


  private obtenerUltimoMesComun(
    anioA:
      number | null,

    anioB:
      number | null
  ):
    number {


    const ultimoA =
      this.ultimoMesAnio(
        anioA
      );


    const ultimoB =
      this.ultimoMesAnio(
        anioB
      );


    if (
      ultimoA <=
        0 ||
      ultimoB <=
        0
    ) {

      return 0;
    }


    return Math.min(
      ultimoA,
      ultimoB
    );
  }


  get ultimoMesComunSeleccionado():
    number {


    return this.obtenerUltimoMesComun(

      this.anioBaseSeleccionado,

      this.anioComparadoSeleccionado
    );
  }


  /* ==========================================================
   * MESES DEL SELECT
   * ========================================================== */

  get mesesDisponiblesSeleccionados():
    Array<{
      numero: number;
      nombre: string;
    }> {


    if (
      this.anioBaseSeleccionado ===
        null ||
      this.anioComparadoSeleccionado ===
        null ||
      this.anioBaseSeleccionado ===
        this.anioComparadoSeleccionado
    ) {

      return [];
    }


    const limite =
      this.ultimoMesComunSeleccionado;


    const resultado:
      Array<{
        numero: number;
        nombre: string;
      }> = [];


    for (
      let mes =
        1;

      mes <=
        limite;

      mes++
    ) {


      resultado.push({

        numero:
          mes,

        nombre:
          this.nombreMes(
            mes
          )
      });
    }


    return resultado;
  }


  /* ==========================================================
   * TEXTOS
   * ========================================================== */

  get periodoComparadoTexto():
    string {


    if (
      !this.comparacionAplicada ||
      this.mesDesde ===
        null ||
      this.mesHasta ===
        null
    ) {


      return 'Sin comparación';
    }


    if (
      this.mesDesde ===
      this.mesHasta
    ) {


      return this.nombreMes(
        this.mesDesde
      );
    }


    return (
      `${this.nombreMes(
        this.mesDesde
      )} – ${this.nombreMes(
        this.mesHasta
      )}`
    );
  }


  get tituloComparacion():
    string {


    if (
      !this.comparacionAplicada
    ) {

      return 'Sin comparación';
    }


    return (
      `${this.anioBase ?? '—'} vs ` +
      `${this.anioComparado ?? '—'}`
    );
  }


  /* ==========================================================
   * REGISTRO
   * ========================================================== */

  private registroMensual(
    anio:
      number | null,

    mes:
      number
  ):
    ComparativaMensual | null {


    if (
      anio ===
      null
    ) {

      return null;
    }


    return (
      this.comparativaMensual
        .find(
          (
            item:
              ComparativaMensual
          ) =>
            item.anio ===
              anio &&
            item.mes ===
              mes
        ) ??
      null
    );
  }


  /* ==========================================================
   * VALOR
   * ========================================================== */

  private valorMetrica(
    registro:
      ComparativaMensual | null,

    metrica:
      MetricaComparativa
  ):
    number {


    if (
      !registro
    ) {

      return 0;
    }


    switch (
      metrica
    ) {


      case 'personas_fallecidas':

        return (
          registro
            .personas_fallecidas
        );


      case 'accidentes_con_lesionados':

        return (
          registro
            .accidentes_con_lesionados
        );


      case 'cantidad_siniestros':

      default:

        return (
          registro
            .cantidad_siniestros
        );
    }
  }


  /* ==========================================================
   * CONSTRUIR COMPARACIÓN
   * ========================================================== */

  private construirComparacion(
    metrica:
      MetricaComparativa,

    titulo:
      string,

    descripcion:
      string,

    icono:
      IconoComparacion
  ):
    ResumenComparacion {


    const meses:
      MesComparado[] = [];


    let totalBase =
      0;


    let totalComparado =
      0;


    let maximo =
      1;


    if (
      !this.comparacionAplicada ||
      this.anioBase ===
        null ||
      this.anioComparado ===
        null ||
      this.mesDesde ===
        null ||
      this.mesHasta ===
        null
    ) {


      return {

        metrica,

        titulo,

        subtitulo:
          'Sin comparación',

        descripcion,

        icono,

        valorBase:
          0,

        valorComparado:
          0,

        diferencia:
          0,

        variacion:
          null,

        maximo:
          1,

        meses:
          []
      };
    }


    for (
      let mes =
        this.mesDesde;

      mes <=
        this.mesHasta;

      mes++
    ) {


      const registroBase =
        this.registroMensual(
          this.anioBase,
          mes
        );


      const registroComparado =
        this.registroMensual(
          this.anioComparado,
          mes
        );


      const valorBase =
        this.valorMetrica(
          registroBase,
          metrica
        );


      const valorComparado =
        this.valorMetrica(
          registroComparado,
          metrica
        );


      totalBase +=
        valorBase;


      totalComparado +=
        valorComparado;


      maximo =
        Math.max(
          maximo,
          valorBase,
          valorComparado
        );


      meses.push({

        mes,

        nombre:
          this.nombreMes(
            mes
          ),

        abreviatura:
          this.mesesAbreviados[
            mes -
            1
          ] ??
          String(
            mes
          ),

        valorBase,

        valorComparado,

        variacion:
          this.calcularVariacion(
            valorBase,
            valorComparado
          ),

        alturaBase:
          0,

        alturaComparado:
          0
      });
    }


    const maximoVisual =
      Math.max(
        maximo *
        1.15,
        1
      );


    meses.forEach(
      item => {


        item.alturaBase =
          this.alturaBarra(
            item.valorBase,
            maximoVisual
          );


        item.alturaComparado =
          this.alturaBarra(
            item.valorComparado,
            maximoVisual
          );
      }
    );


    return {

      metrica,

      titulo,

      subtitulo:
        `${this.anioBase} vs ${this.anioComparado}`,

      descripcion,

      icono,

      valorBase:
        totalBase,

      valorComparado:
        totalComparado,

      diferencia:
        totalComparado -
        totalBase,

      variacion:
        this.calcularVariacion(
          totalBase,
          totalComparado
        ),

      maximo,

      meses
    };
  }


  /* ==========================================================
   * COMPARACIONES
   * ========================================================== */

  get comparacionSiniestros():
    ResumenComparacion {


    return this.construirComparacion(

      'cantidad_siniestros',

      'Comparativa mensual de siniestros',

      'Comportamiento mensual de los siniestros viales registrados en ambos períodos.',

      'siniestros'
    );
  }


  get comparacionFallecidos():
    ResumenComparacion {


    return this.construirComparacion(

      'personas_fallecidas',

      'Personas fallecidas',

      'Comparación mensual de víctimas fatales registradas en los períodos seleccionados.',

      'fallecidos'
    );
  }


  get comparacionLesionados():
    ResumenComparacion {


    return this.construirComparacion(

      'accidentes_con_lesionados',

      'Accidentes con personas lesionadas',

      'Accidentes que registraron personas lesionadas durante cada período.',

      'lesionados'
    );
  }


  get comparaciones():
    ResumenComparacion[] {


    return [

      this.comparacionSiniestros,

      this.comparacionFallecidos,

      this.comparacionLesionados
    ];
  }


  /* ==========================================================
   * ALTURA
   * ========================================================== */

  private alturaBarra(
    valor:
      number,

    maximo:
      number
  ):
    number {


    if (
      valor <=
        0 ||
      maximo <=
        0
    ) {

      return 0;
    }


    return Math.max(

      5,

      Math.min(

        100,

        (
          valor /
          maximo
        ) *
        100
      )
    );
  }


  /* ==========================================================
   * VARIACIÓN
   * ========================================================== */

  calcularVariacion(
    base:
      number,

    comparado:
      number
  ):
    number | null {


    if (
      base ===
      0
    ) {


      if (
        comparado ===
        0
      ) {

        return 0;
      }


      return null;
    }


    return (
      (
        comparado -
        base
      ) /
      base
    ) *
    100;
  }


  variacionTexto(
    valor:
      number | null
  ):
    string {


    if (
      valor ===
        null ||
      !Number.isFinite(
        valor
      )
    ) {

      return 'Sin referencia';
    }


    const prefijo =
      valor >
      0
        ? '+'
        : '';


    return (
      `${prefijo}${valor.toFixed(1)}%`
    );
  }


  variacionClase(
    valor:
      number | null
  ):
    string {


    if (
      valor ===
        null ||
      !Number.isFinite(
        valor
      ) ||
      valor ===
        0
    ) {

      return 'neutral';
    }


    return valor <
      0
        ? 'positive'
        : 'negative';
  }


  variacionIcono(
    valor:
      number | null
  ):
    string {


    if (
      valor ===
        null ||
      !Number.isFinite(
        valor
      )
    ) {

      return '•';
    }


    if (
      valor >
      0
    ) {

      return '↑';
    }


    if (
      valor <
      0
    ) {

      return '↓';
    }


    return '→';
  }


  variacionDescripcion(
    valor:
      number | null
  ):
    string {


    if (
      valor ===
        null ||
      !Number.isFinite(
        valor
      )
    ) {

      return 'Sin referencia';
    }


    if (
      valor <
      0
    ) {

      return 'Disminuyó';
    }


    if (
      valor >
      0
    ) {

      return 'Aumentó';
    }


    return 'Sin cambios';
  }


  /* ==========================================================
   * TOOLTIP
   * ========================================================== */

  mostrarTooltip(
    event:
      MouseEvent |
      FocusEvent,

    mes:
      MesComparado,

    anio:
      number | null,

    valor:
      number,

    etiqueta:
      string
  ):
    void {


    const elemento =
      event.currentTarget as
        HTMLElement |
        null;


    if (
      !elemento
    ) {

      return;
    }


    const contenedor =
      elemento.closest(
        '.comparison-chart'
      ) as
        HTMLElement |
        null;


    if (
      !contenedor
    ) {

      return;
    }


    const rectContenedor =
      contenedor
        .getBoundingClientRect();


    const rectElemento =
      elemento
        .getBoundingClientRect();


    let x =
      rectElemento.left -
      rectContenedor.left +
      (
        rectElemento.width /
        2
      );


    let y =
      rectElemento.top -
      rectContenedor.top -
      10;


    if (
      event instanceof
      MouseEvent
    ) {


      x =
        event.clientX -
        rectContenedor.left +
        12;


      y =
        event.clientY -
        rectContenedor.top -
        12;
    }


    this.tooltip = {

      visible:
        true,

      x,

      y,

      titulo:
        `${mes.nombre} ${anio ?? ''}`,

      valor:
        `${valor} ${etiqueta}`,

      detalle:
        mes.variacion ===
          null

          ? 'No existe base suficiente para calcular la variación.'

          : (
              `Variación entre ambos años: ` +
              `${this.variacionTexto(
                mes.variacion
              )}`
            )
    };


    this.cdr
      .markForCheck();
  }


  moverTooltip(
    event:
      MouseEvent
  ):
    void {


    if (
      !this.tooltip.visible
    ) {

      return;
    }


    const elemento =
      event.currentTarget as
        HTMLElement |
        null;


    if (
      !elemento
    ) {

      return;
    }


    const contenedor =
      elemento.closest(
        '.comparison-chart'
      ) as
        HTMLElement |
        null;


    if (
      !contenedor
    ) {

      return;
    }


    const rect =
      contenedor
        .getBoundingClientRect();


    this.tooltip = {

      ...this.tooltip,

      x:
        event.clientX -
        rect.left +
        12,

      y:
        event.clientY -
        rect.top -
        12
    };


    this.cdr
      .markForCheck();
  }


  ocultarTooltip():
    void {


    this.tooltip = {

      ...this.tooltip,

      visible:
        false
    };


    this.cdr
      .markForCheck();
  }


  /* ==========================================================
   * FUENTE
   * ========================================================== */

  fuenteAnio(
    anio:
      number | null
  ):
    string {


    if (
      anio ===
      null
    ) {

      return '';
    }


    return (
      this.comparativaMensual
        .find(
          (
            item:
              ComparativaMensual
          ) =>
            item.anio ===
            anio
        )
        ?.fuente ??
      ''
    );
  }


  esDinamico(
    anio:
      number | null
  ):
    boolean {


    return (
      this.fuenteAnio(
        anio
      ) ===
      'DINAMICO'
    );
  }


  /* ==========================================================
   * UTILIDADES
   * ========================================================== */

  nombreMes(
    mes:
      number
  ):
    string {


    return (
      this.mesesCompletos[
        mes -
        1
      ] ??
      'Sin mes'
    );
  }


  etiquetaMetrica(
    metrica:
      MetricaComparativa
  ):
    string {


    switch (
      metrica
    ) {


      case 'personas_fallecidas':

        return 'personas fallecidas';


      case 'accidentes_con_lesionados':

        return 'accidentes con lesionados';


      case 'cantidad_siniestros':

      default:

        return 'siniestros';
    }
  }
}
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { SupabaseService } from '../../../core/services/supabase.service';


/* =========================================================
 * INTERFACES
 * ========================================================= */

interface RegistroPreview {
  fila: number;
  numeroCaso: string;
  fecha: string;
  hora: string;
  claseAccidente: string;
  gravedad: string;
  direccion: string;
  barrio: string;
  coordenadas: string;
}

interface SiniestroParseado {
  filaExcel: number;
  numeroCaso: string;
  filaPrincipal: any[];
  filasRelacionadas: any[][];
}

interface DistribucionMensual {
  numeroMes: number;
  mes: string;
  cantidad: number;
}

interface FechaNoInterpretada {
  caso: string;
  fila: number;
  valor: unknown;
  tipo: string;
}

interface SiniestroParaInsertar {
  numero_caso: number | null;
  estadistica: number | null;
  numero_informe_transito: string | null;

  anio: number;
  fecha: string | null;
  hora: string | null;

  area: string | null;

  latitud: number | null;
  longitud: number | null;
  coordenadas_originales: string | null;

  direccion_hecho: string | null;
  controles_transito: string | null;
  barrio_hecho: string | null;

  clase_accidente: string | null;
  gravedad_accidente: string | null;
  tipo_accidente: string | null;

  situacion: string | null;

  agente: string | null;
  documento_agente: string | null;

  archivo_origen: string | null;

  dia_semana: string | null;
  mes: number | null;
  numero_mes: number | null;

  coordenadas_fuente: string | null;
}

interface VehiculoParaInsertar {
  numeroCaso: string;
  numero_vehiculo: number;

  clase_servicio: string | null;
  clase_vehiculo: string | null;
  modalidad_transporte: string | null;
  radio_accion: string | null;
  placa: string | null;
}

interface PersonaParaInsertar {
  numeroCaso: string;

  numeroVehiculo: number | null;

  tipo_actor:
    | 'CONDUCTOR'
    | 'ACOMPANANTE'
    | 'PEATON';

  numero_actor: number | null;

  nombre: string | null;
  documento: string | null;
  sexo: string | null;

  fecha_nacimiento: string | null;
  edad: number | null;

  gravedad: string | null;
  detalle_actor: string | null;
}

interface HipotesisParaInsertar {
  numeroCaso: string;

  tipo_actor:
    | 'VEHICULO'
    | 'PEATON';

  numero_vehiculo: number | null;

  codigo: string | null;
  otra: string | null;
}


/* =========================================================
 * COMPONENTE
 * ========================================================= */

@Component({
  selector: 'app-carga-masiva',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './carga-masiva.html',
  styleUrl: './carga-masiva.scss',
})
export class CargaMasiva {

  private readonly cdr =
    inject(ChangeDetectorRef);

  private readonly supabaseService =
    inject(SupabaseService);

  private get supabase() {
    return this.supabaseService.client;
  }


  /* =======================================================
   * FORMULARIO
   * ======================================================= */

  anioSeleccionado =
    new Date().getFullYear();

  mesSeleccionado = '';

  archivoSeleccionado:
    File | null = null;

  nombreArchivo = '';

  procesando = false;

  archivoValido = false;

  cargandoSupabase = false;

  cargaCompletada = false;

  mensajeError = '';

  mensajeExito = '';

  mensajeCargaError = '';


  /* =======================================================
   * CONTADORES
   * ======================================================= */

  totalRegistros = 0;

  totalFilasExcel = 0;

  totalDistribucionMensual = 0;


  /* =======================================================
   * DATOS PROCESADOS
   * ======================================================= */

  registrosPreview:
    RegistroPreview[] = [];

  siniestrosParseados:
    SiniestroParseado[] = [];

  encabezadosActuales:
    string[] = [];

  distribucionMensual:
    DistribucionMensual[] = [];


  /* =======================================================
   * DATOS PREPARADOS PARA INSERCIÓN
   * ======================================================= */

  siniestrosParaInsertar:
    SiniestroParaInsertar[] = [];

  vehiculosParaInsertar:
    VehiculoParaInsertar[] = [];

  personasParaInsertar:
    PersonaParaInsertar[] = [];

  hipotesisParaInsertar:
    HipotesisParaInsertar[] = [];


  /* =======================================================
   * AÑOS Y MESES
   * ======================================================= */

  readonly anios = [
    2026,
    2027,
    2028,
    2029,
    2030
  ];

  readonly meses = [
    { valor: '1', nombre: 'Enero' },
    { valor: '2', nombre: 'Febrero' },
    { valor: '3', nombre: 'Marzo' },
    { valor: '4', nombre: 'Abril' },
    { valor: '5', nombre: 'Mayo' },
    { valor: '6', nombre: 'Junio' },
    { valor: '7', nombre: 'Julio' },
    { valor: '8', nombre: 'Agosto' },
    { valor: '9', nombre: 'Septiembre' },
    { valor: '10', nombre: 'Octubre' },
    { valor: '11', nombre: 'Noviembre' },
    { valor: '12', nombre: 'Diciembre' },
  ];


  /* =======================================================
   * SELECCIONAR ARCHIVO
   * ======================================================= */

  onArchivoSeleccionado(
    event: Event
  ): void {

    this.limpiarResultado();

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    const archivo =
      input.files[0];

    const extension =
      archivo.name
        .split('.')
        .pop()
        ?.toLowerCase();

    if (
      !extension ||
      !['xlsx', 'xls'].includes(extension)
    ) {

      this.mensajeError =
        'El archivo debe estar en formato Excel (.xlsx o .xls).';

      input.value = '';

      return;
    }

    this.archivoSeleccionado =
      archivo;

    this.nombreArchivo =
      archivo.name;

    this.leerExcel(
      archivo
    );
  }


  /* =======================================================
   * LEER EXCEL
   * ======================================================= */

  private leerExcel(
    archivo: File
  ): void {

    this.procesando = true;
    this.archivoValido = false;
    this.mensajeError = '';

    this.totalRegistros = 0;
    this.totalFilasExcel = 0;
    this.totalDistribucionMensual = 0;

    this.registrosPreview = [];
    this.siniestrosParseados = [];
    this.encabezadosActuales = [];
    this.distribucionMensual = [];

    this.siniestrosParaInsertar = [];
    this.vehiculosParaInsertar = [];
    this.personasParaInsertar = [];
    this.hipotesisParaInsertar = [];

    console.log(
      'Iniciando lectura del Excel:',
      archivo.name
    );

    const reader =
      new FileReader();

    reader.onload = (
      evento: ProgressEvent<FileReader>
    ) => {

      try {

        const resultado =
          evento.target?.result;

        if (!resultado) {

          throw new Error(
            'No fue posible leer el contenido del archivo.'
          );
        }

        const data =
          new Uint8Array(
            resultado as ArrayBuffer
          );

        const workbook =
          XLSX.read(
            data,
            {
              type: 'array',
              cellDates: true,
            }
          );

        console.log(
          'Hojas encontradas:',
          workbook.SheetNames
        );

        const hojaEsperada =
          `BASE DE DATOS ${this.anioSeleccionado}`;

        let nombreHojaReal =
          workbook.SheetNames.find(
            nombre =>
              this.normalizarTexto(nombre) ===
              this.normalizarTexto(hojaEsperada)
          );

        if (!nombreHojaReal) {

          nombreHojaReal =
            workbook.SheetNames.find(
              nombre =>
                this.normalizarTexto(nombre)
                  .includes('BASE DE DATOS')
            );
        }

        if (!nombreHojaReal) {

          throw new Error(
            `No se encontró una hoja de base de datos. ` +
            `Hojas disponibles: ${workbook.SheetNames.join(', ')}`
          );
        }

        console.log(
          'Hoja encontrada:',
          nombreHojaReal
        );

        const worksheet =
          workbook.Sheets[
            nombreHojaReal
          ];

        if (!worksheet) {

          throw new Error(
            `No fue posible acceder a la hoja "${nombreHojaReal}".`
          );
        }

        const filas =
          XLSX.utils.sheet_to_json<any[]>(
            worksheet,
            {
              header: 1,
              defval: null,
              raw: false,
            }
          );

        if (
          !filas ||
          filas.length < 2
        ) {

          throw new Error(
            'La hoja no contiene registros suficientes para procesar.'
          );
        }

        const indiceFilaEncabezados =
          this.detectarFilaEncabezados(
            filas
          );

        if (
          indiceFilaEncabezados === -1
        ) {

          throw new Error(
            'No fue posible localizar automáticamente la fila de encabezados.'
          );
        }

        console.log(
          'Fila de encabezados detectada:',
          indiceFilaEncabezados + 1
        );

        const encabezados =
          filas[
            indiceFilaEncabezados
          ].map(
            valor =>
              this.normalizarTexto(
                valor
              )
          );

        this.encabezadosActuales =
          encabezados;

        this.validarEncabezados(
          encabezados
        );

        const datos =
          filas
            .slice(
              indiceFilaEncabezados + 1
            )
            .filter(
              fila =>
                this.filaTieneContenido(
                  fila
                )
            );

        this.totalFilasExcel =
          datos.length;

        this.siniestrosParseados =
          this.agruparSiniestros(
            datos,
            encabezados,
            indiceFilaEncabezados
          );

        this.totalRegistros =
          this.siniestrosParseados.length;

        console.log(
          'Filas físicas con contenido:',
          this.totalFilasExcel
        );

        console.log(
          'SINIESTROS REALES DETECTADOS:',
          this.totalRegistros
        );

        /*
         * Primero generamos:
         *
         * 1. siniestros
         * 2. vehículos
         * 3. personas
         * 4. hipótesis
         */
        this.construirDatosParaInsercion(
          this.siniestrosParseados
        );

        this.distribucionMensual =
          this.calcularDistribucionMensual(
            this.siniestrosParseados,
            encabezados
          );

        this.totalDistribucionMensual =
          this.distribucionMensual.reduce(
            (
              acumulado,
              item
            ) =>
              acumulado +
              item.cantidad,
            0
          );

        console.log(
          '======================================='
        );

        console.log(
          'DISTRIBUCIÓN MENSUAL DE SINIESTROS'
        );

        console.log(
          '======================================='
        );

        console.table(
          this.distribucionMensual
        );

        console.log(
          'TOTAL SINIESTROS DISTRIBUIDOS:',
          this.totalDistribucionMensual
        );

        console.log(
          'TOTAL SINIESTROS DETECTADOS:',
          this.totalRegistros
        );

        if (
          this.totalDistribucionMensual !==
          this.totalRegistros
        ) {

          console.warn(
            'ATENCIÓN: existen siniestros cuya fecha no pudo ser interpretada.'
          );

          console.warn(
            'Diferencia:',
            this.totalRegistros -
            this.totalDistribucionMensual
          );
        }

        this.registrosPreview =
          this.siniestrosParseados
            .slice(0, 10)
            .map(
              siniestro =>
                this.mapearPreview(
                  siniestro.filaPrincipal,
                  encabezados,
                  siniestro.filaExcel
                )
            );

        this.archivoValido = true;

        this.mensajeError = '';

        console.log(
          'Excel validado correctamente.'
        );

      } catch (error) {

        console.error(
          'ERROR procesando el Excel:',
          error
        );

        this.archivoValido = false;

        this.totalRegistros = 0;
        this.totalFilasExcel = 0;
        this.totalDistribucionMensual = 0;

        this.registrosPreview = [];
        this.siniestrosParseados = [];
        this.distribucionMensual = [];

        this.siniestrosParaInsertar = [];
        this.vehiculosParaInsertar = [];
        this.personasParaInsertar = [];
        this.hipotesisParaInsertar = [];

        this.mensajeError =
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado al procesar el archivo.';

      } finally {

        this.procesando = false;

        this.cdr.detectChanges();
      }
    };

    reader.onerror = () => {

      this.procesando = false;

      this.archivoValido = false;

      this.mensajeError =
        'El navegador no pudo leer el archivo seleccionado.';

      this.cdr.detectChanges();
    };

    reader.onabort = () => {

      this.procesando = false;

      this.archivoValido = false;

      this.mensajeError =
        'La lectura del archivo fue cancelada.';

      this.cdr.detectChanges();
    };

    try {

      reader.readAsArrayBuffer(
        archivo
      );

    } catch (error) {

      console.error(
        'ERROR iniciando FileReader:',
        error
      );

      this.procesando = false;

      this.archivoValido = false;

      this.mensajeError =
        'No fue posible iniciar la lectura del archivo.';

      this.cdr.detectChanges();
    }
  }


  /* =======================================================
   * AGRUPAR SINIESTROS
   * ======================================================= */

  private agruparSiniestros(
    datos: any[][],
    encabezados: string[],
    indiceFilaEncabezados: number
  ): SiniestroParseado[] {

    const indiceCaso =
      this.buscarIndiceEncabezado(
        encabezados,
        [
          'NO. DE CASOS',
          'NO DE CASOS',
          'NUMERO DE CASO',
          'NÚMERO DE CASO',
          'CASO'
        ]
      );

    if (
      indiceCaso === -1
    ) {

      throw new Error(
        'No fue posible identificar la columna del número de caso.'
      );
    }

    const siniestros:
      SiniestroParseado[] = [];

    let siniestroActual:
      SiniestroParseado | null = null;

    datos.forEach(
      (
        fila,
        indiceDatos
      ) => {

        const numeroCasoRaw =
          fila[
            indiceCaso
          ];

        const tieneNumeroCaso =
          numeroCasoRaw !== null &&
          numeroCasoRaw !== undefined &&
          String(
            numeroCasoRaw
          ).trim() !== '';

        const numeroFilaExcel =
          indiceFilaEncabezados +
          indiceDatos +
          2;

        /*
         * Una fila con número de caso no necesariamente
         * corresponde a un siniestro real.
         *
         * Debe tener al menos información principal
         * adicional. Las coordenadas por sí solas no
         * son suficientes para crear un siniestro.
         */
        const tieneDatosPrincipales =
          this.convertirFechaExcel(
            fila[4]
          ) !== null ||
          this.textoSeguro(
            fila[2]
          ) !== null ||
          this.normalizarHora(
            fila[6]
          ) !== null ||
          this.textoSeguro(
            fila[9]
          ) !== null ||
          this.textoSeguro(
            fila[12]
          ) !== null ||
          this.textoSeguro(
            fila[78]
          ) !== null ||
          this.textoSeguro(
            fila[81]
          ) !== null;


        /*
         * Fila fantasma:
         * tiene número de caso pero no información
         * suficiente para representar un siniestro.
         *
         * IMPORTANTE:
         * tampoco se agrega como fila relacionada
         * del siniestro anterior.
         */
        if (
          tieneNumeroCaso &&
          !tieneDatosPrincipales
        ) {

          console.warn(
            'Fila ignorada: contiene número de caso, ' +
            'pero no tiene información suficiente para crear un siniestro.',
            {
              filaExcel:
                numeroFilaExcel,

              numeroCaso:
                String(
                  numeroCasoRaw
                ).trim(),

              coordenadas:
                this.textoSeguro(
                  fila[8]
                )
            }
          );

          return;
        }


        /*
         * Inicio real de un siniestro.
         */
        if (
          tieneNumeroCaso &&
          tieneDatosPrincipales
        ) {

          siniestroActual = {

            filaExcel:
              numeroFilaExcel,

            numeroCaso:
              String(
                numeroCasoRaw
              ).trim(),

            filaPrincipal:
              fila,

            filasRelacionadas:
              []

          };

          siniestros.push(
            siniestroActual
          );

          return;
        }

        if (
          siniestroActual
        ) {

          siniestroActual
            .filasRelacionadas
            .push(
              fila
            );
        }
      }
    );

    return siniestros;
  }


  /* =======================================================
   * CONSTRUIR DATOS
   * ======================================================= */

  private construirDatosParaInsercion(
    siniestros: SiniestroParseado[]
  ): void {

    this.siniestrosParaInsertar = [];
    this.vehiculosParaInsertar = [];
    this.personasParaInsertar = [];
    this.hipotesisParaInsertar = [];


    /* =====================================================
     * PRIMERA PASADA:
     * SINIESTROS + VEHÍCULOS
     * ===================================================== */

    for (
      const siniestro
      of siniestros
    ) {

      const fila =
        siniestro.filaPrincipal;

      const caso =
        siniestro.numeroCaso;

      const fecha =
        this.convertirFechaExcel(
          fila[4]
        );

      const coordenadas =
        this.parsearCoordenadas(
          fila[8]
        );

      const numeroMes =
        fecha
          ? fecha.getMonth() + 1
          : null;


      this.siniestrosParaInsertar.push({

        numero_caso:
          this.numeroSeguro(
            fila[0]
          ),

        estadistica:
          this.numeroSeguro(
            fila[1]
          ),

        numero_informe_transito:
          this.textoSeguro(
            fila[2]
          ),

        anio:
          this.numeroSeguro(
            fila[3]
          ) ??
          this.anioSeleccionado,

        fecha:
          fecha
            ? this.formatearFechaSQL(
                fecha
              )
            : null,

        hora:
          this.normalizarHora(
            fila[6]
          ),

        area:
          this.textoSeguro(
            fila[7]
          ),

        latitud:
          coordenadas.latitud,

        longitud:
          coordenadas.longitud,

        coordenadas_originales:
          this.textoSeguro(
            fila[8]
          ),

        direccion_hecho:
          this.textoSeguro(
            fila[9]
          ),

        controles_transito:
          this.textoSeguro(
            fila[10]
          ),

        barrio_hecho:
          this.textoSeguro(
            fila[11]
          ),

        clase_accidente:
          this.textoSeguro(
            fila[12]
          ),

        gravedad_accidente:
          this.textoSeguro(
            fila[81]
          ),

        tipo_accidente:
          this.textoSeguro(
            fila[78]
          ),

        situacion:
          this.textoSeguro(
            fila[82]
          ),

        agente:
          this.textoSeguro(
            fila[79]
          ),

        documento_agente:
          this.textoSeguro(
            fila[80]
          ),

        archivo_origen:
          this.nombreArchivo ||
          null,

        dia_semana:
          this.textoSeguro(
            fila[5]
          ),

        mes:
          numeroMes,

        numero_mes:
          numeroMes,

        coordenadas_fuente:
          this.textoSeguro(
            fila[8]
          )
      });


      /* =================================================
       * VEHÍCULO 1
       * ================================================= */

      this.procesarVehiculo(
        fila,
        caso,
        1,
        {
          claseServicio: 13,
          claseVehiculo: 14,
          modalidad: 15,
          radio: 16,
          placa: 17
        }
      );


      /* =================================================
       * VEHÍCULO 2
       * ================================================= */

      this.procesarVehiculo(
        fila,
        caso,
        2,
        {
          claseServicio: 31,
          claseVehiculo: 30,
          modalidad: 32,
          radio: 33,
          placa: 34
        }
      );


      /* =================================================
       * VEHÍCULO 3
       * ================================================= */

      this.procesarVehiculo(
        fila,
        caso,
        3,
        {
          claseServicio: 48,
          claseVehiculo: 47,
          modalidad: 49,
          radio: 50,
          placa: 51
        }
      );
    }


    /* =====================================================
     * SEGUNDA PASADA:
     * PERSONAS + HIPÓTESIS
     *
     * Aquí ya sabemos qué vehículos existen.
     * ===================================================== */

    for (
      const siniestro
      of siniestros
    ) {

      const fila =
        siniestro.filaPrincipal;

      const caso =
        siniestro.numeroCaso;


      /* =================================================
       * VEHÍCULO 1 - CONDUCTOR
       * ================================================= */

      this.procesarPersona(
        fila,
        caso,
        'CONDUCTOR',
        1,
        1,
        {
          nombre: 18,
          gravedad: 19,
          sexo: 20,
          documento: 21,
          fechaNacimiento: 22,
          edad: 23
        }
      );


      /* =================================================
       * VEHÍCULO 1 - ACOMPAÑANTE
       * ================================================= */

      this.procesarPersona(
        fila,
        caso,
        'ACOMPANANTE',
        1,
        1,
        {
          nombre: 24,
          gravedad: 25,
          sexo: 26,
          documento: 27,
          fechaNacimiento: 28,
          edad: 29
        }
      );


      /* =================================================
       * VEHÍCULO 2 - CONDUCTOR
       * ================================================= */

      this.procesarPersona(
        fila,
        caso,
        'CONDUCTOR',
        2,
        1,
        {
          nombre: 35,
          sexo: 36,
          documento: 37,
          fechaNacimiento: 38,
          edad: 39,
          gravedad: 40
        }
      );


      /* =================================================
       * VEHÍCULO 2 - ACOMPAÑANTE
       * ================================================= */

      this.procesarPersona(
        fila,
        caso,
        'ACOMPANANTE',
        2,
        1,
        {
          nombre: 41,
          gravedad: 42,
          sexo: 43,
          documento: 44,
          fechaNacimiento: 45,
          edad: 46
        }
      );


      /* =================================================
       * VEHÍCULO 3 - CONDUCTOR
       * ================================================= */

      this.procesarPersona(
        fila,
        caso,
        'CONDUCTOR',
        3,
        1,
        {
          nombre: 52,
          sexo: 53,
          documento: 54,
          fechaNacimiento: 55,
          edad: 56,
          gravedad: 57
        }
      );


      /* =================================================
       * VEHÍCULO 3 - ACOMPAÑANTE
       * ================================================= */

      this.procesarPersona(
        fila,
        caso,
        'ACOMPANANTE',
        3,
        1,
        {
          nombre: 58,
          gravedad: 59,
          sexo: 60,
          documento: 61,
          fechaNacimiento: 62,
          edad: 63
        }
      );


      /* =================================================
       * PEATÓN
       * ================================================= */

      this.procesarPersona(
        fila,
        caso,
        'PEATON',
        null,
        1,
        {
          nombre: 65,
          sexo: 66,
          documento: 67,
          fechaNacimiento: 68,
          edad: 69,
          gravedad: 70,
          detalle: 64
        }
      );


      /* =================================================
       * HIPÓTESIS VEHÍCULO 1
       * ================================================= */

      this.procesarHipotesis(
        fila,
        caso,
        'VEHICULO',
        1,
        71,
        72
      );


      /* =================================================
       * HIPÓTESIS VEHÍCULO 2
       * ================================================= */

      this.procesarHipotesis(
        fila,
        caso,
        'VEHICULO',
        2,
        73,
        74
      );


      /* =================================================
       * HIPÓTESIS VEHÍCULO 3
       * ================================================= */

      this.procesarHipotesis(
        fila,
        caso,
        'VEHICULO',
        3,
        75,
        76
      );


      /* =================================================
       * HIPÓTESIS PEATÓN
       * ================================================= */

      this.procesarHipotesis(
        fila,
        caso,
        'PEATON',
        null,
        77,
        null
      );
    }


    /* =====================================================
     * CONTEOS
     * ===================================================== */

    const conductores =
      this.personasParaInsertar.filter(
        persona =>
          persona.tipo_actor ===
          'CONDUCTOR'
      ).length;

    const acompanantes =
      this.personasParaInsertar.filter(
        persona =>
          persona.tipo_actor ===
          'ACOMPANANTE'
      ).length;

    const peatones =
      this.personasParaInsertar.filter(
        persona =>
          persona.tipo_actor ===
          'PEATON'
      ).length;

    const sinFecha =
      this.siniestrosParaInsertar.filter(
        siniestro =>
          !siniestro.fecha
      ).length;


    /* =====================================================
     * VEHÍCULOS SIN CONDUCTOR
     * ===================================================== */

    const vehiculosSinConductor =
      this.vehiculosParaInsertar.filter(
        vehiculo => {

          return !this.personasParaInsertar.some(
            persona =>
              persona.numeroCaso ===
                vehiculo.numeroCaso &&
              persona.numeroVehiculo ===
                vehiculo.numero_vehiculo &&
              persona.tipo_actor ===
                'CONDUCTOR'
          );
        }
      );


    console.log(
      '=========================================='
    );

    console.log(
      '========== VEHÍCULOS SIN CONDUCTOR =========='
    );

    console.table(
      vehiculosSinConductor
    );

    console.log(
      'Total vehículos sin conductor:',
      vehiculosSinConductor.length
    );

    console.log(
      '========== FIN VEHÍCULOS SIN CONDUCTOR =========='
    );


    /* =====================================================
     * CONDUCTORES SIN VEHÍCULO
     * ===================================================== */

    const conductoresSinVehiculo =
      this.personasParaInsertar.filter(
        persona => {

          if (
            persona.tipo_actor !==
              'CONDUCTOR' ||
            persona.numeroVehiculo === null
          ) {

            return false;
          }

          return !this.vehiculosParaInsertar.some(
            vehiculo =>
              vehiculo.numeroCaso ===
                persona.numeroCaso &&
              vehiculo.numero_vehiculo ===
                persona.numeroVehiculo
          );
        }
      );


    console.log(
      '=========================================='
    );

    console.log(
      '========== CONDUCTORES SIN VEHÍCULO =========='
    );

    console.table(
      conductoresSinVehiculo
    );

    console.log(
      'Total conductores sin vehículo:',
      conductoresSinVehiculo.length
    );

    console.log(
      '========== FIN CONDUCTORES SIN VEHÍCULO =========='
    );


    /* =====================================================
     * RESULTADO FINAL
     * ===================================================== */

    console.log(
      '=========================================='
    );

    console.log(
      '========== RESULTADO DEL PARSER =========='
    );

    console.log(
      '=========================================='
    );

    console.log(
      'Siniestros:',
      this.siniestrosParaInsertar.length
    );

    console.log(
      'Vehículos:',
      this.vehiculosParaInsertar.length
    );

    console.log(
      'Personas:',
      this.personasParaInsertar.length
    );

    console.log(
      'Conductores:',
      conductores
    );

    console.log(
      'Acompañantes:',
      acompanantes
    );

    console.log(
      'Peatones:',
      peatones
    );

    console.log(
      'Hipótesis:',
      this.hipotesisParaInsertar.length
    );

    console.log(
      'Sin fecha:',
      sinFecha
    );

    console.log(
      'Vehículos sin conductor:',
      vehiculosSinConductor.length
    );

    console.log(
      'Conductores sin vehículo:',
      conductoresSinVehiculo.length
    );

    console.log(
      '=========================================='
    );
  }


  /* =======================================================
   * PROCESAR VEHÍCULO
   * ======================================================= */

  private procesarVehiculo(
    fila: any[],
    numeroCaso: string,
    numeroVehiculo: number,
    indices: {
      claseServicio: number;
      claseVehiculo: number;
      modalidad: number;
      radio: number;
      placa: number;
    }
  ): void {

    const claseServicio =
      this.textoSeguro(
        fila[
          indices.claseServicio
        ]
      );

    const claseVehiculo =
      this.textoSeguro(
        fila[
          indices.claseVehiculo
        ]
      );

    const modalidad =
      this.textoSeguro(
        fila[
          indices.modalidad
        ]
      );

    const radio =
      this.textoSeguro(
        fila[
          indices.radio
        ]
      );

    const placa =
      this.textoSeguro(
        fila[
          indices.placa
        ]
      );


    /*
     * Revisamos también nombre/documento
     * de conductor y acompañante.
     */

    let conductorNombre:
      string | null = null;

    let conductorDocumento:
      string | null = null;

    let acompananteNombre:
      string | null = null;

    let acompananteDocumento:
      string | null = null;


    if (
      numeroVehiculo === 1
    ) {

      conductorNombre =
        this.textoSeguro(
          fila[18]
        );

      conductorDocumento =
        this.textoSeguro(
          fila[21]
        );

      acompananteNombre =
        this.textoSeguro(
          fila[24]
        );

      acompananteDocumento =
        this.textoSeguro(
          fila[27]
        );

    } else if (
      numeroVehiculo === 2
    ) {

      conductorNombre =
        this.textoSeguro(
          fila[35]
        );

      conductorDocumento =
        this.textoSeguro(
          fila[37]
        );

      acompananteNombre =
        this.textoSeguro(
          fila[41]
        );

      acompananteDocumento =
        this.textoSeguro(
          fila[44]
        );

    } else if (
      numeroVehiculo === 3
    ) {

      conductorNombre =
        this.textoSeguro(
          fila[52]
        );

      conductorDocumento =
        this.textoSeguro(
          fila[54]
        );

      acompananteNombre =
        this.textoSeguro(
          fila[58]
        );

      acompananteDocumento =
        this.textoSeguro(
          fila[61]
        );
    }


    /*
     * MUY IMPORTANTE:
     *
     * modalidad o radio por sí solos NO
     * demuestran existencia de vehículo.
     *
     * Esto evita vehículos falsos cuyo único
     * valor era por ejemplo:
     *
     * radio = N
     * radio = NN
     */

    const existeVehiculo =
      claseServicio !== null ||
      claseVehiculo !== null ||
      placa !== null ||
      conductorNombre !== null ||
      conductorDocumento !== null ||
      acompananteNombre !== null ||
      acompananteDocumento !== null;


    if (
      !existeVehiculo
    ) {

      if (
        modalidad !== null ||
        radio !== null
      ) {

        console.warn(
          'Vehículo descartado por datos residuales:',
          {
            caso:
              numeroCaso,

            numeroVehiculo,

            modalidad,

            radio
          }
        );
      }

      return;
    }


    this.vehiculosParaInsertar.push({

      numeroCaso,

      numero_vehiculo:
        numeroVehiculo,

      clase_servicio:
        claseServicio,

      clase_vehiculo:
        claseVehiculo,

      modalidad_transporte:
        modalidad,

      radio_accion:
        radio,

      placa
    });
  }


  /* =======================================================
   * PROCESAR PERSONA
   * ======================================================= */

  private procesarPersona(
    fila: any[],
    numeroCaso: string,
    tipoActor:
      | 'CONDUCTOR'
      | 'ACOMPANANTE'
      | 'PEATON',
    numeroVehiculo:
      number | null,
    numeroActor: number,
    indices: {
      nombre: number;
      documento?: number;
      sexo?: number;
      fechaNacimiento?: number;
      edad?: number;
      gravedad?: number;
      detalle?: number;
    }
  ): void {

    const nombre =
      this.textoSeguro(
        fila[
          indices.nombre
        ]
      );

    const documento =
      indices.documento !== undefined
        ? this.textoSeguro(
            fila[
              indices.documento
            ]
          )
        : null;

    const sexo =
      indices.sexo !== undefined
        ? this.textoSeguro(
            fila[
              indices.sexo
            ]
          )
        : null;

    const edad =
      indices.edad !== undefined
        ? this.edadSegura(
            fila[
              indices.edad
            ],
            numeroCaso,
            tipoActor,
            numeroVehiculo
          )
        : null;

    const gravedad =
      indices.gravedad !== undefined
        ? this.textoSeguro(
            fila[
              indices.gravedad
            ]
          )
        : null;

    const detalleActor =
      indices.detalle !== undefined
        ? this.textoSeguro(
            fila[
              indices.detalle
            ]
          )
        : null;


    /* =====================================================
     * CONDUCTOR / ACOMPAÑANTE
     * ===================================================== */

    if (
      tipoActor === 'CONDUCTOR' ||
      tipoActor === 'ACOMPANANTE'
    ) {

      /*
       * Para estas personas necesitamos
       * identidad mínima.
       *
       * Sexo, edad o gravedad por sí solos
       * NO crean persona.
       */
      const tieneIdentidad =
        nombre !== null ||
        documento !== null;


      if (
        !tieneIdentidad
      ) {

        if (
          sexo !== null ||
          edad !== null ||
          gravedad !== null
        ) {

          console.warn(
            'Persona descartada por datos residuales:',
            {
              caso:
                numeroCaso,

              tipoActor,

              numeroVehiculo,

              nombre,

              documento,

              sexo,

              edad,

              gravedad
            }
          );
        }

        return;
      }


      /*
       * Además el vehículo debe existir.
       */
      if (
        numeroVehiculo === null
      ) {

        return;
      }


      const existeVehiculo =
        this.vehiculosParaInsertar.some(
          vehiculo =>
            vehiculo.numeroCaso ===
              numeroCaso &&
            vehiculo.numero_vehiculo ===
              numeroVehiculo
        );


      if (
        !existeVehiculo
      ) {

        console.warn(
          'Persona descartada porque su vehículo no existe:',
          {
            caso:
              numeroCaso,

            tipoActor,

            numeroVehiculo,

            nombre,

            documento
          }
        );

        return;
      }
    }


    /* =====================================================
     * PEATÓN
     * ===================================================== */

    if (
      tipoActor === 'PEATON'
    ) {

      const existePeaton =
        nombre !== null ||
        documento !== null ||
        detalleActor !== null;


      if (
        !existePeaton
      ) {

        return;
      }
    }


    /* =====================================================
     * FECHA NACIMIENTO
     * ===================================================== */

    let fechaNacimiento:
      string | null = null;


    if (
      indices.fechaNacimiento !== undefined
    ) {

      const fecha =
        this.convertirFechaExcel(
          fila[
            indices.fechaNacimiento
          ]
        );


      fechaNacimiento =
        fecha
          ? this.formatearFechaSQL(
              fecha
            )
          : null;
    }


    this.personasParaInsertar.push({

      numeroCaso,

      numeroVehiculo,

      tipo_actor:
        tipoActor,

      numero_actor:
        numeroActor,

      nombre,

      documento,

      sexo,

      fecha_nacimiento:
        fechaNacimiento,

      edad,

      gravedad,

      detalle_actor:
        detalleActor
    });
  }


  /* =======================================================
   * PROCESAR HIPÓTESIS
   * ======================================================= */

  private procesarHipotesis(
    fila: any[],
    numeroCaso: string,
    tipoActor:
      | 'VEHICULO'
      | 'PEATON',
    numeroVehiculo:
      number | null,
    indiceCodigo: number,
    indiceOtra:
      number | null
  ): void {

    const codigo =
      this.textoSeguro(
        fila[
          indiceCodigo
        ]
      );

    const otra =
      indiceOtra !== null
        ? this.textoSeguro(
            fila[
              indiceOtra
            ]
          )
        : null;


    if (
      codigo === null &&
      otra === null
    ) {

      return;
    }


    /*
     * Si la hipótesis pertenece a vehículo,
     * ese vehículo debe existir.
     */
    if (
      tipoActor === 'VEHICULO' &&
      numeroVehiculo !== null
    ) {

      const existeVehiculo =
        this.vehiculosParaInsertar.some(
          vehiculo =>
            vehiculo.numeroCaso ===
              numeroCaso &&
            vehiculo.numero_vehiculo ===
              numeroVehiculo
        );


      if (
        !existeVehiculo
      ) {

        console.warn(
          'Hipótesis descartada porque el vehículo no existe:',
          {
            caso:
              numeroCaso,

            numeroVehiculo,

            codigo,

            otra
          }
        );

        return;
      }
    }


    this.hipotesisParaInsertar.push({

      numeroCaso,

      tipo_actor:
        tipoActor,

      numero_vehiculo:
        numeroVehiculo,

      codigo,

      otra
    });
  }


  /* =======================================================
   * DISTRIBUCIÓN MENSUAL
   * ======================================================= */

  private calcularDistribucionMensual(
    siniestros: SiniestroParseado[],
    encabezados: string[]
  ): DistribucionMensual[] {

    const indiceFecha =
      this.buscarIndiceEncabezado(
        encabezados,
        [
          'FECHA',
          'FECHA HECHO',
          'FECHA DEL HECHO'
        ]
      );

    if (
      indiceFecha === -1
    ) {

      throw new Error(
        'No fue posible identificar la columna FECHA.'
      );
    }

    const nombresMeses = [
      '',
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

    const conteo =
      new Map<number, number>();

    for (
      let mes = 1;
      mes <= 12;
      mes++
    ) {

      conteo.set(
        mes,
        0
      );
    }

    const fechasNoInterpretadas:
      FechaNoInterpretada[] = [];

    for (
      const siniestro
      of siniestros
    ) {

      const valorFecha =
        siniestro
          .filaPrincipal[
            indiceFecha
          ];

      const fecha =
        this.convertirFechaExcel(
          valorFecha
        );

      if (!fecha) {

        fechasNoInterpretadas.push({

          caso:
            siniestro.numeroCaso,

          fila:
            siniestro.filaExcel,

          valor:
            valorFecha,

          tipo:
            typeof valorFecha
        });

        continue;
      }

      const numeroMes =
        fecha.getMonth() + 1;

      conteo.set(
        numeroMes,
        (
          conteo.get(
            numeroMes
          ) ?? 0
        ) + 1
      );
    }

    if (
      fechasNoInterpretadas.length > 0
    ) {

      console.warn(
        `FECHAS NO INTERPRETADAS: ${fechasNoInterpretadas.length}`
      );

      console.table(
        fechasNoInterpretadas
      );
    }

    return Array
      .from(
        conteo.entries()
      )
      .filter(
        (
          [, cantidad]
        ) =>
          cantidad > 0
      )
      .map(
        (
          [
            numeroMes,
            cantidad
          ]
        ) => ({

          numeroMes,

          mes:
            nombresMeses[
              numeroMes
            ],

          cantidad
        })
      );
  }


  /* =======================================================
   * FECHAS
   * ======================================================= */

  private convertirFechaExcel(
    valor: unknown
  ): Date | null {

    if (
      valor === null ||
      valor === undefined
    ) {

      return null;
    }


    if (
      valor instanceof Date
    ) {

      return isNaN(
        valor.getTime()
      )
        ? null
        : valor;
    }


    if (
      typeof valor === 'number'
    ) {

      try {

        const fechaExcel =
          XLSX.SSF.parse_date_code(
            valor
          );

        if (
          fechaExcel &&
          fechaExcel.y &&
          fechaExcel.m &&
          fechaExcel.d
        ) {

          return this.crearFechaSegura(
            fechaExcel.y,
            fechaExcel.m,
            fechaExcel.d
          );
        }

      } catch {

        return null;
      }
    }


    const texto =
      String(
        valor
      )
        .trim()
        .replace(
          /\s+/g,
          ' '
        );


    if (!texto) {

      return null;
    }


    /*
     * DD/MM/YYYY
     */
    let match =
      texto.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );


    if (
      match
    ) {

      return this.crearFechaSegura(
        Number(
          match[3]
        ),
        Number(
          match[2]
        ),
        Number(
          match[1]
        )
      );
    }


    /*
     * DD-MM-YYYY
     */
    match =
      texto.match(
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/
      );


    if (
      match
    ) {

      return this.crearFechaSegura(
        Number(
          match[3]
        ),
        Number(
          match[2]
        ),
        Number(
          match[1]
        )
      );
    }


    /*
     * YYYY-MM-DD
     */
    match =
      texto.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      );


    if (
      match
    ) {

      return this.crearFechaSegura(
        Number(
          match[1]
        ),
        Number(
          match[2]
        ),
        Number(
          match[3]
        )
      );
    }


    const fecha =
      new Date(
        texto
      );


    return isNaN(
      fecha.getTime()
    )
      ? null
      : fecha;
  }


  private crearFechaSegura(
    anio: number,
    mes: number,
    dia: number
  ): Date | null {

    if (
      anio < 1900 ||
      mes < 1 ||
      mes > 12 ||
      dia < 1 ||
      dia > 31
    ) {

      return null;
    }


    const fecha =
      new Date(
        anio,
        mes - 1,
        dia
      );


    if (
      fecha.getFullYear() !== anio ||
      fecha.getMonth() !== mes - 1 ||
      fecha.getDate() !== dia
    ) {

      return null;
    }


    return fecha;
  }


  private formatearFechaSQL(
    fecha: Date
  ): string {

    const anio =
      fecha.getFullYear();

    const mes =
      String(
        fecha.getMonth() + 1
      )
        .padStart(
          2,
          '0'
        );

    const dia =
      String(
        fecha.getDate()
      )
        .padStart(
          2,
          '0'
        );

    return `${anio}-${mes}-${dia}`;
  }


  /* =======================================================
   * COORDENADAS
   * ======================================================= */

  private parsearCoordenadas(
    valor: unknown
  ): {
    latitud: number | null;
    longitud: number | null;
  } {

    const texto =
      this.textoSeguro(
        valor
      );


    if (!texto) {

      return {
        latitud: null,
        longitud: null
      };
    }


    const numeros =
      texto.match(
        /-?\d+(?:[.,]\d+)?/g
      );


    if (
      !numeros ||
      numeros.length < 2
    ) {

      return {
        latitud: null,
        longitud: null
      };
    }


    const primero =
      Number(
        numeros[0]
          .replace(
            ',',
            '.'
          )
      );

    const segundo =
      Number(
        numeros[1]
          .replace(
            ',',
            '.'
          )
      );


    if (
      !Number.isFinite(
        primero
      ) ||
      !Number.isFinite(
        segundo
      )
    ) {

      return {
        latitud: null,
        longitud: null
      };
    }


    return {

      latitud:
        primero,

      longitud:
        segundo
    };
  }


  /* =======================================================
   * HORA
   * ======================================================= */

  private normalizarHora(
    valor: unknown
  ): string | null {

    if (
      valor === null ||
      valor === undefined
    ) {

      return null;
    }

    if (
      valor instanceof Date
    ) {

      if (
        isNaN(
          valor.getTime()
        )
      ) {

        return null;
      }

      const hora =
        String(
          valor.getHours()
        ).padStart(
          2,
          '0'
        );

      const minuto =
        String(
          valor.getMinutes()
        ).padStart(
          2,
          '0'
        );

      const segundo =
        String(
          valor.getSeconds()
        ).padStart(
          2,
          '0'
        );

      return `${hora}:${minuto}:${segundo}`;
    }

    let texto =
      String(
        valor
      ).trim();

    if (!texto) {

      return null;
    }

    texto =
      texto
        .replace(
          /[.,]/g,
          ':'
        )
        .replace(
          /\s+/g,
          ''
        );

    let match =
      texto.match(
        /^(\d{1,2}):(\d{1,2})$/
      );

    if (
      match
    ) {

      const horas =
        Number(
          match[1]
        );

      const minutos =
        Number(
          match[2]
        );

      if (
        horas < 0 ||
        horas > 23 ||
        minutos < 0 ||
        minutos > 59
      ) {

        console.warn(
          'Hora inválida descartada:',
          valor
        );

        return null;
      }

      return (
        `${String(horas).padStart(2, '0')}:` +
        `${String(minutos).padStart(2, '0')}:00`
      );
    }

    match =
      texto.match(
        /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/
      );

    if (
      match
    ) {

      const horas =
        Number(
          match[1]
        );

      const minutos =
        Number(
          match[2]
        );

      const segundos =
        Number(
          match[3]
        );

      if (
        horas < 0 ||
        horas > 23 ||
        minutos < 0 ||
        minutos > 59 ||
        segundos < 0 ||
        segundos > 59
      ) {

        console.warn(
          'Hora inválida descartada:',
          valor
        );

        return null;
      }

      return (
        `${String(horas).padStart(2, '0')}:` +
        `${String(minutos).padStart(2, '0')}:` +
        `${String(segundos).padStart(2, '0')}`
      );
    }

    match =
      texto.match(
        /^(\d{3,4})$/
      );

    if (
      match
    ) {

      const compacto =
        match[1]
          .padStart(
            4,
            '0'
          );

      const horas =
        Number(
          compacto.slice(
            0,
            2
          )
        );

      const minutos =
        Number(
          compacto.slice(
            2,
            4
          )
        );

      if (
        horas >= 0 &&
        horas <= 23 &&
        minutos >= 0 &&
        minutos <= 59
      ) {

        return (
          `${String(horas).padStart(2, '0')}:` +
          `${String(minutos).padStart(2, '0')}:00`
        );
      }
    }

    console.warn(
      'Hora no interpretada; se enviará NULL:',
      valor
    );

    return null;
  }

  /* =======================================================
   * TEXTO SEGURO
   * ======================================================= */

  private textoSeguro(
    valor: unknown
  ): string | null {

    if (
      valor === null ||
      valor === undefined
    ) {

      return null;
    }


    const texto =
      String(
        valor
      ).trim();


    if (!texto) {

      return null;
    }


    const normalizado =
      this.normalizarTexto(
        texto
      );


    const valoresSinDato =
      new Set<string>([
        '',
        '-',
        '—',
        'N/A',
        'NA',
        'N.A',
        'N.A.',
        'NO APLICA',
        'NO APLICABLE',
        'NO REGISTRA',
        'NO REGISTRADO',
        'NO REGISTRADA',
        'SIN REGISTRO',
        'SIN INFORMACION',
        'SIN INFORMACIÓN'
      ]);


    if (
      valoresSinDato.has(
        normalizado
      )
    ) {

      return null;
    }


    return texto;
  }


  /* =======================================================
   * NÚMERO SEGURO
   * ======================================================= */

  private numeroSeguro(
    valor: unknown
  ): number | null {

    const texto =
      this.textoSeguro(
        valor
      );


    if (!texto) {

      return null;
    }


    const limpio =
      texto
        .replace(
          /\s/g,
          ''
        )
        .replace(
          ',',
          '.'
        );


    const numero =
      Number(
        limpio
      );


    return Number.isFinite(
      numero
    )
      ? numero
      : null;
  }


  /* =======================================================
   * EDAD SEGURA
   * =======================================================
   *
   * La tabla public.siniestros_personas tiene:
   *
   * CHECK (
   *   edad IS NULL
   *   OR (edad >= 0 AND edad <= 120)
   * )
   *
   * Por eso cualquier valor fuera de 0..120 debe
   * considerarse dato inválido del Excel y enviarse NULL.
   *
   * También rechazamos valores decimales porque la columna
   * edad es smallint.
   * ======================================================= */

  private edadSegura(
    valor: unknown,
    numeroCaso?: string,
    tipoActor?: string,
    numeroVehiculo?: number | null
  ): number | null {

    const numero =
      this.numeroSeguro(
        valor
      );

    if (
      numero === null
    ) {

      return null;
    }

    if (
      !Number.isInteger(
        numero
      ) ||
      numero < 0 ||
      numero > 120
    ) {

      console.warn(
        'EDAD DESCARTADA POR ESTAR FUERA DEL RANGO 0-120:',
        {
          caso:
            numeroCaso ?? null,

          tipoActor:
            tipoActor ?? null,

          numeroVehiculo:
            numeroVehiculo ?? null,

          valorOriginal:
            valor,

          edadInterpretada:
            numero
        }
      );

      return null;
    }

    return numero;
  }


  /* =======================================================
   * FILAS
   * ======================================================= */

  private filaTieneContenido(
    fila: any[]
  ): boolean {

    return fila.some(
      valor =>
        valor !== null &&
        valor !== undefined &&
        String(
          valor
        ).trim() !== ''
    );
  }


  /* =======================================================
   * ENCABEZADOS
   * ======================================================= */

  private detectarFilaEncabezados(
    filas: any[][]
  ): number {

    const palabrasClave = [
      'CASO',
      'FECHA',
      'HORA',
      'DIRECCION',
      'BARRIO',
      'ACCIDENTE',
      'VEHICULO',
      'CONDUCTOR',
      'SEXO',
      'EDAD',
      'LONGITUD',
      'LATITUD'
    ];


    const limite =
      Math.min(
        filas.length,
        40
      );


    let mejorIndice = -1;

    let mejorPuntaje = 0;


    for (
      let indice = 0;
      indice < limite;
      indice++
    ) {

      const fila =
        filas[
          indice
        ];


      if (!fila) {

        continue;
      }


      const valores =
        fila
          .map(
            valor =>
              this.normalizarTexto(
                valor
              )
          )
          .filter(
            valor =>
              valor !== ''
          );


      let puntaje = 0;


      for (
        const palabra
        of palabrasClave
      ) {

        if (
          valores.some(
            valor =>
              valor.includes(
                palabra
              )
          )
        ) {

          puntaje++;
        }
      }


      if (
        valores.length >= 10
      ) {

        puntaje += 2;
      }


      if (
        valores.length >= 20
      ) {

        puntaje += 2;
      }


      if (
        valores.length >= 40
      ) {

        puntaje += 3;
      }


      if (
        puntaje >
        mejorPuntaje
      ) {

        mejorPuntaje =
          puntaje;

        mejorIndice =
          indice;
      }
    }


    return mejorPuntaje >= 4
      ? mejorIndice
      : -1;
  }


  private validarEncabezados(
    encabezados: string[]
  ): void {

    const cantidad =
      encabezados.filter(
        encabezado =>
          encabezado !== ''
      ).length;


    if (
      cantidad < 10
    ) {

      throw new Error(
        'La fila detectada como encabezados no contiene suficientes columnas.'
      );
    }


    console.log(
      'Cantidad de encabezados reales:',
      cantidad
    );
  }


  private buscarIndiceEncabezado(
    encabezados: string[],
    nombres: string[]
  ): number {

    /*
     * Exacto
     */
    for (
      const nombre
      of nombres
    ) {

      const normalizado =
        this.normalizarTexto(
          nombre
        );


      const indice =
        encabezados.findIndex(
          encabezado =>
            encabezado ===
            normalizado
        );


      if (
        indice >= 0
      ) {

        return indice;
      }
    }


    /*
     * Parcial
     */
    for (
      const nombre
      of nombres
    ) {

      const normalizado =
        this.normalizarTexto(
          nombre
        );


      const indice =
        encabezados.findIndex(
          encabezado =>
            encabezado.includes(
              normalizado
            )
        );


      if (
        indice >= 0
      ) {

        return indice;
      }
    }


    return -1;
  }


  /* =======================================================
   * PREVIEW
   * ======================================================= */

  private mapearPreview(
    fila: any[],
    encabezados: string[],
    numeroFila: number
  ): RegistroPreview {

    const obtener = (
      nombres: string[]
    ): unknown => {

      const indice =
        this.buscarIndiceEncabezado(
          encabezados,
          nombres
        );


      return indice >= 0
        ? fila[
            indice
          ]
        : null;
    };


    return {

      fila:
        numeroFila,

      numeroCaso:
        this.valorVisible(
          obtener([
            'NO. DE CASOS',
            'NO DE CASOS',
            'NUMERO DE CASO',
            'CASO'
          ])
        ),

      fecha:
        this.valorVisible(
          obtener([
            'FECHA'
          ])
        ),

      hora:
        this.valorVisible(
          obtener([
            'HORA'
          ])
        ),

      claseAccidente:
        this.valorVisible(
          obtener([
            'CLASE DE ACCIDENTE'
          ])
        ),

      gravedad:
        this.valorVisible(
          obtener([
            'GRAVEDAD DEL ACCIDENTE'
          ])
        ),

      direccion:
        this.valorVisible(
          obtener([
            'DIRECCION_HECHO'
          ])
        ),

      barrio:
        this.valorVisible(
          obtener([
            'BARRIO_HECHO'
          ])
        ),

      coordenadas:
        this.valorVisible(
          obtener([
            'LONGITUD LATITUD'
          ])
        )
    };
  }


  /* =======================================================
   * NORMALIZAR
   * ======================================================= */

  private normalizarTexto(
    valor: unknown
  ): string {

    return String(
      valor ?? ''
    )
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .trim()
      .replace(
        /\s+/g,
        ' '
      )
      .toUpperCase();
  }


  private valorVisible(
    valor: unknown
  ): string {

    if (
      valor === null ||
      valor === undefined ||
      String(
        valor
      ).trim() === ''
    ) {

      return '—';
    }


    return String(
      valor
    ).trim();
  }


  /* =======================================================
   * LIMPIAR
   * ======================================================= */

  limpiarArchivo(
    input?: HTMLInputElement
  ): void {

    this.archivoSeleccionado =
      null;

    this.nombreArchivo =
      '';

    this.limpiarResultado();


    if (
      input
    ) {

      input.value =
        '';
    }
  }


  private limpiarResultado(): void {

    this.archivoValido =
      false;

    this.cargandoSupabase =
      false;

    this.cargaCompletada =
      false;

    this.mensajeError =
      '';

    this.mensajeExito =
      '';

    this.mensajeCargaError =
      '';

    this.totalRegistros =
      0;

    this.totalFilasExcel =
      0;

    this.totalDistribucionMensual =
      0;

    this.registrosPreview =
      [];

    this.siniestrosParseados =
      [];

    this.encabezadosActuales =
      [];

    this.distribucionMensual =
      [];

    this.siniestrosParaInsertar =
      [];

    this.vehiculosParaInsertar =
      [];

    this.personasParaInsertar =
      [];

    this.hipotesisParaInsertar =
      [];
  }


  /* =======================================================
   * BOTÓN PROCESAR
   * ======================================================= */

  async iniciarCarga(): Promise<void> {

    if (this.cargandoSupabase) {
      return;
    }

    console.log(
      '======================================'
    );

    console.log(
      'CLICK EN PROCESAR CARGA'
    );

    console.log(
      '======================================'
    );

    if (
      !this.archivoSeleccionado
    ) {

      this.mensajeError =
        'Debes seleccionar un archivo.';

      return;
    }

    if (
      !this.anioSeleccionado
    ) {

      this.mensajeError =
        'Debes seleccionar el año.';

      return;
    }

    if (
      !this.archivoValido
    ) {

      this.mensajeError =
        'El archivo debe ser validado antes de realizar la carga.';

      return;
    }

    if (
      this.siniestrosParaInsertar.length === 0
    ) {

      this.mensajeError =
        'No existen siniestros preparados para cargar.';

      return;
    }


    /*
     * Protección de integridad:
     * no se permite enviar a Supabase un siniestro
     * cuya fecha no haya podido ser interpretada.
     */
    const siniestrosSinFecha =
      this.siniestrosParaInsertar.filter(
        siniestro =>
          !siniestro.fecha
      );


    if (
      siniestrosSinFecha.length > 0
    ) {

      console.error(
        'Siniestros sin fecha detectados:',
        siniestrosSinFecha
      );

      this.mensajeError =
        `La carga fue detenida porque existen ` +
        `${siniestrosSinFecha.length} siniestros sin fecha válida. ` +
        `Revisa el archivo antes de continuar.`;

      return;
    }


    /*
     * Determinamos el período directamente desde las fechas
     * válidas encontradas en el Excel.
     *
     * - Si hay un único mes: MENSUAL
     * - Si hay varios meses: INICIAL
     *
     * En este punto todos los siniestros deben tener
     * una fecha válida.
     */
    const mesesConDatos =
      this.distribucionMensual
        .map(
          item =>
            item.numeroMes
        )
        .sort(
          (
            a,
            b
          ) =>
            a - b
        );

    if (
      mesesConDatos.length === 0
    ) {

      this.mensajeError =
        'No fue posible determinar el período contenido en el archivo.';

      return;
    }

    const mesDesde =
      mesesConDatos[0];

    const mesHasta =
      mesesConDatos[
        mesesConDatos.length - 1
      ];

    const esCargaInicial =
      mesesConDatos.length > 1;

    const tipoCarga =
      esCargaInicial
        ? 'INICIAL'
        : 'MENSUAL';

    /*
     * En siniestros_cargas.mes guardamos:
     * - para INICIAL: el mes de corte (mesHasta)
     * - para MENSUAL: el mes real del archivo
     */
    const mesCarga =
      mesHasta;

    /*
     * En una carga mensual sí validamos el selector,
     * si el usuario eligió uno.
     */
    if (
      !esCargaInicial &&
      this.mesSeleccionado &&
      Number(
        this.mesSeleccionado
      ) !== mesCarga
    ) {

      const mesArchivo =
        this.meses.find(
          mes =>
            Number(
              mes.valor
            ) === mesCarga
        )?.nombre ??
        `Mes ${mesCarga}`;

      const mesElegido =
        this.meses.find(
          mes =>
            Number(
              mes.valor
            ) === Number(
              this.mesSeleccionado
            )
        )?.nombre ??
        this.mesSeleccionado;

      this.mensajeError =
        `El archivo contiene datos de ${mesArchivo}, ` +
        `pero seleccionaste ${mesElegido}.`;

      return;
    }

    /*
     * Protección adicional de integridad antes de invocar
     * la transacción en Supabase.
     */
    const conductoresSinVehiculo =
      this.personasParaInsertar.filter(
        persona => {

          if (
            persona.tipo_actor !==
              'CONDUCTOR' ||
            persona.numeroVehiculo === null
          ) {

            return false;
          }

          return !this.vehiculosParaInsertar.some(
            vehiculo =>
              vehiculo.numeroCaso ===
                persona.numeroCaso &&
              vehiculo.numero_vehiculo ===
                persona.numeroVehiculo
          );
        }
      );

    if (
      conductoresSinVehiculo.length > 0
    ) {

      console.error(
        'Conductores sin vehículo detectados:',
        conductoresSinVehiculo
      );

      this.mensajeError =
        'La carga fue detenida porque existen conductores sin vehículo asociado.';

      return;
    }

    this.cargandoSupabase =
      true;

    this.mensajeError =
      '';

    this.mensajeExito =
      '';

    this.mensajeCargaError =
      '';

    try {

      console.log(
        '======================================'
      );

      console.log(
        'INICIANDO CARGA EN SUPABASE'
      );

      console.log(
        '======================================'
      );

      console.log(
        'Tipo:',
        tipoCarga
      );

      console.log(
        'Año:',
        this.anioSeleccionado
      );

      console.log(
        'Mes desde:',
        mesDesde
      );

      console.log(
        'Mes hasta:',
        mesHasta
      );

      console.log(
        'Mes de corte:',
        mesCarga
      );

      console.log(
        'Siniestros:',
        this.siniestrosParaInsertar.length
      );

      console.log(
        'Vehículos:',
        this.vehiculosParaInsertar.length
      );

      console.log(
        'Personas:',
        this.personasParaInsertar.length
      );

      console.log(
        'Hipótesis:',
        this.hipotesisParaInsertar.length
      );

      const edadesInvalidas =
        this.personasParaInsertar.filter(
          persona =>
            persona.edad !== null &&
            (
              !Number.isInteger(
                persona.edad
              ) ||
              persona.edad < 0 ||
              persona.edad > 120
            )
        );

      console.log(
        'EDADES INVÁLIDAS ANTES DE SUPABASE:',
        edadesInvalidas.length
      );

      if (
        edadesInvalidas.length > 0
      ) {

        console.table(
          edadesInvalidas
        );

        throw new Error(
          `La carga fue detenida porque aún existen ${edadesInvalidas.length} edades fuera del rango permitido (0 a 120).`
        );
      }


      const {
        data,
        error
      } =
        await this.supabase.rpc(
          'cargar_siniestros_viales',
          {
            p_anio:
              this.anioSeleccionado,

            p_mes:
              mesCarga,

            p_tipo_carga:
              tipoCarga,

            p_mes_desde:
              mesDesde,

            p_mes_hasta:
              mesHasta,

            p_nombre_archivo:
              this.archivoSeleccionado.name,

            p_siniestros:
              this.siniestrosParaInsertar,

            p_vehiculos:
              this.vehiculosParaInsertar,

            p_personas:
              this.personasParaInsertar,

            p_hipotesis:
              this.hipotesisParaInsertar
          }
        );

      if (
        error
      ) {

        console.error(
          'ERROR RPC SUPABASE:',
          error
        );

        throw new Error(
          error.message
        );
      }

      const resultado =
        data as {
          ok?: boolean;
          carga_id?: number;
          siniestros?: number;
          vehiculos?: number;
          personas?: number;
          hipotesis?: number;
        } | null;

      console.log(
        'RESPUESTA SUPABASE:',
        resultado
      );

      if (
        !resultado?.ok
      ) {

        throw new Error(
          'Supabase no confirmó correctamente la transacción.'
        );
      }

      if (
        resultado.siniestros !==
        this.siniestrosParaInsertar.length
      ) {

        throw new Error(
          `La carga respondió con ${resultado.siniestros ?? 0} siniestros, ` +
          `pero se esperaban ${this.siniestrosParaInsertar.length}.`
        );
      }

      this.cargaCompletada =
        true;

      this.mensajeExito =
        `Carga completada. ` +
        `${resultado.siniestros ?? 0} siniestros, ` +
        `${resultado.vehiculos ?? 0} vehículos, ` +
        `${resultado.personas ?? 0} personas y ` +
        `${resultado.hipotesis ?? 0} hipótesis fueron registrados.`;

      console.log(
        '======================================'
      );

      console.log(
        'CARGA COMPLETADA CORRECTAMENTE'
      );

      console.log(
        'Carga ID:',
        resultado.carga_id
      );

      console.log(
        '======================================'
      );

    } catch (error) {

      this.cargaCompletada =
        false;

      console.error(
        'ERROR DURANTE LA CARGA:',
        error
      );

      this.mensajeCargaError =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado durante la carga.';

    } finally {

      this.cargandoSupabase =
        false;

      this.cdr.detectChanges();
    }
  }
}
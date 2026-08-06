import type {
  WazeAlertaActual,
  WazeAtascoActual,
  WazeFeedResponse,
  WazeResumenHistorico
} from './types.ts';

/**
 * Convierte una fecha expresada por Waze en milisegundos
 * a una fecha ISO compatible con PostgreSQL.
 */
function millisToIso(value?: number): string | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return new Date(value).toISOString();
}

/**
 * Devuelve un número válido o null.
 */
function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : null;
}

/**
 * Convierte los atascos de Waze en registros pequeños.
 *
 * No almacena los segmentos completos porque son pesados.
 * Solamente conserva la línea geográfica necesaria para
 * representar posteriormente el atasco sobre un mapa.
 */
export function parseAtascos(
  feed: WazeFeedResponse
): WazeAtascoActual[] {
  const actualizadoEn = new Date().toISOString();

  const jams = Array.isArray(feed.jams)
    ? feed.jams
    : [];

  return jams
    .filter((jam) => typeof jam.uuid === 'string')
    .map((jam): WazeAtascoActual => ({
      uuid: jam.uuid,

      id_waze: numberOrNull(jam.id),

      ciudad: typeof jam.city === 'string'
        ? jam.city
        : null,

      pais: typeof jam.country === 'string'
        ? jam.country
        : null,

      calle: typeof jam.street === 'string'
        ? jam.street
        : null,

      nodo_inicial: typeof jam.startNode === 'string'
        ? jam.startNode
        : null,

      nodo_final: typeof jam.endNode === 'string'
        ? jam.endNode
        : null,

      velocidad_mps: numberOrNull(jam.speed),
      velocidad_kmh: numberOrNull(jam.speedKMH),
      longitud_metros: numberOrNull(jam.length),
      retraso_segundos: numberOrNull(jam.delay),
      nivel_congestion: numberOrNull(jam.level),

      tipo_via: numberOrNull(jam.roadType),

      tipo_giro: typeof jam.turnType === 'string'
        ? jam.turnType
        : null,

      geometria: Array.isArray(jam.line)
        ? jam.line.map((point) => ({
            x: point.x,
            y: point.y
          }))
        : null,

      publicado_en: millisToIso(jam.pubMillis),
      actualizado_en: actualizadoEn
    }));
}

/**
 * Convierte las alertas del feed en registros pequeños.
 */
export function parseAlertas(
  feed: WazeFeedResponse
): WazeAlertaActual[] {
  const actualizadoEn = new Date().toISOString();

  const alerts = Array.isArray(feed.alerts)
    ? feed.alerts
    : [];

  return alerts
    .filter((alert) => typeof alert.uuid === 'string')
    .map((alert): WazeAlertaActual => ({
      uuid: alert.uuid,

      tipo: typeof alert.type === 'string'
        ? alert.type
        : null,

      subtipo: typeof alert.subtype === 'string'
        ? alert.subtype
        : null,

      ciudad: typeof alert.city === 'string'
        ? alert.city
        : null,

      calle: typeof alert.street === 'string'
        ? alert.street
        : null,

      /*
       * En el feed de Waze:
       * x corresponde a longitud.
       * y corresponde a latitud.
       */
      longitud: numberOrNull(alert.location?.x),
      latitud: numberOrNull(alert.location?.y),

      confianza: numberOrNull(alert.confidence),
      confiabilidad: numberOrNull(alert.reliability),

      calificacion_reporte: numberOrNull(
        alert.reportRating
      ),

      reportado_por_municipio:
        typeof alert.reportByMunicipalityUser === 'boolean'
          ? alert.reportByMunicipalityUser
          : null,

      publicado_en: millisToIso(alert.pubMillis),
      actualizado_en: actualizadoEn
    }));
}

/**
 * Calcula los indicadores generales que alimentarán
 * las gráficas históricas.
 */
export function buildResumen(
  feed: WazeFeedResponse
): WazeResumenHistorico {
  const atascos = parseAtascos(feed);
  const alertas = parseAlertas(feed);

  const irregularidades = Array.isArray(
    feed.irregularities
  )
    ? feed.irregularities
    : [];

  const velocidades = atascos
    .map((atasco) => atasco.velocidad_kmh)
    .filter((value): value is number => value !== null);

  const retrasos = atascos
    .map((atasco) => atasco.retraso_segundos)
    .filter((value): value is number => value !== null);

  const niveles = atascos
    .map((atasco) => atasco.nivel_congestion)
    .filter((value): value is number => value !== null);

  const longitudes = atascos
    .map((atasco) => atasco.longitud_metros)
    .filter((value): value is number => value !== null);

  const alertasPorTipo = alertas.reduce<Record<string, number>>(
    (accumulator, alerta) => {
      const tipo = alerta.tipo ?? 'SIN_TIPO';

      accumulator[tipo] =
        (accumulator[tipo] ?? 0) + 1;

      return accumulator;
    },
    {}
  );

  return {
    fecha_hora: new Date().toISOString(),

    total_atascos: atascos.length,
    total_alertas: alertas.length,
    total_irregularidades: irregularidades.length,

    velocidad_promedio_kmh: average(velocidades),
    retraso_promedio_segundos: average(retrasos),

    longitud_congestionada_metros:
      longitudes.length > 0
        ? longitudes.reduce(
            (total, value) => total + value,
            0
          )
        : null,

    nivel_promedio_congestion: average(niveles),

    alertas_por_tipo: alertasPorTipo
  };
}

/**
 * Calcula un promedio y devuelve null cuando no existen datos.
 */
function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce(
    (accumulator, value) => accumulator + value,
    0
  );

  return Number((total / values.length).toFixed(2));
}
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
function millisToIso(
  value: unknown
): string | null {
  const milliseconds =
    numberOrNull(value);

  if (milliseconds === null) {
    return null;
  }

  const date =
    new Date(milliseconds);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

/**
 * Devuelve un número válido o null.
 *
 * También acepta números enviados como texto,
 * porque algunos campos del feed pueden cambiar
 * de representación.
 */
function numberOrNull(
  value: unknown
): number | null {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim() !== ''
  ) {
    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

/**
 * Devuelve un texto no vacío o null.
 */
function stringOrNull(
  value: unknown
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

/**
 * Convierte identificadores numéricos o textuales
 * en un string válido para PostgreSQL.
 */
function identifierOrNull(
  value: unknown
): string | null {
  if (
    typeof value === 'string' &&
    value.trim() !== ''
  ) {
    return value.trim();
  }

  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return null;
}

/**
 * Convierte una coordenada del trazado de un atasco
 * en un punto válido.
 */
function parseGeometryPoint(
  point: unknown
): {
  x: number;
  y: number;
} | null {
  if (
    typeof point !== 'object' ||
    point === null
  ) {
    return null;
  }

  const record =
    point as Record<string, unknown>;

  const x =
    numberOrNull(record['x']);

  const y =
    numberOrNull(record['y']);

  if (
    x === null ||
    y === null
  ) {
    return null;
  }

  return {
    x,
    y
  };
}

/**
 * Convierte los atascos de Waze en registros
 * compatibles con la base de datos.
 */
export function parseAtascos(
  feed: WazeFeedResponse
): WazeAtascoActual[] {
  const actualizadoEn =
    new Date().toISOString();

  const jams =
    Array.isArray(feed.jams)
      ? feed.jams
      : [];

  return jams
    .map((jam) => {
      /*
       * Waze puede entregar uuid como string o número.
       * Si uuid no está disponible, usamos id como respaldo.
       */
      const uuid =
        identifierOrNull(jam.uuid) ??
        identifierOrNull(jam.id);

      if (!uuid) {
        return null;
      }

      const geometria =
        Array.isArray(jam.line)
          ? jam.line
              .map(
                (
                  point
                ) =>
                  parseGeometryPoint(
                    point
                  )
              )
              .filter(
                (
                  point
                ): point is {
                  x: number;
                  y: number;
                } =>
                  point !== null
              )
          : [];

      const atasco:
        WazeAtascoActual = {
          uuid,

          id_waze:
            numberOrNull(jam.id),

          ciudad:
            stringOrNull(jam.city),

          pais:
            stringOrNull(jam.country),

          calle:
            stringOrNull(jam.street),

          nodo_inicial:
            stringOrNull(
              jam.startNode
            ),

          nodo_final:
            stringOrNull(
              jam.endNode
            ),

          velocidad_mps:
            numberOrNull(
              jam.speed
            ),

          velocidad_kmh:
            numberOrNull(
              jam.speedKMH
            ),

          longitud_metros:
            numberOrNull(
              jam.length
            ),

          retraso_segundos:
            numberOrNull(
              jam.delay
            ),

          nivel_congestion:
            numberOrNull(
              jam.level
            ),

          tipo_via:
            numberOrNull(
              jam.roadType
            ),

          tipo_giro:
            stringOrNull(
              jam.turnType
            ),

          geometria:
            geometria.length > 0
              ? geometria
              : null,

          publicado_en:
            millisToIso(
              jam.pubMillis
            ),

          actualizado_en:
            actualizadoEn
        };

      return atasco;
    })
    .filter(
      (
        atasco
      ): atasco is WazeAtascoActual =>
        atasco !== null
    );
}

/**
 * Convierte las alertas del feed en registros
 * compatibles con la base de datos.
 */
export function parseAlertas(
  feed: WazeFeedResponse
): WazeAlertaActual[] {
  const actualizadoEn =
    new Date().toISOString();

  const alerts =
    Array.isArray(feed.alerts)
      ? feed.alerts
      : [];

  return alerts
    .map((alert) => {
      const uuid =
        identifierOrNull(
          alert.uuid
        );

      if (!uuid) {
        return null;
      }

      const alerta:
        WazeAlertaActual = {
          uuid,

          tipo:
            stringOrNull(
              alert.type
            ),

          subtipo:
            stringOrNull(
              alert.subtype
            ),

          ciudad:
            stringOrNull(
              alert.city
            ),

          calle:
            stringOrNull(
              alert.street
            ),

          /*
           * En el feed de Waze:
           * x corresponde a longitud.
           * y corresponde a latitud.
           */
          longitud:
            numberOrNull(
              alert.location?.x
            ),

          latitud:
            numberOrNull(
              alert.location?.y
            ),

          confianza:
            numberOrNull(
              alert.confidence
            ),

          confiabilidad:
            numberOrNull(
              alert.reliability
            ),

          calificacion_reporte:
            numberOrNull(
              alert.reportRating
            ),

          reportado_por_municipio:
            typeof alert
              .reportByMunicipalityUser ===
            'boolean'
              ? alert
                  .reportByMunicipalityUser
              : null,

          publicado_en:
            millisToIso(
              alert.pubMillis
            ),

          actualizado_en:
            actualizadoEn
        };

      return alerta;
    })
    .filter(
      (
        alerta
      ): alerta is WazeAlertaActual =>
        alerta !== null
    );
}

/**
 * Calcula los indicadores generales que alimentan
 * los KPI y las gráficas históricas.
 */
export function buildResumen(
  feed: WazeFeedResponse
): WazeResumenHistorico {
  const atascos =
    parseAtascos(feed);

  const alertas =
    parseAlertas(feed);

  const irregularidades =
    Array.isArray(
      feed.irregularities
    )
      ? feed.irregularities
      : [];

  /*
   * Atascos reportados:
   * cantidad de registros válidos procesados.
   */
  const totalAtascos =
    atascos.length;

  /*
   * Alertas vigentes:
   * cantidad de alertas válidas procesadas.
   */
  const totalAlertas =
    alertas.length;

  /*
   * Velocidad promedio:
   * promedio de speedKMH de los atascos.
   */
  const velocidades =
    atascos
      .map(
        (atasco) =>
          atasco.velocidad_kmh
      )
      .filter(
        (
          value
        ): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  /*
   * Retraso promedio:
   * promedio del campo delay.
   */
  const retrasos =
    atascos
      .map(
        (atasco) =>
          atasco.retraso_segundos
      )
      .filter(
        (
          value
        ): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  /*
   * Nivel promedio de congestión:
   * promedio del campo level.
   */
  const niveles =
    atascos
      .map(
        (atasco) =>
          atasco.nivel_congestion
      )
      .filter(
        (
          value
        ): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  /*
   * Longitud congestionada:
   * suma del campo length de todos los atascos.
   */
  const longitudes =
    atascos
      .map(
        (atasco) =>
          atasco.longitud_metros
      )
      .filter(
        (
          value
        ): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  const alertasPorTipo =
    alertas.reduce<
      Record<string, number>
    >(
      (
        accumulator,
        alerta
      ) => {
        const tipo =
          alerta.tipo ??
          'SIN_TIPO';

        accumulator[tipo] =
          (
            accumulator[tipo] ??
            0
          ) + 1;

        return accumulator;
      },
      {}
    );

  return {
    fecha_hora:
      new Date().toISOString(),

    total_atascos:
      totalAtascos,

    total_alertas:
      totalAlertas,

    total_irregularidades:
      irregularidades.length,

    velocidad_promedio_kmh:
      average(velocidades),

    retraso_promedio_segundos:
      average(retrasos),

    longitud_congestionada_metros:
      sumOrNull(longitudes),

    nivel_promedio_congestion:
      average(niveles),

    alertas_por_tipo:
      alertasPorTipo
  };
}

/**
 * Calcula un promedio y devuelve null
 * cuando no existen valores válidos.
 */
function average(
  values: number[]
): number | null {
  if (values.length === 0) {
    return null;
  }

  const total =
    values.reduce(
      (
        accumulator,
        value
      ) =>
        accumulator + value,
      0
    );

  return Number(
    (
      total /
      values.length
    ).toFixed(2)
  );
}

/**
 * Suma valores y devuelve null
 * cuando no hay información disponible.
 */
function sumOrNull(
  values: number[]
): number | null {
  if (values.length === 0) {
    return null;
  }

  const total =
    values.reduce(
      (
        accumulator,
        value
      ) =>
        accumulator + value,
      0
    );

  return Number(
    total.toFixed(2)
  );
}
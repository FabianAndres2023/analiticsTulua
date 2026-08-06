/**
 * Tipos recibidos directamente desde el Waze Data Feed.
 *
 * Algunos campos pueden no aparecer en todos los registros,
 * por eso varias propiedades son opcionales.
 */

export interface WazeLocation {
  x: number;
  y: number;
}

export interface WazeLinePoint {
  x: number;
  y: number;
}

export interface WazeSegment {
  fromNode?: number;
  toNode?: number;
  isForward?: boolean;
  ID?: number;
}

export interface WazeAlert {
  uuid: string;

  type?: string;
  subtype?: string;

  pubMillis?: number;

  location?: WazeLocation;

  street?: string;
  city?: string;
  country?: string;

  reportByMunicipalityUser?: boolean;
  reportRating?: number;
  confidence?: number;
  reliability?: number;

  magvar?: number;

  /**
   * Conserva el objeto original por si Waze agrega
   * temporalmente campos que todavía no procesamos.
   */
  [key: string]: unknown;
}

export interface WazeJam {
  uuid: string;
  id?: number;

  line?: WazeLinePoint[];

  speed?: number;
  speedKMH?: number;

  length?: number;
  delay?: number;
  level?: number;

  segments?: WazeSegment[];

  endNode?: string;
  startNode?: string;

  street?: string;
  city?: string;
  country?: string;

  roadType?: number;
  pubMillis?: number;
  turnType?: string;

  [key: string]: unknown;
}

export interface WazeIrregularity {
  uuid: string;

  type?: string;
  subtype?: string;

  street?: string;
  city?: string;
  country?: string;

  speed?: number;
  speedKMH?: number;
  regularSpeed?: number;

  delaySeconds?: number;
  seconds?: number;

  length?: number;
  level?: number;

  location?: WazeLocation;
  line?: WazeLinePoint[];

  pubMillis?: number;

  [key: string]: unknown;
}

export interface WazeFeedResponse {
  alerts?: WazeAlert[];
  jams?: WazeJam[];
  irregularities?: WazeIrregularity[];

  /**
   * Permite tolerar nuevas colecciones agregadas por Waze
   * sin romper la sincronización.
   */
  [key: string]: unknown;
}

/**
 * Datos que sí almacenaremos en Supabase.
 * Se excluyen objetos pesados que no son necesarios
 * para las gráficas principales.
 */

export interface WazeAtascoActual {
  uuid: string;
  id_waze: number | null;

  ciudad: string | null;
  pais: string | null;
  calle: string | null;
  nodo_inicial: string | null;
  nodo_final: string | null;

  velocidad_mps: number | null;
  velocidad_kmh: number | null;
  longitud_metros: number | null;
  retraso_segundos: number | null;
  nivel_congestion: number | null;

  tipo_via: number | null;
  tipo_giro: string | null;

  geometria: WazeLinePoint[] | null;

  publicado_en: string | null;
  actualizado_en: string;
}

export interface WazeAlertaActual {
  uuid: string;

  tipo: string | null;
  subtipo: string | null;

  ciudad: string | null;
  calle: string | null;

  longitud: number | null;
  latitud: number | null;

  confianza: number | null;
  confiabilidad: number | null;
  calificacion_reporte: number | null;
  reportado_por_municipio: boolean | null;

  publicado_en: string | null;
  actualizado_en: string;
}

export interface WazeResumenHistorico {
  fecha_hora: string;

  total_atascos: number;
  total_alertas: number;
  total_irregularidades: number;

  velocidad_promedio_kmh: number | null;
  retraso_promedio_segundos: number | null;
  longitud_congestionada_metros: number | null;
  nivel_promedio_congestion: number | null;

  alertas_por_tipo: Record<string, number>;
}
export interface WazeEstadoActual {
  totalAtascos: number;
  totalAlertas: number;
  totalIrregularidades: number;

  actividadVialActual: number;

  velocidadPromedioKmh: number | null;
  retrasoPromedioSegundos: number | null;
  longitudCongestionadaMetros: number | null;
  nivelPromedioCongestion: number | null;
}

export interface WazePuntoGeografico {
  x: number;
  y: number;
}

export interface WazeAtasco {
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

  geometria: WazePuntoGeografico[] | null;

  publicado_en: string | null;
  actualizado_en: string;
}

export interface WazeAlerta {
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

  actividad_vial: number;

  velocidad_promedio_kmh: number | null;
  retraso_promedio_segundos: number | null;
  longitud_congestionada_metros: number | null;
  nivel_promedio_congestion: number | null;

  alertas_por_tipo: Record<string, number>;
}

export interface WazeUltimaSincronizacion {
  iniciado_en: string;
  finalizado_en: string | null;

  estado: string;
  mensaje: string | null;

  total_atascos: number;
  total_alertas: number;
  total_irregularidades: number;
}

export interface WazeDashboardResponse {
  success: boolean;

  estadoActual: WazeEstadoActual;

  atascos: WazeAtasco[];
  alertas: WazeAlerta[];
  historico: WazeResumenHistorico[];

  ultimaSincronizacion:
    | WazeUltimaSincronizacion
    | null;

  generadoEn: string;
}
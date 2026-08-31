export interface EstadoActual {
  device_id: string;
  medido_en: string;

  temperatura: number | null;
  humedad_relativa: number | null;
  presion: number | null;
  precipitacion: number | null;

  viento_velocidad: number | null;
  viento_direccion: number | null;

  indice_uv: number | null;
  nubosidad: number | null;

  data_source: number | null;
  data_source_name: string | null;

  tiempo_desde_ultimo_dato: string;
  estado: string;
}

export interface SerieTemporal {
  periodo: string;

  temperatura: number | null;
  humedad_relativa: number | null;
  presion: number | null;
  precipitacion: number | null;

  viento_velocidad: number | null;

  indice_uv: number | null;
  nubosidad: number | null;
}

export interface ResumenEstacion {
  temperatura_minima: number | null;
  temperatura_maxima: number | null;

  humedad_minima: number | null;
  humedad_maxima: number | null;

  precipitacion_acumulada: number | null;

  viento_maximo: number | null;

  uv_maximo: number | null;

  presion_minima: number | null;
  presion_maxima: number | null;

  presion_inicial: number | null;
  presion_final: number | null;

  variacion_presion: number | null;
}


export interface RosaVientoItem {
  direccion: string;
  direccion_grados: number;

  registros: number;

  porcentaje: number;

  velocidad_promedio: number | null;
  velocidad_maxima: number | null;
}

export interface PrecipitacionDiariaItem {
  fecha: string;
  precipitacion: number;
}

export interface ExtremoTemperaturaDiariaItem {
  fecha: string;
  temperatura_minima: number;
  temperatura_maxima: number;
}

export interface DashboardResponse {
  estado_actual: EstadoActual | null;
  resumen: ResumenEstacion | null;
  serie: SerieTemporal[];
  rosa_vientos: RosaVientoItem[];
  precipitacion_diaria: PrecipitacionDiariaItem[];
  extremos_temperatura_diaria: ExtremoTemperaturaDiariaItem[];
}
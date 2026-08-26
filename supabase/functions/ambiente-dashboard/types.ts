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

export interface DashboardResponse {
  estado_actual: EstadoActual | null;
  serie: SerieTemporal[];
}
export interface TtnWebhookPayload {
  end_device_ids?: {
    device_id?: string;
    application_ids?: {
      application_id?: string;
    };
    dev_eui?: string;
  };

  received_at?: string;

  uplink_message?: {
    f_port?: number;
    f_cnt?: number;
    frm_payload?: string;

    decoded_payload?: {
      uv?: number;
      hum?: number;
      rain?: number;
      temp?: number;
      press?: number;
      windDir?: number;
      windSpd?: number;
      cloudCover?: number;
      dataSource?: number;
      dataSourceName?: string;

      [key: string]: unknown;
    };

    received_at?: string;

    rx_metadata?: Array<{
      gateway_ids?: {
        gateway_id?: string;
      };

      rssi?: number;
      snr?: number;
    }>;
  };
}

export interface UplinkRawRow {
  application_id: string | null;
  device_id: string;
  dev_eui: string | null;

  f_port: number | null;
  f_cnt: number | null;

  recibido_en: string | null;

  frm_payload: string | null;

  decoded_payload:
    | Record<string, unknown>
    | null;

  rssi: number | null;
  snr: number | null;
  gateway_id: string | null;

  event_key: string;

  payload: TtnWebhookPayload;
}

export interface MedicionRow {
  uplink_id: number;

  application_id: string;
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
}
import { createClient } from "npm:@supabase/supabase-js@2";

import type {
  EstadoActual,
  ResumenEstacion,
  SerieTemporal,
  RosaVientoItem,
  PrecipitacionDiariaItem,
  ExtremoTemperaturaDiariaItem,
} from "./types.ts";


function getSupabaseClient() {
  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl) {
    throw new Error(
      "Missing SUPABASE_URL",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
  );
}


export async function getEstadoActual(
  deviceId: string,
): Promise<EstadoActual | null> {

  const supabase =
    getSupabaseClient();

  const { data, error } =
    await supabase
      .from("estacion_estado_actual")
      .select("*")
      .eq("device_id", deviceId)
      .maybeSingle();

  if (error) {
    throw new Error(
      `Error obteniendo estado actual: ${error.message}`,
    );
  }

  return data as EstadoActual | null;
}


export async function getSerieTemporal(
  deviceId: string,
  desde: string,
  hasta: string,
  intervaloMinutos: number,
): Promise<SerieTemporal[]> {

  const supabase =
    getSupabaseClient();

  const { data, error } =
    await supabase.rpc(
      "obtener_serie_estacion",
      {
        p_device_id: deviceId,
        p_desde: desde,
        p_hasta: hasta,
        p_intervalo_minutos:
          intervaloMinutos,
      },
    );

  if (error) {
    throw new Error(
      `Error obteniendo serie temporal: ${error.message}`,
    );
  }

  return (data ?? []) as SerieTemporal[];
}


export async function getResumenEstacion(
  deviceId: string,
  desde: string,
  hasta: string,
): Promise<ResumenEstacion | null> {

  const supabase =
    getSupabaseClient();

  const { data, error } =
    await supabase.rpc(
      "obtener_resumen_estacion",
      {
        p_device_id: deviceId,
        p_desde: desde,
        p_hasta: hasta,
      },
    );

  if (error) {
    throw new Error(
      `Error obteniendo resumen de estación: ${error.message}`,
    );
  }

  const resumen =
    data?.[0] ?? null;

  return resumen as ResumenEstacion | null;
}


export async function getRosaVientos(
  deviceId: string,
  desde: string,
  hasta: string,
): Promise<RosaVientoItem[]> {

  const supabase =
    getSupabaseClient();

  const { data, error } =
    await supabase.rpc(
      "obtener_rosa_vientos",
      {
        p_device_id: deviceId,
        p_desde: desde,
        p_hasta: hasta,
      },
    );

  if (error) {
    throw new Error(
      `Error obteniendo rosa de los vientos: ${error.message}`,
    );
  }

  return (data ?? []) as RosaVientoItem[];
}

export async function getPrecipitacionDiaria(
  deviceId: string,
  desde: string,
  hasta: string,
): Promise<PrecipitacionDiariaItem[]> {

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "obtener_precipitacion_diaria",
    {
      p_device_id: deviceId,
      p_desde: desde,
      p_hasta: hasta,
    },
  );

  if (error) {
    throw new Error(
      `Error obteniendo precipitación diaria: ${error.message}`,
    );
  }

  return (data ?? []) as PrecipitacionDiariaItem[];
}

export async function getExtremosTemperaturaDiaria(
  deviceId: string,
  desde: string,
  hasta: string,
): Promise<ExtremoTemperaturaDiariaItem[]> {

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "obtener_extremos_temperatura_diaria",
    {
      p_device_id: deviceId,
      p_desde: desde,
      p_hasta: hasta,
    },
  );

  if (error) {
    throw new Error(
      `Error obteniendo extremos diarios de temperatura: ${error.message}`,
    );
  }

  return (data ?? []) as ExtremoTemperaturaDiariaItem[];
}
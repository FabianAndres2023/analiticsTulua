import { createClient } from "npm:@supabase/supabase-js@2";

import type {
  EstadoActual,
  SerieTemporal,
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
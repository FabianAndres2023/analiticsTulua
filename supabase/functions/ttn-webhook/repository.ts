import { createClient } from "npm:@supabase/supabase-js@2";

import type {
  MedicionRow,
  UplinkRawRow,
} from "./types.ts";

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get(
    "SUPABASE_URL",
  );

  const serviceRoleKey = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  );

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

export async function saveRawUplink(
  row: UplinkRawRow,
): Promise<number> {
  const supabase = getSupabaseClient();

  const { data: existing, error: existingError } =
    await supabase
      .from("estacion_uplinks_raw")
      .select("id")
      .eq("event_key", row.event_key)
      .maybeSingle();

  if (existingError) {
    throw new Error(
      `Unable to check existing uplink: ${existingError.message}`,
    );
  }

  if (existing?.id) {
    return Number(existing.id);
  }

  const { data, error } = await supabase
    .from("estacion_uplinks_raw")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `Unable to persist uplink: ${error.message}`,
    );
  }

  return Number(data.id);
}

export async function saveMedicion(
  row: MedicionRow,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("estacion_mediciones")
    .upsert(
      row,
      {
        onConflict: "uplink_id",
        ignoreDuplicates: true,
      },
    );

  if (error) {
    throw new Error(
      `Unable to persist measurement: ${error.message}`,
    );
  }
}
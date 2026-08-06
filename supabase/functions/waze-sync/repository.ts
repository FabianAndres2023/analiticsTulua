import { createClient } from '@supabase/supabase-js';

import type {
  WazeAlertaActual,
  WazeAtascoActual,
  WazeResumenHistorico
} from './types.ts';

function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'No se encontraron SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

export async function replaceAtascosActuales(
  atascos: WazeAtascoActual[]
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase
    .from('waze_atascos_actuales')
    .delete()
    .not('uuid', 'is', null);

  if (deleteError) {
    throw new Error(
      `No fue posible limpiar los atascos actuales: ${deleteError.message}`
    );
  }

  if (atascos.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('waze_atascos_actuales')
    .insert(atascos);

  if (insertError) {
    throw new Error(
      `No fue posible guardar los atascos actuales: ${insertError.message}`
    );
  }
}

export async function replaceAlertasActuales(
  alertas: WazeAlertaActual[]
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase
    .from('waze_alertas_actuales')
    .delete()
    .not('uuid', 'is', null);

  if (deleteError) {
    throw new Error(
      `No fue posible limpiar las alertas actuales: ${deleteError.message}`
    );
  }

  if (alertas.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('waze_alertas_actuales')
    .insert(alertas);

  if (insertError) {
    throw new Error(
      `No fue posible guardar las alertas actuales: ${insertError.message}`
    );
  }
}

export async function insertResumenHistorico(
  resumen: WazeResumenHistorico
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('waze_resumen_historico')
    .insert(resumen);

  if (error) {
    throw new Error(
      `No fue posible guardar el resumen histórico: ${error.message}`
    );
  }
}

export async function registerSynchronization(
  data: {
    estado: 'iniciada' | 'exitosa' | 'error';
    mensaje?: string | null;
    totalAtascos?: number;
    totalAlertas?: number;
    totalIrregularidades?: number;
    iniciadoEn?: string;
    finalizadoEn?: string | null;
  }
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('waze_sincronizaciones')
    .insert({
      iniciado_en: data.iniciadoEn ?? new Date().toISOString(),
      finalizado_en: data.finalizadoEn ?? null,
      estado: data.estado,
      mensaje: data.mensaje ?? null,
      total_atascos: data.totalAtascos ?? 0,
      total_alertas: data.totalAlertas ?? 0,
      total_irregularidades:
        data.totalIrregularidades ?? 0
    });

  if (error) {
    throw new Error(
      `No fue posible registrar la sincronización: ${error.message}`
    );
  }
}
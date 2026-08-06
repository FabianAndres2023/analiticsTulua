import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',

  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',

  'Access-Control-Allow-Methods':
    'GET, OPTIONS'
};

function jsonResponse(
  body: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,

        'Content-Type':
          'application/json; charset=utf-8',

        'Cache-Control':
          'public, max-age=60'
      }
    }
  );
}

Deno.serve(
  async (
    req: Request
  ): Promise<Response> => {

    if (req.method === 'OPTIONS') {
      return new Response(
        'ok',
        {
          headers: corsHeaders
        }
      );
    }

    if (req.method !== 'GET') {
      return jsonResponse(
        {
          success: false,

          message:
            'Método HTTP no permitido.'
        },
        405
      );
    }

    try {
      const supabaseUrl =
        Deno.env.get('SUPABASE_URL');

      const serviceRoleKey =
        Deno.env.get(
          'SUPABASE_SERVICE_ROLE_KEY'
        );

      if (
        !supabaseUrl ||
        !serviceRoleKey
      ) {
        throw new Error(
          'No se encontraron las variables internas de Supabase.'
        );
      }

      const supabase =
        createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              persistSession: false,

              autoRefreshToken: false
            }
          }
        );

      /*
       * Estado actual de los atascos.
       */
      const {
        data: atascos,
        error: atascosError
      } = await supabase
        .from(
          'waze_atascos_actuales'
        )
        .select(`
          uuid,
          id_waze,
          ciudad,
          pais,
          calle,
          nodo_inicial,
          nodo_final,
          velocidad_mps,
          velocidad_kmh,
          longitud_metros,
          retraso_segundos,
          nivel_congestion,
          tipo_via,
          tipo_giro,
          geometria,
          publicado_en,
          actualizado_en
        `)
        .order(
          'nivel_congestion',
          {
            ascending: false
          }
        );

      if (atascosError) {
        throw new Error(
          `Error consultando atascos: ${atascosError.message}`
        );
      }

      /*
       * Estado actual de las alertas.
       */
      const {
        data: alertas,
        error: alertasError
      } = await supabase
        .from(
          'waze_alertas_actuales'
        )
        .select(`
          uuid,
          tipo,
          subtipo,
          ciudad,
          calle,
          longitud,
          latitud,
          confianza,
          confiabilidad,
          calificacion_reporte,
          reportado_por_municipio,
          publicado_en,
          actualizado_en
        `)
        .order(
          'actualizado_en',
          {
            ascending: false
          }
        );

      if (alertasError) {
        throw new Error(
          `Error consultando alertas: ${alertasError.message}`
        );
      }

      /*
       * Histórico resumido de los últimos siete días.
       */
      const fechaInicial =
        new Date();

      fechaInicial.setDate(
        fechaInicial.getDate() - 7
      );

      const {
        data: historico,
        error: historicoError
      } = await supabase
        .from(
          'waze_resumen_historico'
        )
        .select(`
          fecha_hora,
          total_atascos,
          total_alertas,
          total_irregularidades,
          velocidad_promedio_kmh,
          retraso_promedio_segundos,
          longitud_congestionada_metros,
          nivel_promedio_congestion,
          alertas_por_tipo
        `)
        .gte(
          'fecha_hora',
          fechaInicial.toISOString()
        )
        .order(
          'fecha_hora',
          {
            ascending: true
          }
        );

      if (historicoError) {
        throw new Error(
          `Error consultando histórico: ${historicoError.message}`
        );
      }

      /*
       * Última sincronización exitosa.
       */
      const {
        data: sincronizacion,
        error: sincronizacionError
      } = await supabase
        .from(
          'waze_sincronizaciones'
        )
        .select(`
          iniciado_en,
          finalizado_en,
          estado,
          mensaje,
          total_atascos,
          total_alertas,
          total_irregularidades
        `)
        .eq(
          'estado',
          'exitosa'
        )
        .order(
          'finalizado_en',
          {
            ascending: false
          }
        )
        .limit(1)
        .maybeSingle();

      if (sincronizacionError) {
        throw new Error(
          `Error consultando sincronización: ${sincronizacionError.message}`
        );
      }

      const ultimoResumen =
        historico &&
        historico.length > 0
          ? historico[
              historico.length - 1
            ]
          : null;

      const totalAtascos =
        atascos?.length ?? 0;

      const totalAlertas =
        alertas?.length ?? 0;

      const totalIrregularidades =
        ultimoResumen
          ?.total_irregularidades ?? 0;

      const actividadVialActual =
        totalAtascos +
        totalAlertas +
        totalIrregularidades;

      /*
       * Agregamos actividad_vial a cada punto histórico.
       */
      const historicoConActividad =
        (historico ?? []).map(
          (registro) => ({
            ...registro,

            actividad_vial:
              registro.total_atascos +
              registro.total_alertas +
              registro.total_irregularidades
          })
        );

      return jsonResponse({
        success: true,

        estadoActual: {
          totalAtascos,

          totalAlertas,

          totalIrregularidades,

          actividadVialActual,

          velocidadPromedioKmh:
            ultimoResumen
              ?.velocidad_promedio_kmh
              ?? null,

          retrasoPromedioSegundos:
            ultimoResumen
              ?.retraso_promedio_segundos
              ?? null,

          longitudCongestionadaMetros:
            ultimoResumen
              ?.longitud_congestionada_metros
              ?? null,

          nivelPromedioCongestion:
            ultimoResumen
              ?.nivel_promedio_congestion
              ?? null
        },

        atascos:
          atascos ?? [],

        alertas:
          alertas ?? [],

        historico:
          historicoConActividad,

        ultimaSincronizacion:
          sincronizacion ?? null,

        generadoEn:
          new Date().toISOString()
      });

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error desconocido.';

      console.error(
        'Error obteniendo el dashboard Waze:',
        error
      );

      return jsonResponse(
        {
          success: false,

          message:
            'No fue posible obtener los datos del dashboard.',

          error: message
        },
        500
      );
    }
  }
);
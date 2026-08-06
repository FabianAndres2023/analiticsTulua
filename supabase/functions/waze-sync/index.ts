import { fetchWazeFeed } from './waze-client.ts';

import {
  buildResumen,
  parseAlertas,
  parseAtascos
} from './parser.ts';

import {
  insertResumenHistorico,
  registerSynchronization,
  replaceAlertasActuales,
  replaceAtascosActuales
} from './repository.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':
    'GET, POST, OPTIONS'
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
          'no-store'
      }
    }
  );
}

Deno.serve(
  async (
    req: Request
  ): Promise<Response> => {

    /*
     * Respuesta a la solicitud previa del navegador.
     * Es necesaria para permitir llamadas desde Angular.
     */
    if (req.method === 'OPTIONS') {
      return new Response(
        'ok',
        {
          headers: corsHeaders
        }
      );
    }

    /*
     * Permitimos GET y POST.
     */
    if (
      req.method !== 'GET' &&
      req.method !== 'POST'
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            'Método HTTP no permitido.'
        },
        405
      );
    }

    const iniciadoEn =
      new Date().toISOString();

    try {
      /*
       * 1. Consultar el feed oficial de Waze.
       */
      const feed =
        await fetchWazeFeed();

      /*
       * Registro temporal para revisar la estructura real
       * que está entregando Waze.
       */
      console.log(
        'Feed recibido:',
        JSON.stringify(feed)
          .substring(0, 1500)
      );

      /*
       * 2. Convertir el JSON de Waze
       * en registros pequeños.
       */
      const atascos =
        parseAtascos(feed);

      const alertas =
        parseAlertas(feed);

      const resumen =
        buildResumen(feed);

      /*
       * Registro temporal de diagnóstico.
       */
      console.log(
        'Resumen del feed:',
        {
          clavesPrincipales:
            Object.keys(feed),

          totalAtascosParseados:
            atascos.length,

          totalAlertasParseadas:
            alertas.length,

          totalIrregularidades:
            Array.isArray(
              feed.irregularities
            )
              ? feed.irregularities.length
              : 0
        }
      );

      /*
       * 3. Reemplazar el estado actual.
       */
      await replaceAtascosActuales(
        atascos
      );

      await replaceAlertasActuales(
        alertas
      );

      /*
       * 4. Guardar un resumen pequeño
       * para las gráficas.
       */
      await insertResumenHistorico(
        resumen
      );

      const finalizadoEn =
        new Date().toISOString();

      /*
       * 5. Registrar la sincronización exitosa.
       */
      await registerSynchronization({
        estado: 'exitosa',

        mensaje:
          'Sincronización con Waze completada correctamente.',

        totalAtascos:
          resumen.total_atascos,

        totalAlertas:
          resumen.total_alertas,

        totalIrregularidades:
          resumen.total_irregularidades,

        iniciadoEn,
        finalizadoEn
      });

      return jsonResponse(
        {
          success: true,

          message:
            'Datos de Waze sincronizados correctamente.',

          data: {
            totalAtascos:
              resumen.total_atascos,

            totalAlertas:
              resumen.total_alertas,

            totalIrregularidades:
              resumen.total_irregularidades,

            velocidadPromedioKmh:
              resumen.velocidad_promedio_kmh,

            retrasoPromedioSegundos:
              resumen.retraso_promedio_segundos,

            longitudCongestionadaMetros:
              resumen.longitud_congestionada_metros,

            nivelPromedioCongestion:
              resumen.nivel_promedio_congestion,

            alertasPorTipo:
              resumen.alertas_por_tipo,

            clavesPrincipalesFeed:
              Object.keys(feed)
          },

          sincronizadoEn:
            finalizadoEn
        }
      );

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error desconocido.';

      console.error(
        'Error durante la sincronización con Waze:',
        error
      );

      try {
        await registerSynchronization({
          estado: 'error',
          mensaje: message,
          iniciadoEn,
          finalizadoEn:
            new Date().toISOString()
        });
      } catch (
        logError: unknown
      ) {
        console.error(
          'No fue posible registrar el error de sincronización:',
          logError
        );
      }

      return jsonResponse(
        {
          success: false,

          message:
            'No fue posible sincronizar los datos de Waze.',

          error: message
        },
        500
      );
    }
  }
);
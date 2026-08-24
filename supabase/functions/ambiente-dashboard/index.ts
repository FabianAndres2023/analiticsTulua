import {
  getEstadoActual,
  getSerieTemporal,
} from "./repository.ts";

import type {
  DashboardResponse,
} from "./types.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "GET, OPTIONS",
};


function jsonResponse(
  body: unknown,
  status = 200,
): Response {

  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}


Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      },
    );
  }

  if (req.method !== "GET") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405,
    );
  }

  try {

    const url =
      new URL(req.url);

    const deviceId =
      url.searchParams.get("device_id")
      ?? "sta-001";

    const rango =
      url.searchParams.get("rango")
      ?? "24h";


    let horas: number;
    let intervaloMinutos: number;


    switch (rango) {

      case "7d":
        horas = 24 * 7;
        intervaloMinutos = 120;
        break;

      case "30d":
        horas = 24 * 30;
        intervaloMinutos = 480;
        break;

      case "24h":
      default:
        horas = 24;
        intervaloMinutos = 15;
        break;
    }


    const hasta =
      new Date();

    const desde =
      new Date(
        hasta.getTime()
        - horas * 60 * 60 * 1000,
      );


    const [
      estadoActual,
      serie,
    ] = await Promise.all([
      getEstadoActual(
        deviceId,
      ),

      getSerieTemporal(
        deviceId,
        desde.toISOString(),
        hasta.toISOString(),
        intervaloMinutos,
      ),
    ]);


    const response:
      DashboardResponse = {

        estado_actual:
          estadoActual,

        serie:
          serie,
      };


    return jsonResponse(
      response,
    );

  } catch (error) {

    console.error(
      "ambiente-dashboard error:",
      error,
    );


    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";


    return jsonResponse(
      {
        error: message,
      },
      500,
    );
  }
});
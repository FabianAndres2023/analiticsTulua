import type {
  MedicionRow,
  TtnWebhookPayload,
  UplinkRawRow,
} from "./types.ts";

import {
  saveMedicion,
  saveRawUplink,
} from "./repository.ts";

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
      },
    },
  );
}

async function sha256(
  value: string,
): Promise<string> {
  const encoded =
    new TextEncoder().encode(value);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      encoded,
    );

  return Array.from(
    new Uint8Array(hashBuffer),
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

Deno.serve(
  async (
    req: Request,
  ): Promise<Response> => {
    if (req.method !== "POST") {
      return jsonResponse(
        {
          error:
            "Method not allowed",
        },
        405,
      );
    }

    const expectedToken =
      Deno.env.get(
        "TTN_WEBHOOK_SECRET",
      );

    const receivedToken =
      req.headers.get(
        "x-webhook-token",
      );

    if (
      !expectedToken ||
      !receivedToken ||
      receivedToken !==
        expectedToken
    ) {
      return jsonResponse(
        {
          error:
            "Unauthorized",
        },
        401,
      );
    }

    try {
    const payload = (await req.json()) as TtnWebhookPayload;

    const applicationId =
        payload
        ?.end_device_ids
        ?.application_ids
        ?.application_id ??
        null;

      const deviceId =
        payload
          ?.end_device_ids
          ?.device_id ??
        "unknown";

      const devEui =
        payload
          ?.end_device_ids
          ?.dev_eui ??
        null;

      const uplink =
        payload
          ?.uplink_message ??
        {};

      const fPort =
        uplink
          ?.f_port ??
        null;

      const fCnt =
        uplink
          ?.f_cnt ??
        null;

      const frmPayload =
        uplink
          ?.frm_payload ??
        null;

      const decodedPayload =
        uplink
          ?.decoded_payload ??
        null;

      const receivedAt =
        payload
          ?.received_at ??
        uplink
          ?.received_at ??
        null;

      const rxMetadata =
        Array.isArray(
          uplink
            ?.rx_metadata,
        )
          ? uplink.rx_metadata
          : [];

      const firstGateway =
        rxMetadata.length > 0
          ? rxMetadata[0]
          : null;

      const gatewayId =
        firstGateway
          ?.gateway_ids
          ?.gateway_id ??
        null;

      const rssi =
        firstGateway
          ?.rssi ??
        null;

      const snr =
        firstGateway
          ?.snr ??
        null;

      const eventKeySource = [
        applicationId ?? "",
        deviceId,
        String(
          fCnt ?? "",
        ),
        receivedAt ?? "",
        frmPayload ?? "",
      ].join("|");

      const eventKey =
        await sha256(
          eventKeySource,
        );

      const row: UplinkRawRow = {
        application_id:
          applicationId,

        device_id:
          deviceId,

        dev_eui:
          devEui,

        f_port:
          fPort,

        f_cnt:
          fCnt,

        recibido_en:
          receivedAt,

        frm_payload:
          frmPayload,

        decoded_payload:
          decodedPayload,

        rssi,
        snr,

        gateway_id:
          gatewayId,

        event_key:
          eventKey,

        payload,
      };

      const uplinkId =
        await saveRawUplink(
            row,
        );

        const decoded =
            uplink.decoded_payload ?? null;

        if (decoded && receivedAt) {
        const medicion: MedicionRow = {
            uplink_id: uplinkId,

            application_id:
            applicationId ?? "unknown",

            device_id:
            deviceId,

            medido_en:
            receivedAt,

            temperatura:
            typeof decoded.temp === "number"
                ? decoded.temp
                : null,

            humedad_relativa:
            typeof decoded.hum === "number"
                ? decoded.hum
                : null,

            presion:
            typeof decoded.press === "number"
                ? decoded.press
                : null,

            precipitacion:
            typeof decoded.rain === "number"
                ? decoded.rain
                : null,

            viento_velocidad:
            typeof decoded.windSpd === "number"
                ? decoded.windSpd
                : null,

            viento_direccion:
            typeof decoded.windDir === "number"
                ? decoded.windDir
                : null,

            indice_uv:
            typeof decoded.uv === "number"
                ? decoded.uv
                : null,

            nubosidad:
            typeof decoded.cloudCover === "number"
                ? decoded.cloudCover
                : null,

            data_source:
            typeof decoded.dataSource === "number"
                ? decoded.dataSource
                : null,

            data_source_name:
            typeof decoded.dataSourceName === "string"
                ? decoded.dataSourceName
                : null,
        };

        await saveMedicion(
            medicion,
        );
        }

      console.log(
        `TTN uplink stored device=${deviceId} f_cnt=${fCnt} uplink_id=${uplinkId}`,
      );

      return jsonResponse(
        {
          ok: true,
          device_id:
            deviceId,
          f_cnt:
            fCnt,
        },
      );
    } catch (error) {
      console.error(
        "TTN webhook error:",
        error,
      );

      return jsonResponse(
        {
          error:
            "Unable to process request",
        },
        500,
      );
    }
  },
);
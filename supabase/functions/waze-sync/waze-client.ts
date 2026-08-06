import type { WazeFeedResponse } from './types.ts';

/**
 * Consulta el feed oficial de Waze.
 *
 * La URL no se escribe directamente en el código.
 * Se obtiene desde el secreto WAZE_FEED_URL.
 */
export async function fetchWazeFeed(): Promise<WazeFeedResponse> {
  const feedUrl = Deno.env.get('WAZE_FEED_URL');

  if (!feedUrl) {
    throw new Error(
      'No se encontró el secreto WAZE_FEED_URL.'
    );
  }

  const response = await fetch(feedUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(
      `Waze respondió con estado ${response.status}: ${response.statusText}`
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== 'object' ||
    data === null
  ) {
    throw new Error(
      'El feed de Waze no devolvió un objeto JSON válido.'
    );
  }

  return data as WazeFeedResponse;
}
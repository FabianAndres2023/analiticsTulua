import type {
  RangoEstacion,
  SerieTemporal,
} from '../models/estacion-dashboard.model';

export interface UvPresentacion {
  categoria: string;
  color: string;
}

export function construirLabelsTiempo(
  serie: SerieTemporal[],
  rango: RangoEstacion,
): string[] {
  return serie.map((punto) => {
    const fecha =
      new Date(punto.periodo);

    if (rango === '24h') {
      return fecha.toLocaleTimeString(
        'es-CO',
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      );
    }

    return fecha.toLocaleString(
      'es-CO',
      {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  });
}

export function obtenerPresentacionUv(
  indiceUv: number | null | undefined,
): UvPresentacion | null {

  if (indiceUv == null) {
    return null;
  }

  if (indiceUv < 3) {
    return {
      categoria: 'Bajo',
      color: '#22c55e',
    };
  }

  if (indiceUv < 6) {
    return {
      categoria: 'Moderado',
      color: '#eab308',
    };
  }

  if (indiceUv < 8) {
    return {
      categoria: 'Alto',
      color: '#f97316',
    };
  }

  if (indiceUv < 11) {
    return {
      categoria: 'Muy alto',
      color: '#ef4444',
    };
  }

  return {
    categoria: 'Extremo',
    color: '#8b5cf6',
  };
}

import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase.service';


/* =========================================================
 * CATEGORÍAS
 * ========================================================= */

export type TourismAssetCategory =
  | 'HOTEL'
  | 'GASTRONOMIA'
  | 'AGENCIA'
  | 'CAFE'
  | 'ARTESANIA_RECUERDO';


/* =========================================================
 * PRECISIÓN DE UBICACIÓN
 * ========================================================= */

export type TourismLocationPrecision =
  | 'EXACTA'
  | 'APROXIMADA'
  | 'PENDIENTE';


/* =========================================================
 * ACTIVO TURÍSTICO
 * ========================================================= */

export interface TourismAsset {

  id: number;

  nombre: string;

  categoria: TourismAssetCategory;

  subcategoria: string | null;

  direccion: string | null;

  telefono: string | null;

  correo: string | null;

  descripcion: string | null;

  sitio_web: string | null;

  latitud: number | null;

  longitud: number | null;

  precision_ubicacion: TourismLocationPrecision;

  fuente_direccion: string | null;

  activo: boolean;

  created_at: string;

  updated_at: string;
}


/* =========================================================
 * RESUMEN
 * ========================================================= */

export interface TourismAssetsSummary {

  total: number;

  ubicados: number;

  sinUbicacion: number;

  exactos: number;

  aproximados: number;

  pendientes: number;

  porCategoria:
    Record<TourismAssetCategory, number>;
}


/* =========================================================
 * SERVICIO
 * ========================================================= */

@Injectable({
  providedIn: 'root'
})
export class TourismAssetsService {


  /* =======================================================
   * CACHÉ
   * ======================================================= */

  private assetsCache:
    TourismAsset[] | null =
    null;


  private loadingPromise:
    Promise<TourismAsset[]> | null =
    null;


  /* =======================================================
   * CONSTRUCTOR
   * ======================================================= */

  constructor(
    private readonly supabaseService:
      SupabaseService
  ) {}


  /* =======================================================
   * OBTENER ACTIVOS
   * ======================================================= */

  async getActiveAssets(
    forceRefresh:
      boolean = false
  ): Promise<TourismAsset[]> {


    /*
     * Si ya tenemos los datos en memoria,
     * evitamos consultar Supabase nuevamente.
     */

    if (
      !forceRefresh &&
      this.assetsCache
    ) {

      return [
        ...this.assetsCache
      ];
    }


    /*
     * Si ya existe una consulta en curso,
     * reutilizamos la misma Promise.
     */

    if (
      !forceRefresh &&
      this.loadingPromise
    ) {

      const assets =
        await this.loadingPromise;


      return [
        ...assets
      ];
    }


    /*
     * Iniciamos la consulta real.
     */

    this.loadingPromise =
      this.fetchActiveAssets();


    try {

      const assets =
        await this.loadingPromise;


      this.assetsCache =
        assets;


      return [
        ...assets
      ];

    } finally {

      this.loadingPromise =
        null;
    }
  }


  /* =======================================================
   * CONSULTA REAL A SUPABASE
   * ======================================================= */

  private async fetchActiveAssets():
    Promise<TourismAsset[]> {

    const {
      data,
      error
    } = await this.supabaseService.client
      .from('tourism_assets')
      .select(`
        id,
        nombre,
        categoria,
        subcategoria,
        direccion,
        telefono,
        correo,
        descripcion,
        sitio_web,
        latitud,
        longitud,
        precision_ubicacion,
        fuente_direccion,
        activo,
        created_at,
        updated_at
      `)
      .eq(
        'activo',
        true
      )
      .order(
        'nombre',
        {
          ascending:
            true
        }
      );


    if (
      error
    ) {

      throw new Error(
        error.message
      );
    }


    return (
      data ?? []
    ).map(
      asset =>
        this.normalizeAsset(
          asset
        )
    );
  }


  /* =======================================================
   * OBTENER ACTIVOS GEOLOCALIZADOS
   * ======================================================= */

  async getGeolocatedAssets(
    forceRefresh:
      boolean = false
  ): Promise<TourismAsset[]> {

    const assets =
      await this.getActiveAssets(
        forceRefresh
      );


    return assets.filter(
      asset =>
        asset.latitud !== null &&
        asset.longitud !== null
    );
  }


  /* =======================================================
   * INVALIDAR CACHÉ
   * ======================================================= */

  clearCache():
    void {

    this.assetsCache =
      null;
  }


  /* =======================================================
   * GENERAR RESUMEN
   * ======================================================= */

  getSummary(
    assets:
      TourismAsset[]
  ): TourismAssetsSummary {

    const porCategoria:
      Record<
        TourismAssetCategory,
        number
      > = {

      HOTEL:
        0,

      GASTRONOMIA:
        0,

      AGENCIA:
        0,

      CAFE:
        0,

      ARTESANIA_RECUERDO:
        0
    };


    let ubicados =
      0;

    let exactos =
      0;

    let aproximados =
      0;

    let pendientes =
      0;


    for (
      const asset
      of assets
    ) {

      porCategoria[
        asset.categoria
      ]++;


      if (
        asset.latitud !== null &&
        asset.longitud !== null
      ) {

        ubicados++;
      }


      switch (
        asset.precision_ubicacion
      ) {

        case 'EXACTA':

          exactos++;

          break;


        case 'APROXIMADA':

          aproximados++;

          break;


        case 'PENDIENTE':

          pendientes++;

          break;
      }
    }


    return {

      total:
        assets.length,

      ubicados,

      sinUbicacion:
        assets.length -
        ubicados,

      exactos,

      aproximados,

      pendientes,

      porCategoria
    };
  }


  /* =======================================================
   * NORMALIZAR REGISTRO
   * ======================================================= */

  private normalizeAsset(
    asset:
      Record<string, unknown>
  ): TourismAsset {

    return {

      id:
        Number(
          asset['id']
        ),

      nombre:
        String(
          asset['nombre']
        ),

      categoria:
        this.toCategory(
          asset['categoria']
        ),

      subcategoria:
        this.toNullableString(
          asset['subcategoria']
        ),

      direccion:
        this.toNullableString(
          asset['direccion']
        ),

      telefono:
        this.toNullableString(
          asset['telefono']
        ),

      correo:
        this.toNullableString(
          asset['correo']
        ),

      descripcion:
        this.toNullableString(
          asset['descripcion']
        ),

      sitio_web:
        this.toNullableString(
          asset['sitio_web']
        ),

      latitud:
        this.toNullableNumber(
          asset['latitud']
        ),

      longitud:
        this.toNullableNumber(
          asset['longitud']
        ),

      precision_ubicacion:
        this.toLocationPrecision(
          asset['precision_ubicacion']
        ),

      fuente_direccion:
        this.toNullableString(
          asset['fuente_direccion']
        ),

      activo:
        Boolean(
          asset['activo']
        ),

      created_at:
        String(
          asset['created_at']
        ),

      updated_at:
        String(
          asset['updated_at']
        )
    };
  }


  /* =======================================================
   * NORMALIZAR CATEGORÍA
   * ======================================================= */

  private toCategory(
    value:
      unknown
  ): TourismAssetCategory {

    switch (
      String(
        value
      )
    ) {

      case 'HOTEL':

        return 'HOTEL';


      case 'GASTRONOMIA':

        return 'GASTRONOMIA';


      case 'AGENCIA':

        return 'AGENCIA';


      case 'CAFE':

        return 'CAFE';


      case 'ARTESANIA_RECUERDO':

        return 'ARTESANIA_RECUERDO';


      default:

        return 'HOTEL';
    }
  }


  /* =======================================================
   * NORMALIZAR PRECISIÓN
   * ======================================================= */

  private toLocationPrecision(
    value:
      unknown
  ): TourismLocationPrecision {

    switch (
      String(
        value
      )
    ) {

      case 'EXACTA':

        return 'EXACTA';


      case 'APROXIMADA':

        return 'APROXIMADA';


      case 'PENDIENTE':

        return 'PENDIENTE';


      default:

        return 'PENDIENTE';
    }
  }


  /* =======================================================
   * CONVERTIR TEXTO
   * ======================================================= */

  private toNullableString(
    value:
      unknown
  ): string | null {

    if (
      value === null ||
      value === undefined
    ) {

      return null;
    }


    const text =
      String(
        value
      ).trim();


    return text
      ? text
      : null;
  }


  /* =======================================================
   * CONVERTIR NÚMERO
   * ======================================================= */

  private toNullableNumber(
    value:
      unknown
  ): number | null {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return null;
    }


    const numberValue =
      Number(
        value
      );


    return Number.isFinite(
      numberValue
    )
      ? numberValue
      : null;
  }
}
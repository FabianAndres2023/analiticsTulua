import { Injectable } from '@angular/core';

import {
  SupabaseService
} from './supabase.service';


export interface DependencyItem {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string | null;
  users_count: number;
}


export interface CreateDependencyInput {
  name: string;
  description: string | null;
  active: boolean;
}


export interface UpdateDependencyInput {
  name?: string;
  description?: string | null;
  active?: boolean;
}


interface DependencyRow {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string | null;

  profiles:
    | {
        count: number;
      }[]
    | null;
}


interface DependencyUserCount {
  dependency_id: number;
  users_count: number;
}


interface DependencyCountsResponse {
  counts?: DependencyUserCount[];
  error?: string;
}


@Injectable({
  providedIn: 'root'
})
export class DependenciesService {

  constructor(
    private readonly supabaseService:
      SupabaseService
  ) {}


  /* =======================================================
   * OBTENER DEPENDENCIAS
   * ======================================================= */

  async getDependencies():
    Promise<DependencyItem[]> {

    const [
      dependenciesResult,
      administrativeCounts
    ] =
      await Promise.all([
        this.supabaseService.client
          .from('dependencies')
          .select(`
            id,
            name,
            description,
            active,
            created_at,
            updated_at,
            profiles (
              count
            )
          `)
          .order(
            'name',
            {
              ascending: true
            }
          ),

        this.getAdministrativeUserCounts()
      ]);


    const {
      data,
      error
    } =
      dependenciesResult;


    if (
      error
    ) {
      throw new Error(
        error.message
      );
    }


    const dependencies =
      (data ?? []).map(
        (row: unknown) =>
          this.mapDependency(
            row as DependencyRow
          )
      );


    /*
     * Si la Edge Function administrativa pudo devolver
     * los conteos, esos valores tienen prioridad.
     *
     * Si no pudo hacerlo, conservamos el conteo obtenido
     * mediante la relación profiles(count) como respaldo.
     */

    if (
      administrativeCounts ===
      null
    ) {
      return dependencies;
    }


    return dependencies.map(
      dependency => ({

        ...dependency,

        users_count:
          administrativeCounts.get(
            dependency.id
          ) ??
          0

      })
    );
  }


  /* =======================================================
   * OBTENER DEPENDENCIA POR ID
   * ======================================================= */

  async getDependencyById(
    id: number
  ):
    Promise<DependencyItem | null> {

    const [
      dependencyResult,
      administrativeCounts
    ] =
      await Promise.all([
        this.supabaseService.client
          .from('dependencies')
          .select(`
            id,
            name,
            description,
            active,
            created_at,
            updated_at,
            profiles (
              count
            )
          `)
          .eq(
            'id',
            id
          )
          .maybeSingle(),

        this.getAdministrativeUserCounts()
      ]);


    const {
      data,
      error
    } =
      dependencyResult;


    if (
      error
    ) {
      throw new Error(
        error.message
      );
    }


    if (
      !data
    ) {
      return null;
    }


    const dependency =
      this.mapDependency(
        data as DependencyRow
      );


    if (
      administrativeCounts ===
      null
    ) {
      return dependency;
    }


    return {

      ...dependency,

      users_count:
        administrativeCounts.get(
          dependency.id
        ) ??
        0

    };
  }


  /* =======================================================
   * CREAR DEPENDENCIA
   * ======================================================= */

  async createDependency(
    input: CreateDependencyInput
  ):
    Promise<DependencyItem> {

    const payload = {

      name:
        input.name.trim(),

      description:
        input.description
          ?.trim() ||
        null,

      active:
        input.active

    };


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('dependencies')
        .insert(
          payload
        )
        .select(`
          id,
          name,
          description,
          active,
          created_at,
          updated_at,
          profiles (
            count
          )
        `)
        .single();


    if (
      error
    ) {
      throw new Error(
        this.normalizeDatabaseError(
          error.message
        )
      );
    }


    const dependency =
      this.mapDependency(
        data as DependencyRow
      );


    /*
     * Una dependencia recién creada no puede tener
     * usuarios asignados todavía.
     */

    return {

      ...dependency,

      users_count:
        0

    };
  }


  /* =======================================================
   * ACTUALIZAR DEPENDENCIA
   * ======================================================= */

  async updateDependency(
    id: number,
    changes: UpdateDependencyInput
  ):
    Promise<DependencyItem> {

    const payload:
      UpdateDependencyInput = {
        ...changes
      };


    if (
      typeof payload.name ===
      'string'
    ) {
      payload.name =
        payload.name.trim();
    }


    if (
      typeof payload.description ===
      'string'
    ) {
      payload.description =
        payload.description
          .trim() ||
        null;
    }


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('dependencies')
        .update(
          payload
        )
        .eq(
          'id',
          id
        )
        .select(`
          id,
          name,
          description,
          active,
          created_at,
          updated_at,
          profiles (
            count
          )
        `)
        .single();


    if (
      error
    ) {
      throw new Error(
        this.normalizeDatabaseError(
          error.message
        )
      );
    }


    const dependency =
      this.mapDependency(
        data as DependencyRow
      );


    const administrativeCounts =
      await this
        .getAdministrativeUserCounts();


    if (
      administrativeCounts ===
      null
    ) {
      return dependency;
    }


    return {

      ...dependency,

      users_count:
        administrativeCounts.get(
          dependency.id
        ) ??
        0

    };
  }


  /* =======================================================
   * CAMBIAR ESTADO
   * ======================================================= */

  async changeStatus(
    dependency: DependencyItem
  ):
    Promise<DependencyItem> {

    return this.updateDependency(
      dependency.id,
      {
        active:
          !dependency.active
      }
    );
  }


  /* =======================================================
   * ELIMINAR DEPENDENCIA
   * ======================================================= */

  async deleteDependency(
    dependency: DependencyItem
  ):
    Promise<void> {

    if (
      dependency.users_count >
      0
    ) {
      throw new Error(
        'No puedes eliminar esta dependencia porque tiene usuarios asignados.'
      );
    }


    const {
      error
    } =
      await this.supabaseService.client
        .from('dependencies')
        .delete()
        .eq(
          'id',
          dependency.id
        );


    if (
      error
    ) {
      throw new Error(
        this.normalizeDatabaseError(
          error.message
        )
      );
    }
  }


  /* =======================================================
   * CONTEOS ADMINISTRATIVOS
   *
   * Se obtienen mediante manage-user, que utiliza
   * service_role en Supabase.
   *
   * Si por cualquier motivo la Edge Function no puede
   * responder, devolvemos null y utilizamos como respaldo
   * el conteo profiles(count) de la consulta principal.
   * ======================================================= */

  private async getAdministrativeUserCounts():
    Promise<Map<number, number> | null> {

    try {

      const {
        data,
        error
      } =
        await this.supabaseService.client
          .functions
          .invoke(
            'manage-user',
            {
              body: {
                action:
                  'get-dependency-user-counts'
              }
            }
          );


      if (
        error
      ) {

        console.warn(
          'No fue posible obtener los conteos administrativos de dependencias:',
          error
        );

        return null;
      }


      const response =
        (
          data ??
          {}
        ) as
          DependencyCountsResponse;


      if (
        response.error
      ) {

        console.warn(
          'La Edge Function no devolvió los conteos administrativos:',
          response.error
        );

        return null;
      }


      if (
        !Array.isArray(
          response.counts
        )
      ) {
        return new Map<
          number,
          number
        >();
      }


      const countsMap =
        new Map<
          number,
          number
        >();


      for (
        const item of
          response.counts
      ) {

        const dependencyId =
          Number(
            item.dependency_id
          );


        const usersCount =
          Number(
            item.users_count
          );


        if (
          Number.isNaN(
            dependencyId
          )
        ) {
          continue;
        }


        countsMap.set(
          dependencyId,
          Number.isNaN(
            usersCount
          )
            ? 0
            : usersCount
        );
      }


      return countsMap;

    } catch (
      error
    ) {

      console.warn(
        'Error consultando conteos administrativos de dependencias:',
        error
      );


      return null;
    }
  }


  /* =======================================================
   * MAPEAR DEPENDENCIA
   * ======================================================= */

  private mapDependency(
    row: DependencyRow
  ):
    DependencyItem {

    const usersCount =
      Array.isArray(
        row.profiles
      ) &&
      row.profiles.length >
      0
        ? Number(
            row.profiles[0]
              ?.count ??
            0
          )
        : 0;


    return {

      id:
        row.id,

      name:
        row.name,

      description:
        row.description ??
        null,

      active:
        row.active,

      created_at:
        row.created_at,

      updated_at:
        row.updated_at ??
        null,

      users_count:
        Number.isNaN(
          usersCount
        )
          ? 0
          : usersCount

    };
  }


  /* =======================================================
   * NORMALIZAR ERRORES
   * ======================================================= */

  private normalizeDatabaseError(
    message: string
  ):
    string {

    const normalized =
      message.toLowerCase();


    if (
      normalized.includes(
        'dependencies_name_unique_idx'
      ) ||
      normalized.includes(
        'duplicate key'
      )
    ) {
      return 'Ya existe una dependencia con ese nombre.';
    }


    if (
      normalized.includes(
        'profiles_dependency_id_fkey'
      ) ||
      normalized.includes(
        'violates foreign key constraint'
      )
    ) {
      return 'No puedes eliminar esta dependencia porque tiene usuarios asignados.';
    }


    if (
      normalized.includes(
        'new row violates row-level security policy'
      ) ||
      normalized.includes(
        'permission denied'
      )
    ) {
      return 'No tienes permiso para realizar esta operación.';
    }


    return message;
  }
}
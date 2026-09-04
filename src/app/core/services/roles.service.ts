import { Injectable } from '@angular/core';

import {
  SupabaseService
} from './supabase.service';


export interface RoleItem {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  users_count?: number;
}


export interface CreateRoleInput {
  name: string;
  description: string | null;
  active: boolean;
}


export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  active?: boolean;
}


interface RoleQueryRow {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;

  profiles:
    | Array<{
        count: number;
      }>
    | {
        count: number;
      }
    | null;
}


interface RoleUserCount {
  role_id: number;
  users_count: number;
}


interface RoleCountsResponse {
  counts?: RoleUserCount[];
  error?: string;
}


interface RoleRpcRow {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}


@Injectable({
  providedIn: 'root'
})
export class RolesService {

  constructor(
    private readonly supabaseService:
      SupabaseService
  ) {}


  /* =======================================================
   * OBTENER ROLES
   * ======================================================= */

  async getRoles():
    Promise<RoleItem[]> {

    const [
      rolesResult,
      administrativeCounts
    ] =
      await Promise.all([

        this.supabaseService.client
          .from('roles')
          .select(`
            id,
            name,
            description,
            active,
            created_at,
            updated_at,
            profiles(count)
          `)
          .order(
            'id',
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
      rolesResult;


    if (
      error
    ) {

      throw new Error(
        error.message
      );
    }


    const roles =
      (data ?? []).map(
        row =>
          this.mapRole(
            row as RoleQueryRow
          )
      );


    /*
     * Si manage-user no pudo devolver los conteos
     * administrativos, conservamos profiles(count)
     * como respaldo.
     */

    if (
      administrativeCounts === null
    ) {

      return roles;
    }


    return roles.map(
      role => ({
        ...role,

        users_count:
          administrativeCounts.get(
            role.id
          ) ??
          0
      })
    );
  }


  /* =======================================================
   * CREAR ROL
   * ======================================================= */

  async createRole(
    input: CreateRoleInput
  ):
    Promise<RoleItem> {

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
        .from('roles')
        .insert(
          payload
        )
        .select(`
          id,
          name,
          description,
          active,
          created_at,
          updated_at
        `)
        .single();


    if (
      error
    ) {

      throw new Error(
        this.getDatabaseErrorMessage(
          error
        )
      );
    }


    return {
      ...(data as Omit<
        RoleItem,
        'users_count'
      >),

      users_count:
        0
    };
  }


  /* =======================================================
   * ACTUALIZAR INFORMACIÓN DEL ROL
   * ======================================================= */

  async updateRole(
    id: number,
    input: UpdateRoleInput
  ):
    Promise<RoleItem> {

    if (
      id === 1
    ) {

      const invalidName =
        input.name !== undefined &&
        input.name.trim() !==
          'Administrador';


      const invalidStatus =
        input.active === false;


      if (
        invalidName ||
        invalidStatus
      ) {

        throw new Error(
          'El rol Administrador no puede renombrarse ni desactivarse.'
        );
      }
    }


    const payload:
      UpdateRoleInput = {
        ...input
      };


    if (
      payload.name !==
      undefined
    ) {

      payload.name =
        payload.name.trim();
    }


    if (
      payload.description !==
      undefined
    ) {

      payload.description =
        payload.description
          ?.trim() ||
        null;
    }


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('roles')
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
          updated_at
        `)
        .single();


    if (
      error
    ) {

      throw new Error(
        this.getDatabaseErrorMessage(
          error
        )
      );
    }


    const role =
      data as RoleItem;


    const administrativeCounts =
      await this
        .getAdministrativeUserCounts();


    return {
      ...role,

      users_count:
        administrativeCounts
          ?.get(
            role.id
          ) ??
        0
    };
  }


  /* =======================================================
   * CAMBIAR ESTADO
   *
   * Esta operación NO utiliza UPDATE directo.
   *
   * Utiliza la función:
   * public.change_role_status(...)
   *
   * Esa función valida roles.estado y solamente modifica
   * la columna active.
   * ======================================================= */

  async changeStatus(
    role: RoleItem
  ):
    Promise<RoleItem> {

    if (
      role.id === 1
    ) {

      throw new Error(
        'El rol Administrador no puede desactivarse.'
      );
    }


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .rpc(
          'change_role_status',
          {
            p_role_id:
              role.id,

            p_active:
              !role.active
          }
        );


    if (
      error
    ) {

      throw new Error(
        this.getDatabaseErrorMessage(
          error
        )
      );
    }


    /*
     * Dependiendo de cómo Supabase serialice el tipo
     * compuesto public.roles, data puede llegar como
     * objeto o como arreglo.
     */

    const result =
      Array.isArray(
        data
      )
        ? data[0]
        : data;


    if (
      !result
    ) {

      throw new Error(
        'El estado del rol fue actualizado, pero no fue posible consultar el resultado.'
      );
    }


    const updatedRole =
      result as RoleRpcRow;


    return {
      id:
        updatedRole.id,

      name:
        updatedRole.name,

      description:
        updatedRole.description,

      active:
        updatedRole.active,

      created_at:
        updatedRole.created_at,

      updated_at:
        updatedRole.updated_at,

      /*
       * Conservamos el valor que ya tenía el rol en
       * pantalla. Cambiar el estado no modifica sus
       * usuarios asignados.
       */

      users_count:
        role.users_count ??
        0
    };
  }


  /* =======================================================
   * ELIMINAR ROL
   * ======================================================= */

  async deleteRole(
    role: RoleItem
  ):
    Promise<void> {

    if (
      role.id === 1
    ) {

      throw new Error(
        'El rol Administrador no puede eliminarse.'
      );
    }


    if (
      (
        role.users_count ??
        0
      ) > 0
    ) {

      throw new Error(
        'No puedes eliminar este rol porque tiene usuarios asignados.'
      );
    }


    const {
      error
    } =
      await this.supabaseService.client
        .from('roles')
        .delete()
        .eq(
          'id',
          role.id
        );


    if (
      error
    ) {

      throw new Error(
        this.getDatabaseErrorMessage(
          error
        )
      );
    }
  }


  /* =======================================================
   * CONTEOS ADMINISTRATIVOS DE USUARIOS POR ROL
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
                  'get-role-user-counts'
              }
            }
          );


      if (
        error
      ) {

        console.warn(
          'No fue posible obtener los conteos administrativos de roles:',
          error
        );


        return null;
      }


      const response =
        (
          data ??
          {}
        ) as
          RoleCountsResponse;


      if (
        response.error
      ) {

        console.warn(
          'La Edge Function no devolvió los conteos administrativos de roles:',
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

        const roleId =
          Number(
            item.role_id
          );


        const usersCount =
          Number(
            item.users_count
          );


        if (
          Number.isNaN(
            roleId
          )
        ) {

          continue;
        }


        countsMap.set(
          roleId,
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
        'Error consultando conteos administrativos de roles:',
        error
      );


      return null;
    }
  }


  /* =======================================================
   * MAPEAR ROL
   * ======================================================= */

  private mapRole(
    row: RoleQueryRow
  ):
    RoleItem {

    let usersCount =
      0;


    if (
      Array.isArray(
        row.profiles
      )
    ) {

      usersCount =
        Number(
          row.profiles[0]
            ?.count ??
          0
        );

    } else if (
      row.profiles
    ) {

      usersCount =
        Number(
          row.profiles.count ??
          0
        );
    }


    return {
      id:
        row.id,

      name:
        row.name,

      description:
        row.description,

      active:
        row.active,

      created_at:
        row.created_at,

      updated_at:
        row.updated_at,

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

  private getDatabaseErrorMessage(
    error: {
      code?: string;
      message: string;
    }
  ):
    string {

    const message =
      error.message ??
      'Ocurrió un error inesperado.';


    const normalized =
      message.toLowerCase();


    if (
      error.code ===
      '23505'
    ) {

      return 'Ya existe un rol con ese nombre.';
    }


    if (
      error.code ===
      '23503'
    ) {

      return 'No puedes eliminar este rol porque tiene usuarios asignados.';
    }


    if (
      error.code ===
      '42501'
    ) {

      return 'No tienes permisos para realizar esta operación.';
    }


    if (
      normalized.includes(
        'no tienes permiso para cambiar el estado'
      )
    ) {

      return 'No tienes permiso para cambiar el estado de los roles.';
    }


    if (
      normalized.includes(
        'administrador no puede desactivarse'
      )
    ) {

      return 'El rol Administrador no puede desactivarse.';
    }


    if (
      normalized.includes(
        'rol seleccionado no existe'
      )
    ) {

      return 'El rol seleccionado no existe.';
    }


    if (
      normalized.includes(
        'cannot coerce'
      )
    ) {

      return 'No fue posible completar la operación con los permisos actuales.';
    }


    return message;
  }
}
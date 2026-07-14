import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

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
    | Array<{ count: number }>
    | { count: number }
    | null;
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  constructor(
    private readonly supabaseService: SupabaseService
  ) {}

  async getRoles(): Promise<RoleItem[]> {
    const { data, error } = await this.supabaseService.client
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
      .order('id', {
        ascending: true
      });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) =>
      this.mapRole(row as RoleQueryRow)
    );
  }

  async createRole(
    input: CreateRoleInput
  ): Promise<RoleItem> {
    const payload = {
      name: input.name.trim(),
      description:
        input.description?.trim() || null,
      active: input.active
    };

    const { data, error } = await this.supabaseService.client
      .from('roles')
      .insert(payload)
      .select(`
        id,
        name,
        description,
        active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(
        this.getDatabaseErrorMessage(error)
      );
    }

    return {
      ...(data as Omit<RoleItem, 'users_count'>),
      users_count: 0
    };
  }

  async updateRole(
    id: number,
    input: UpdateRoleInput
  ): Promise<RoleItem> {
    if (id === 1) {
      const invalidName =
        input.name !== undefined &&
        input.name.trim() !== 'Administrador';

      const invalidStatus =
        input.active === false;

      if (invalidName || invalidStatus) {
        throw new Error(
          'El rol Administrador no puede renombrarse ni desactivarse.'
        );
      }
    }

    const payload: UpdateRoleInput = {
      ...input
    };

    if (payload.name !== undefined) {
      payload.name = payload.name.trim();
    }

    if (payload.description !== undefined) {
      payload.description =
        payload.description?.trim() || null;
    }

    const { data, error } = await this.supabaseService.client
      .from('roles')
      .update(payload)
      .eq('id', id)
      .select(`
        id,
        name,
        description,
        active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(
        this.getDatabaseErrorMessage(error)
      );
    }

    return data as RoleItem;
  }

  async changeStatus(
    role: RoleItem
  ): Promise<RoleItem> {
    if (role.id === 1) {
      throw new Error(
        'El rol Administrador no puede desactivarse.'
      );
    }

    return this.updateRole(role.id, {
      active: !role.active
    });
  }

  async deleteRole(role: RoleItem): Promise<void> {
    if (role.id === 1) {
      throw new Error(
        'El rol Administrador no puede eliminarse.'
      );
    }

    if ((role.users_count ?? 0) > 0) {
      throw new Error(
        'No puedes eliminar este rol porque tiene usuarios asignados.'
      );
    }

    const { error } = await this.supabaseService.client
      .from('roles')
      .delete()
      .eq('id', role.id);

    if (error) {
      throw new Error(
        this.getDatabaseErrorMessage(error)
      );
    }
  }

  private mapRole(row: RoleQueryRow): RoleItem {
    let usersCount = 0;

    if (Array.isArray(row.profiles)) {
      usersCount = row.profiles[0]?.count ?? 0;
    } else if (row.profiles) {
      usersCount = row.profiles.count ?? 0;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      active: row.active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      users_count: usersCount
    };
  }

  private getDatabaseErrorMessage(error: {
    code?: string;
    message: string;
  }): string {
    if (error.code === '23505') {
      return 'Ya existe un rol con ese nombre.';
    }

    if (error.code === '23503') {
      return 'No puedes eliminar este rol porque tiene usuarios asignados.';
    }

    if (error.code === '42501') {
      return 'No tienes permisos para realizar esta operación.';
    }

    return error.message;
  }
}
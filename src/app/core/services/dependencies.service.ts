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

@Injectable({
  providedIn: 'root'
})
export class DependenciesService {
  constructor(
    private readonly supabaseService:
      SupabaseService
  ) {}

  async getDependencies():
    Promise<DependencyItem[]> {
    const { data, error } =
      await this.supabaseService.client
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
        .order('name', {
          ascending: true
        });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(
      (row: unknown) =>
        this.mapDependency(
          row as DependencyRow
        )
    );
  }

  async getDependencyById(
    id: number
  ): Promise<DependencyItem | null> {
    const { data, error } =
      await this.supabaseService.client
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
        .eq('id', id)
        .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return this.mapDependency(
      data as DependencyRow
    );
  }

  async createDependency(
    input: CreateDependencyInput
  ): Promise<DependencyItem> {
    const payload = {
      name: input.name.trim(),
      description:
        input.description?.trim() || null,
      active: input.active
    };

    const { data, error } =
      await this.supabaseService.client
        .from('dependencies')
        .insert(payload)
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

    if (error) {
      throw new Error(
        this.normalizeDatabaseError(
          error.message
        )
      );
    }

    return this.mapDependency(
      data as DependencyRow
    );
  }

  async updateDependency(
    id: number,
    changes: UpdateDependencyInput
  ): Promise<DependencyItem> {
    const payload: UpdateDependencyInput = {
      ...changes
    };

    if (
      typeof payload.name === 'string'
    ) {
      payload.name =
        payload.name.trim();
    }

    if (
      typeof payload.description ===
      'string'
    ) {
      payload.description =
        payload.description.trim() || null;
    }

    const { data, error } =
      await this.supabaseService.client
        .from('dependencies')
        .update(payload)
        .eq('id', id)
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

    if (error) {
      throw new Error(
        this.normalizeDatabaseError(
          error.message
        )
      );
    }

    return this.mapDependency(
      data as DependencyRow
    );
  }

  async changeStatus(
    dependency: DependencyItem
  ): Promise<DependencyItem> {
    return this.updateDependency(
      dependency.id,
      {
        active: !dependency.active
      }
    );
  }

  async deleteDependency(
    dependency: DependencyItem
  ): Promise<void> {
    if (
      dependency.users_count > 0
    ) {
      throw new Error(
        'No puedes eliminar esta dependencia porque tiene usuarios asignados.'
      );
    }

    const { error } =
      await this.supabaseService.client
        .from('dependencies')
        .delete()
        .eq('id', dependency.id);

    if (error) {
      throw new Error(
        this.normalizeDatabaseError(
          error.message
        )
      );
    }
  }

  private mapDependency(
    row: DependencyRow
  ): DependencyItem {
    const usersCount =
      Array.isArray(row.profiles) &&
      row.profiles.length > 0
        ? Number(
            row.profiles[0]?.count ?? 0
          )
        : 0;

    return {
      id: row.id,
      name: row.name,
      description:
        row.description ?? null,
      active: row.active,
      created_at: row.created_at,
      updated_at:
        row.updated_at ?? null,
      users_count: usersCount
    };
  }

  private normalizeDatabaseError(
    message: string
  ): string {
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
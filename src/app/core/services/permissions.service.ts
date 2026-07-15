import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PermissionItem {
  id: number;
  module: string;
  action: string;
  code: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionGroup {
  module: string;
  permissions: PermissionItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  constructor(
    private readonly supabaseService: SupabaseService
  ) {}

  async getPermissions(): Promise<PermissionItem[]> {
    const { data, error } =
      await this.supabaseService.client
        .from('permissions')
        .select(`
          id,
          module,
          action,
          code,
          description,
          active,
          created_at,
          updated_at
        `)
        .eq('active', true)
        .order('module', {
          ascending: true
        })
        .order('action', {
          ascending: true
        });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PermissionItem[];
  }

  async getRolePermissionIds(
    roleId: number
  ): Promise<number[]> {
    const { data, error } =
      await this.supabaseService.client
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(
      (item: { permission_id: number }) =>
        item.permission_id
    );
  }

  async saveRolePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<void> {
    const {
      error: deleteError
    } = await this.supabaseService.client
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (permissionIds.length === 0) {
      return;
    }

    const rows = permissionIds.map(
      (permissionId) => ({
        role_id: roleId,
        permission_id: permissionId
      })
    );

    const {
      error: insertError
    } = await this.supabaseService.client
      .from('role_permissions')
      .insert(rows);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  async getCurrentUserPermissions(): Promise<string[]> {
    const { data, error } =
      await this.supabaseService.client
        .rpc('current_user_permissions');

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(
      (item: { code: string }) =>
        item.code
    );
  }

  groupByModule(
    permissions: PermissionItem[]
  ): PermissionGroup[] {
    const groups = new Map<
      string,
      PermissionItem[]
    >();

    for (const permission of permissions) {
      const items =
        groups.get(permission.module) ?? [];

      items.push(permission);
      groups.set(permission.module, items);
    }

    return Array.from(groups.entries()).map(
      ([module, modulePermissions]) => ({
        module,
        permissions: modulePermissions
      })
    );
  }
}
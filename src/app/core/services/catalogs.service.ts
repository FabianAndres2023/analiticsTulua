import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase.service';


export interface Role {
  id: number;
  name: string;
  description: string | null;
}


export interface Dependency {
  id: number;
  name: string;
  description: string | null;
}


@Injectable({
  providedIn: 'root'
})
export class CatalogsService {

  constructor(
    private readonly supabaseService:
      SupabaseService
  ) {}


  /* =======================================================
   * ROLES
   * ======================================================= */

  async getRoles():
    Promise<Role[]> {

    const {
      data,
      error
    } =
      await this.supabaseService
        .client
        .from('roles')
        .select(`
          id,
          name,
          description
        `)
        .order(
          'name',
          {
            ascending: true
          }
        );


    if (error) {
      throw new Error(
        error.message
      );
    }


    return (
      data ?? []
    ) as Role[];

  }


  /* =======================================================
   * ROLES ACTIVOS
   * ======================================================= */

  async getActiveRoles():
    Promise<Role[]> {

    const {
      data,
      error
    } =
      await this.supabaseService
        .client
        .from('roles')
        .select(`
          id,
          name,
          description
        `)
        .eq(
          'active',
          true
        )
        .order(
          'name',
          {
            ascending: true
          }
        );


    if (error) {
      throw new Error(
        error.message
      );
    }


    return (
      data ?? []
    ) as Role[];

  }


  /* =======================================================
   * DEPENDENCIAS
   * ======================================================= */

  async getDependencies():
    Promise<Dependency[]> {

    const {
      data,
      error
    } =
      await this.supabaseService
        .client
        .from('dependencies')
        .select(`
          id,
          name,
          description
        `)
        .order(
          'name',
          {
            ascending: true
          }
        );


    if (error) {
      throw new Error(
        error.message
      );
    }


    return (
      data ?? []
    ) as Dependency[];

  }


  /* =======================================================
   * DEPENDENCIAS ACTIVAS
   * ======================================================= */

  async getActiveDependencies():
    Promise<Dependency[]> {

    const {
      data,
      error
    } =
      await this.supabaseService
        .client
        .from('dependencies')
        .select(`
          id,
          name,
          description
        `)
        .eq(
          'active',
          true
        )
        .order(
          'name',
          {
            ascending: true
          }
        );


    if (error) {
      throw new Error(
        error.message
      );
    }


    return (
      data ?? []
    ) as Dependency[];

  }

}
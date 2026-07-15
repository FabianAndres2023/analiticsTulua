import {
  Injectable,
  signal
} from '@angular/core';

import { Router } from '@angular/router';

import {
  AuthResponse,
  Session,
  User
} from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';
import { PermissionsService } from './permissions.service';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role_id: number | null;
  dependency_id: number | null;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly currentUser =
    signal<User | null>(null);

  readonly currentProfile =
    signal<UserProfile | null>(null);

  readonly currentPermissions =
    signal<Set<string>>(new Set<string>());

  readonly loadingProfile =
    signal(false);

  readonly loadingPermissions =
    signal(false);

  private profileLoaded = false;
  private permissionsLoaded = false;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly permissionsService: PermissionsService,
    private readonly router: Router
  ) {}

  async login(
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const response =
      await this.supabaseService.client.auth
        .signInWithPassword({
          email,
          password
        });

    if (!response.error) {
      this.resetCachedData();

      await this.loadCurrentProfile(true);
      await this.loadCurrentPermissions(true);
    }

    return response;
  }

  async logout(): Promise<void> {
    const { error } =
      await this.supabaseService.client.auth
        .signOut();

    if (error) {
      console.error(
        'Error al cerrar sesión:',
        error.message
      );

      return;
    }

    this.clearSessionData();

    await this.router.navigate([
      '/login'
    ]);
  }

  async getSession(): Promise<Session | null> {
    const { data, error } =
      await this.supabaseService.client.auth
        .getSession();

    if (error) {
      console.error(
        'Error al obtener la sesión:',
        error.message
      );

      return null;
    }

    return data.session;
  }

  async getUser(): Promise<User | null> {
    const cachedUser =
      this.currentUser();

    if (cachedUser) {
      return cachedUser;
    }

    const {
      data: { user },
      error
    } =
      await this.supabaseService.client.auth
        .getUser();

    if (error) {
      console.error(
        'Error al obtener el usuario:',
        error.message
      );

      this.currentUser.set(null);

      return null;
    }

    this.currentUser.set(user);

    return user;
  }

  async loadCurrentProfile(
    forceReload = false
  ): Promise<UserProfile | null> {
    if (
      this.profileLoaded &&
      !forceReload
    ) {
      return this.currentProfile();
    }

    this.loadingProfile.set(true);

    try {
      const user =
        await this.getUser();

      if (!user) {
        this.currentProfile.set(null);
        this.profileLoaded = false;

        return null;
      }

      const { data, error } =
        await this.supabaseService.client
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            role_id,
            dependency_id,
            active
          `)
          .eq('id', user.id)
          .maybeSingle();

      if (error) {
        console.error(
          'Error al cargar el perfil:',
          error.message
        );

        this.currentProfile.set(null);
        this.profileLoaded = false;

        return null;
      }

      const profile =
        data as UserProfile | null;

      this.currentProfile.set(profile);
      this.profileLoaded = true;

      if (!profile?.active) {
        this.currentPermissions.set(
          new Set<string>()
        );

        this.permissionsLoaded = false;
      }

      return profile;
    } catch (error) {
      console.error(
        'Error inesperado cargando el perfil:',
        error
      );

      this.currentProfile.set(null);
      this.profileLoaded = false;

      return null;
    } finally {
      this.loadingProfile.set(false);
    }
  }

  async loadCurrentPermissions(
    forceReload = false
  ): Promise<string[]> {
    if (
      this.permissionsLoaded &&
      !forceReload
    ) {
      return Array.from(
        this.currentPermissions()
      );
    }

    this.loadingPermissions.set(true);

    try {
      const profile =
        await this.loadCurrentProfile();

      if (!profile || !profile.active) {
        this.currentPermissions.set(
          new Set<string>()
        );

        this.permissionsLoaded = false;

        console.warn(
          'No se cargaron permisos porque el perfil no existe o está inactivo.'
        );

        return [];
      }

      const permissions =
        await this.permissionsService
          .getCurrentUserPermissions();

      this.currentPermissions.set(
        new Set(permissions)
      );

      console.log(
        'Permisos cargados:',
        permissions
      );

      this.permissionsLoaded = true;

      return permissions;
    } catch (error) {
      console.error(
        'Error cargando permisos del usuario:',
        error
      );

      this.currentPermissions.set(
        new Set<string>()
      );

      this.permissionsLoaded = false;

      return [];
    } finally {
      this.loadingPermissions.set(false);
    }
  }

  async initializeSession(): Promise<void> {
    const session =
      await this.getSession();

    if (!session) {
      this.clearSessionData();

      return;
    }

    this.currentUser.set(
      session.user
    );

    await this.loadCurrentProfile(true);
    await this.loadCurrentPermissions(true);
  }

  async getCurrentProfile(): Promise<UserProfile | null> {
    return await this.loadCurrentProfile();
  }

  async getCurrentPermissions(): Promise<string[]> {
    return await this.loadCurrentPermissions();
  }

  hasPermission(
    permissionCode: string
  ): boolean {
    /*
     * El Administrador activo siempre
     * conserva acceso total.
     */
    if (this.isAdministrator()) {
      return true;
    }

    return this.currentPermissions()
      .has(permissionCode);
  }

  hasAnyPermission(
    permissionCodes: string[]
  ): boolean {
    if (this.isAdministrator()) {
      return true;
    }

    return permissionCodes.some(
      (permissionCode) =>
        this.currentPermissions()
          .has(permissionCode)
    );
  }

  hasAllPermissions(
    permissionCodes: string[]
  ): boolean {
    if (this.isAdministrator()) {
      return true;
    }

    return permissionCodes.every(
      (permissionCode) =>
        this.currentPermissions()
          .has(permissionCode)
    );
  }

  isAdministrator(): boolean {
    const profile =
      this.currentProfile();

    return (
      profile?.role_id === 1 &&
      profile.active === true
    );
  }

  async refreshAuthorization(): Promise<void> {
    this.profileLoaded = false;
    this.permissionsLoaded = false;

    await this.loadCurrentProfile(true);
    await this.loadCurrentPermissions(true);
  }

  clearAuthorizationData(): void {
    this.currentPermissions.set(
      new Set<string>()
    );

    this.permissionsLoaded = false;
  }

  private resetCachedData(): void {
    this.profileLoaded = false;
    this.permissionsLoaded = false;

    this.currentProfile.set(null);

    this.currentPermissions.set(
      new Set<string>()
    );
  }

  private clearSessionData(): void {
    this.currentUser.set(null);

    this.currentProfile.set(null);

    this.currentPermissions.set(
      new Set<string>()
    );

    this.profileLoaded = false;
    this.permissionsLoaded = false;
  }
}
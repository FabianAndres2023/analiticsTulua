import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthResponse,
  Session,
  User
} from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

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
  readonly currentUser = signal<User | null>(null);
  readonly currentProfile = signal<UserProfile | null>(null);
  readonly loadingProfile = signal(false);

  private profileLoaded = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async login(
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const response =
      await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

    if (!response.error) {
      this.profileLoaded = false;
      await this.loadCurrentProfile(true);
    }

    return response;
  }

  async logout(): Promise<void> {
    const { error } =
      await this.supabaseService.client.auth.signOut();

    if (error) {
      console.error(
        'Error al cerrar sesión:',
        error.message
      );

      return;
    }

    this.currentUser.set(null);
    this.currentProfile.set(null);
    this.profileLoaded = false;

    await this.router.navigate(['/login']);
  }

  async getSession(): Promise<Session | null> {
    const { data, error } =
      await this.supabaseService.client.auth.getSession();

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
    const cachedUser = this.currentUser();

    if (cachedUser) {
      return cachedUser;
    }

    const {
      data: { user },
      error
    } = await this.supabaseService.client.auth.getUser();

    if (error) {
      console.error(
        'Error al obtener el usuario:',
        error.message
      );

      return null;
    }

    this.currentUser.set(user);

    return user;
  }

  async loadCurrentProfile(
    forceReload = false
  ): Promise<UserProfile | null> {
    if (this.profileLoaded && !forceReload) {
      return this.currentProfile();
    }

    this.loadingProfile.set(true);

    try {
      const user = await this.getUser();

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

        return null;
      }

      const profile = data as UserProfile | null;

      this.currentProfile.set(profile);
      this.profileLoaded = true;

      return profile;
    } catch (error) {
      console.error(
        'Error inesperado cargando el perfil:',
        error
      );

      this.currentProfile.set(null);

      return null;
    } finally {
      this.loadingProfile.set(false);
    }
  }

  async getCurrentProfile(): Promise<UserProfile | null> {
    return await this.loadCurrentProfile();
  }
}
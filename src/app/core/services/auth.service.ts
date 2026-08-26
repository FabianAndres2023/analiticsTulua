import {
  Injectable,
  signal
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  AuthResponse,
  Session,
  User
} from '@supabase/supabase-js';

import {
  SupabaseService
} from './supabase.service';

import {
  PermissionsService
} from './permissions.service';


/* =========================================================
 * INTERFACES
 * ========================================================= */

export interface UserProfile {

  id: string;

  full_name: string;

  email: string;

  role_id: number | null;

  dependency_id: number | null;

  active: boolean;
}


/* =========================================================
 * SERVICIO
 * ========================================================= */

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  /* =======================================================
   * ESTADO REACTIVO
   * ======================================================= */

  readonly currentUser =
    signal<User | null>(
      null
    );


  readonly currentProfile =
    signal<UserProfile | null>(
      null
    );


  readonly currentPermissions =
    signal<Set<string>>(
      new Set<string>()
    );


  readonly loadingProfile =
    signal(
      false
    );


  readonly loadingPermissions =
    signal(
      false
    );


  /* =======================================================
   * CACHE
   * ======================================================= */

  private profileLoaded =
    false;


  private permissionsLoaded =
    false;


  /* =======================================================
   * CONSTRUCTOR
   * ======================================================= */

  constructor(

    private readonly supabaseService:
      SupabaseService,

    private readonly permissionsService:
      PermissionsService,

    private readonly router:
      Router

  ) {}


  /* =======================================================
   * CLIENTE SUPABASE
   * ======================================================= */

  private get supabase() {

    return this
      .supabaseService
      .client;
  }


  /* =======================================================
   * LOGIN
   * ======================================================= */

  async login(
    email: string,
    password: string
  ): Promise<AuthResponse> {


    /*
     * Limpiamos solamente la autorización almacenada
     * antes de iniciar un nuevo proceso de autenticación.
     */

    this.resetAuthorizationCache();


    const inicio =
      performance.now();


    try {


      /* =====================================================
       * AUTENTICACIÓN SUPABASE
       * ===================================================== */

      const response =
        await this.supabase
          .auth
          .signInWithPassword({

            email:
              email
                .trim()
                .toLowerCase(),

            password

          });


      const duracion =
        Math.round(
          performance.now() -
          inicio
        );


      /*
       * Este log nos permite comprobar cuánto tarda
       * realmente Supabase en responder.
       *
       * Lo puedes retirar después de las pruebas.
       */

      console.log(
        `Autenticación Supabase: ${duracion} ms`
      );


      /* =====================================================
       * CREDENCIALES INVÁLIDAS
       * ===================================================== */

      if (
        response.error
      ) {


        /*
         * Si Supabase rechaza las credenciales,
         * NO consultamos:
         *
         * - profiles
         * - roles
         * - permissions
         * - getUser()
         *
         * Por lo tanto la respuesta termina aquí.
         */

        this.clearSessionData();


        return response;
      }


      /* =====================================================
       * USUARIO AUTENTICADO
       * ===================================================== */

      const user =
        response.data.user;


      /*
       * signInWithPassword ya devuelve el usuario.
       *
       * Antes se llamaba posteriormente a getUser(),
       * generando una petición adicional a Supabase.
       */

      this.currentUser.set(
        user
      );


      /* =====================================================
       * PERFIL
       * ===================================================== */

      await this
        .loadCurrentProfile(
          true
        );


      /* =====================================================
       * PERMISOS
       * ===================================================== */

      await this
        .loadCurrentPermissions(
          true
        );


      return response;


    } catch (
      error
    ) {


      console.error(
        'Error inesperado durante la autenticación:',
        error
      );


      /*
       * Importante:
       * AuthResponse es producido por Supabase.
       *
       * Una excepción de red debe propagarse para que
       * el componente Login pueda mostrar el mensaje
       * correspondiente mediante su try/catch.
       */

      this.clearSessionData();


      throw error;
    }
  }


  /* =======================================================
   * LOGOUT
   * ======================================================= */

  async logout():
    Promise<void> {


    try {


      const {
        error
      } =
        await this.supabase
          .auth
          .signOut();


      if (
        error
      ) {


        console.error(
          'Error al cerrar sesión:',
          error.message
        );


        return;
      }


      this
        .clearSessionData();


      await this.router
        .navigate(
          [
            '/login'
          ]
        );


    } catch (
      error
    ) {


      console.error(
        'Error inesperado cerrando sesión:',
        error
      );
    }
  }


  /* =======================================================
   * SESIÓN
   * ======================================================= */

  async getSession():
    Promise<Session | null> {


    try {


      const {
        data,
        error
      } =
        await this.supabase
          .auth
          .getSession();


      if (
        error
      ) {


        console.error(
          'Error al obtener la sesión:',
          error.message
        );


        return null;
      }


      return data.session;


    } catch (
      error
    ) {


      console.error(
        'Error inesperado obteniendo la sesión:',
        error
      );


      return null;
    }
  }


  /* =======================================================
   * USUARIO
   * ======================================================= */

  async getUser():
    Promise<User | null> {


    /*
     * Primero utilizamos el usuario almacenado.
     *
     * Evitamos una petición adicional cuando ya
     * conocemos el usuario autenticado.
     */

    const cachedUser =
      this.currentUser();


    if (
      cachedUser
    ) {

      return cachedUser;
    }


    try {


      const {
        data: {
          user
        },
        error
      } =
        await this.supabase
          .auth
          .getUser();


      if (
        error
      ) {


        console.error(
          'Error al obtener el usuario:',
          error.message
        );


        this.currentUser.set(
          null
        );


        return null;
      }


      this.currentUser.set(
        user
      );


      return user;


    } catch (
      error
    ) {


      console.error(
        'Error inesperado obteniendo el usuario:',
        error
      );


      this.currentUser.set(
        null
      );


      return null;
    }
  }


  /* =======================================================
   * PERFIL
   * ======================================================= */

  async loadCurrentProfile(
    forceReload = false
  ): Promise<UserProfile | null> {


    if (
      this.profileLoaded &&
      !forceReload
    ) {

      return this
        .currentProfile();
    }


    this.loadingProfile.set(
      true
    );


    try {


      const user =
        await this
          .getUser();


      if (
        !user
      ) {


        this.currentProfile.set(
          null
        );


        this.profileLoaded =
          false;


        return null;
      }


      const {
        data,
        error
      } =
        await this.supabase

          .from(
            'profiles'
          )

          .select(`
            id,
            full_name,
            email,
            role_id,
            dependency_id,
            active
          `)

          .eq(
            'id',
            user.id
          )

          .maybeSingle();


      if (
        error
      ) {


        console.error(
          'Error al cargar el perfil:',
          error.message
        );


        this.currentProfile.set(
          null
        );


        this.profileLoaded =
          false;


        return null;
      }


      const profile =
        data as
          UserProfile |
          null;


      this.currentProfile.set(
        profile
      );


      this.profileLoaded =
        true;


      /* =====================================================
       * PERFIL INACTIVO
       * ===================================================== */

      if (
        !profile?.active
      ) {


        this.currentPermissions.set(
          new Set<string>()
        );


        this.permissionsLoaded =
          false;
      }


      return profile;


    } catch (
      error
    ) {


      console.error(
        'Error inesperado cargando el perfil:',
        error
      );


      this.currentProfile.set(
        null
      );


      this.profileLoaded =
        false;


      return null;


    } finally {


      this.loadingProfile.set(
        false
      );
    }
  }


  /* =======================================================
   * PERMISOS
   * ======================================================= */

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


    this.loadingPermissions.set(
      true
    );


    try {


      /*
       * Si el perfil ya fue cargado durante login(),
       * este método retorna la copia almacenada y
       * no realiza otra consulta.
       */

      const profile =
        await this
          .loadCurrentProfile();


      if (
        !profile ||
        !profile.active
      ) {


        this.currentPermissions.set(
          new Set<string>()
        );


        this.permissionsLoaded =
          false;


        console.warn(
          'No se cargaron permisos porque el perfil no existe o está inactivo.'
        );


        return [];
      }


      /* =====================================================
       * ADMINISTRADOR
       * ===================================================== */

      /*
       * El administrador ya tiene acceso total mediante
       * hasPermission(), hasAnyPermission() y
       * hasAllPermissions().
       *
       * Sin embargo dejamos la carga normal de permisos
       * para mantener compatibilidad con el resto de la
       * aplicación.
       */


      const permissions =
        await this
          .permissionsService
          .getCurrentUserPermissions();


      this.currentPermissions.set(
        new Set(
          permissions
        )
      );


      this.permissionsLoaded =
        true;


      console.log(
        'Permisos cargados:',
        permissions
      );


      return permissions;


    } catch (
      error
    ) {


      console.error(
        'Error cargando permisos del usuario:',
        error
      );


      this.currentPermissions.set(
        new Set<string>()
      );


      this.permissionsLoaded =
        false;


      return [];


    } finally {


      this.loadingPermissions.set(
        false
      );
    }
  }


  /* =======================================================
   * INICIALIZAR SESIÓN
   * ======================================================= */

  async initializeSession():
    Promise<void> {


    const session =
      await this
        .getSession();


    if (
      !session
    ) {


      this
        .clearSessionData();


      return;
    }


    /*
     * getSession ya contiene el usuario,
     * así que tampoco necesitamos getUser().
     */

    this.currentUser.set(
      session.user
    );


    this.resetAuthorizationCache(
      false
    );


    await this
      .loadCurrentProfile(
        true
      );


    await this
      .loadCurrentPermissions(
        true
      );
  }


  /* =======================================================
   * OBTENER PERFIL
   * ======================================================= */

  async getCurrentProfile():
    Promise<UserProfile | null> {


    return await this
      .loadCurrentProfile();
  }


  /* =======================================================
   * OBTENER PERMISOS
   * ======================================================= */

  async getCurrentPermissions():
    Promise<string[]> {


    return await this
      .loadCurrentPermissions();
  }


  /* =======================================================
   * PERMISOS
   * ======================================================= */

  hasPermission(
    permissionCode: string
  ): boolean {


    /*
     * Administrador activo:
     * acceso completo.
     */

    if (
      this.isAdministrator()
    ) {

      return true;
    }


    return this
      .currentPermissions()
      .has(
        permissionCode
      );
  }


  hasAnyPermission(
    permissionCodes: string[]
  ): boolean {


    if (
      this.isAdministrator()
    ) {

      return true;
    }


    return permissionCodes
      .some(
        permissionCode =>

          this
            .currentPermissions()
            .has(
              permissionCode
            )
      );
  }


  hasAllPermissions(
    permissionCodes: string[]
  ): boolean {


    if (
      this.isAdministrator()
    ) {

      return true;
    }


    return permissionCodes
      .every(
        permissionCode =>

          this
            .currentPermissions()
            .has(
              permissionCode
            )
      );
  }


  /* =======================================================
   * ADMINISTRADOR
   * ======================================================= */

  isAdministrator():
    boolean {


    const profile =
      this.currentProfile();


    return (

      profile?.role_id ===
        1

      &&

      profile.active ===
        true

    );
  }


  /* =======================================================
   * REFRESCAR AUTORIZACIÓN
   * ======================================================= */

  async refreshAuthorization():
    Promise<void> {


    this.profileLoaded =
      false;


    this.permissionsLoaded =
      false;


    await this
      .loadCurrentProfile(
        true
      );


    await this
      .loadCurrentPermissions(
        true
      );
  }


  /* =======================================================
   * LIMPIAR PERMISOS
   * ======================================================= */

  clearAuthorizationData():
    void {


    this.currentPermissions.set(
      new Set<string>()
    );


    this.permissionsLoaded =
      false;
  }


  /* =======================================================
   * RESET CACHE AUTORIZACIÓN
   * ======================================================= */

  private resetAuthorizationCache(
    clearProfile = true
  ):
    void {


    this.profileLoaded =
      false;


    this.permissionsLoaded =
      false;


    if (
      clearProfile
    ) {

      this.currentProfile.set(
        null
      );
    }


    this.currentPermissions.set(
      new Set<string>()
    );
  }


  /* =======================================================
   * LIMPIAR TODA LA SESIÓN LOCAL
   * ======================================================= */

  private clearSessionData():
    void {


    this.currentUser.set(
      null
    );


    this.currentProfile.set(
      null
    );


    this.currentPermissions.set(
      new Set<string>()
    );


    this.profileLoaded =
      false;


    this.permissionsLoaded =
      false;


    this.loadingProfile.set(
      false
    );


    this.loadingPermissions.set(
      false
    );
  }
}
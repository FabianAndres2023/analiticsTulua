import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase.service';


/* =========================================================
 * INTERFACES
 * ========================================================= */

export interface UserRelation {

  id:
    number;

  name:
    string;
}


export interface AuthUserData {

  id:
    string;

  email:
    string |
    null;

  created_at:
    string;

  last_sign_in_at:
    string |
    null;

  email_confirmed_at:
    string |
    null;
}


export interface UserProfile {

  id:
    string;

  full_name:
    string;

  email:
    string;

  role_id:
    number |
    null;

  dependency_id:
    number |
    null;

  active:
    boolean;

  created_at:
    string;

  role:
    UserRelation |
    null;

  dependency:
    UserRelation |
    null;

  auth_created_at?:
    string |
    null;

  last_sign_in_at?:
    string |
    null;

  email_confirmed_at?:
    string |
    null;
}


export interface UpdateUserProfile {

  full_name?:
    string;

  role_id?:
    number |
    null;

  dependency_id?:
    number |
    null;

  active?:
    boolean;
}


export interface CreateUserInput {

  full_name:
    string;

  email:
    string;

  password:
    string;

  role_id:
    number;

  dependency_id:
    number;

  active:
    boolean;
}


/* =========================================================
 * RESPUESTA EDGE FUNCTION
 * ========================================================= */

interface ManageUserResponse {

  message?:
    string;

  error?:
    string;

  users?:
    UserProfile[] |
    AuthUserData[];

  user?:
    UserProfile;
}


/* =========================================================
 * SERVICIO
 * ========================================================= */

@Injectable({
  providedIn: 'root'
})
export class UsersService {


  /* =======================================================
   * CONFIGURACIÓN
   * ======================================================= */

  private readonly functionTimeoutMs =
    10000;


  /* =======================================================
   * CONSTRUCTOR
   * ======================================================= */

  constructor(

    private readonly supabaseService:
      SupabaseService

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
   * OBTENER USUARIOS
   *
   * Toda la consulta administrativa pasa por manage-user.
   * La Edge Function utiliza service_role.
   * ======================================================= */

  async getUsers():
    Promise<UserProfile[]> {


    const response =
      await this
        .invokeFunction(
          'manage-user',
          {
            action:
              'get-users'
          }
        );


    const users =
      response.users;


    if (
      !Array.isArray(
        users
      )
    ) {

      return [];
    }


    return users as
      UserProfile[];
  }


  /* =======================================================
   * COMPATIBILIDAD CON usuarios.ts
   * ======================================================= */

  async getUsersWithAuthData():
    Promise<UserProfile[]> {


    /*
     * manage-user/get-users ya devuelve:
     *
     * - profile
     * - role
     * - dependency
     * - created_at Auth
     * - último inicio de sesión
     *
     * Así que no necesitamos hacer dos consultas.
     */

    return await this
      .getUsers();
  }


  /* =======================================================
   * CREAR USUARIO
   * ======================================================= */

  async createUser(
    input:
      CreateUserInput
  ):
    Promise<void> {


    await this
      .invokeFunction(
        'create-user',
        input
      );
  }


  /* =======================================================
   * ACTUALIZAR PERFIL
   *
   * IMPORTANTE:
   *
   * Ya NO actualizamos profiles directamente.
   *
   * Se utiliza manage-user -> update-profile para que
   * el administrador pueda editar cualquier usuario
   * sin quedar bloqueado por RLS.
   * ======================================================= */

  async updateUser(
    id:
      string,

    changes:
      UpdateUserProfile
  ):
    Promise<UserProfile> {


    const body:
      Record<
        string,
        unknown
      > = {

      action:
        'update-profile',

      user_id:
        id
    };


    /*
     * Solo enviamos las propiedades realmente presentes.
     *
     * Esto es importante para changeStatus(), ya que allí
     * solamente enviamos "active".
     */

    if (
      changes.full_name !==
      undefined
    ) {

      body['full_name'] =
        changes.full_name;
    }


    if (
      changes.role_id !==
      undefined
    ) {

      body['role_id'] =
        changes.role_id;
    }


    if (
      changes.dependency_id !==
      undefined
    ) {

      body['dependency_id'] =
        changes.dependency_id;
    }


    if (
      changes.active !==
      undefined
    ) {

      body['active'] =
        changes.active;
    }


    const response =
      await this
        .invokeFunction(
          'manage-user',
          body
        );


    if (
      !response.user
    ) {

      throw new Error(
        'El usuario fue actualizado, pero no fue posible recuperar su información.'
      );
    }


    /*
     * Conservamos compatibilidad con los campos
     * utilizados por usuarios.html.
     */

    return {

      ...response.user,

      auth_created_at:
        response.user.auth_created_at ??
        response.user.created_at,

      last_sign_in_at:
        response.user.last_sign_in_at ??
        null,

      email_confirmed_at:
        response.user.email_confirmed_at ??
        null
    };
  }


  /* =======================================================
   * CAMBIAR ESTADO
   * ======================================================= */

  async changeStatus(
    id:
      string,

    active:
      boolean
  ):
    Promise<UserProfile> {


    /*
     * Al utilizar updateUser(), esta acción también
     * pasa ahora por la Edge Function administrativa.
     */

    return await this
      .updateUser(
        id,
        {
          active
        }
      );
  }


  /* =======================================================
   * ACTUALIZAR CORREO
   * ======================================================= */

  async updateEmail(
    userId:
      string,

    email:
      string
  ):
    Promise<void> {


    await this
      .invokeFunction(
        'manage-user',
        {

          action:
            'update-email',

          user_id:
            userId,

          email:
            email
              .trim()
              .toLowerCase()

        }
      );
  }


  /* =======================================================
   * RESTABLECER CONTRASEÑA
   * ======================================================= */

  async resetPassword(
    userId:
      string,

    password:
      string
  ):
    Promise<void> {


    await this
      .invokeFunction(
        'manage-user',
        {

          action:
            'reset-password',

          user_id:
            userId,

          password

        }
      );
  }


  /* =======================================================
   * ELIMINAR USUARIO
   * ======================================================= */

  async deleteUser(
    userId:
      string,

    softDelete =
      true
  ):
    Promise<void> {


    await this
      .invokeFunction(
        'manage-user',
        {

          action:
            'delete-user',

          user_id:
            userId,

          soft_delete:
            softDelete

        }
      );
  }


  /* =======================================================
   * OBTENER SOLO AUTH USERS
   * ======================================================= */

  async getAuthUsers():
    Promise<AuthUserData[]> {


    const response =
      await this
        .invokeFunction(
          'manage-user',
          {

            action:
              'get-auth-users'

          }
        );


    const users =
      response.users;


    if (
      !Array.isArray(
        users
      )
    ) {

      return [];
    }


    return users as
      AuthUserData[];
  }


  /* =======================================================
   * INVOCAR EDGE FUNCTION
   * ======================================================= */

  private async invokeFunction(
    functionName:
      string,

    body:
      object
  ):
    Promise<ManageUserResponse> {


    const resultado =
      await this
        .ejecutarConTimeout(

          this.supabase
            .functions
            .invoke(
              functionName,
              {
                body
              }
            ),

          this.functionTimeoutMs

        );


    const {
      data,
      error
    } =
      resultado;


    /* =====================================================
     * ERROR HTTP / EDGE FUNCTION
     * ===================================================== */

    if (
      error
    ) {


      const message =
        await this
          .extractFunctionError(
            error
          );


      throw new Error(
        message
      );
    }


    /* =====================================================
     * RESPUESTA JSON
     * ===================================================== */

    const response =
      (
        data ??
        {}
      ) as
        ManageUserResponse;


    /*
     * La función puede responder HTTP 200 pero incluir
     * explícitamente un campo "error".
     */

    if (
      response.error
    ) {

      throw new Error(
        response.error
      );
    }


    return response;
  }


  /* =======================================================
   * TIMEOUT
   * ======================================================= */

  private ejecutarConTimeout<T>(
    promesa:
      Promise<T>,

    milisegundos:
      number
  ):
    Promise<T> {


    return new Promise<T>(
      (
        resolve,
        reject
      ) => {


        let terminado =
          false;


        const temporizador =
          window.setTimeout(
            () => {


              if (
                terminado
              ) {

                return;
              }


              terminado =
                true;


              reject(
                new Error(
                  'La operación con Supabase superó el tiempo máximo de espera.'
                )
              );

            },
            milisegundos
          );


        promesa

          .then(
            resultado => {


              if (
                terminado
              ) {

                return;
              }


              terminado =
                true;


              window.clearTimeout(
                temporizador
              );


              resolve(
                resultado
              );

            }
          )

          .catch(
            error => {


              if (
                terminado
              ) {

                return;
              }


              terminado =
                true;


              window.clearTimeout(
                temporizador
              );


              reject(
                error
              );

            }
          );
      }
    );
  }


  /* =======================================================
   * LEER ERROR DE EDGE FUNCTION
   * ======================================================= */

  private async extractFunctionError(
    error:
      unknown
  ):
    Promise<string> {


    const fallbackMessage =
      error instanceof Error
        ? error.message
        : 'No fue posible ejecutar la operación.';


    const functionError =
      error as {

        context?:
          Response;

        message?:
          string;

      };


    if (
      !functionError.context
    ) {

      return (
        functionError.message ??
        fallbackMessage
      );
    }


    try {


      const response =
        functionError
          .context
          .clone();


      const responseBody =
        await response
          .json() as {

            error?:
              string;

            message?:
              string;

          };


      return (
        responseBody.error ??
        responseBody.message ??
        fallbackMessage
      );


    } catch {


      return fallbackMessage;
    }
  }
}
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface UserRelation {
  id: number;
  name: string;
}

export interface AuthUserData {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role_id: number | null;
  dependency_id: number | null;
  active: boolean;
  created_at: string;
  role: UserRelation | null;
  dependency: UserRelation | null;

  /**
   * Información obtenida desde Supabase Authentication.
   * Se asignará posteriormente al combinar profiles con auth.users.
   */
  auth_created_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
}

export interface UpdateUserProfile {
  full_name?: string;
  role_id?: number | null;
  dependency_id?: number | null;
  active?: boolean;
}

export interface CreateUserInput {
  full_name: string;
  email: string;
  password: string;
  role_id: number;
  dependency_id: number;
  active: boolean;
}

interface SupabaseUserProfile {
  id: string;
  full_name: string;
  email: string;
  role_id: number | null;
  dependency_id: number | null;
  active: boolean;
  created_at: string;
  role: UserRelation[] | UserRelation | null;
  dependency: UserRelation[] | UserRelation | null;
}

interface ManageUserResponse {
  message?: string;
  error?: string;
  users?: AuthUserData[];
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(
    private readonly supabaseService: SupabaseService
  ) {}

  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role_id,
        dependency_id,
        active,
        created_at,
        role:roles (
          id,
          name
        ),
        dependency:dependencies (
          id,
          name
        )
      `)
      .order('full_name', {
        ascending: true
      });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((user) =>
      this.mapUser(user as SupabaseUserProfile)
    );
  }

  async getUsersWithAuthData(): Promise<UserProfile[]> {
    const [profiles, authUsers] = await Promise.all([
      this.getUsers(),
      this.getAuthUsers()
    ]);

    const authUsersById = new Map(
      authUsers.map((user) => [user.id, user])
    );

    return profiles.map((profile) => {
      const authUser = authUsersById.get(profile.id);

      return {
        ...profile,
        auth_created_at:
          authUser?.created_at ??
          profile.created_at ??
          null,
        last_sign_in_at:
          authUser?.last_sign_in_at ?? null,
        email_confirmed_at:
          authUser?.email_confirmed_at ?? null
      };
    });
  }

  async createUser(
    input: CreateUserInput
  ): Promise<void> {
    await this.invokeFunction(
      'create-user',
      input
    );
  }

  async updateUser(
    id: string,
    changes: UpdateUserProfile
  ): Promise<UserProfile> {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .update(changes)
      .eq('id', id)
      .select(`
        id,
        full_name,
        email,
        role_id,
        dependency_id,
        active,
        created_at,
        role:roles (
          id,
          name
        ),
        dependency:dependencies (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapUser(
      data as SupabaseUserProfile
    );
  }

  async changeStatus(
    id: string,
    active: boolean
  ): Promise<UserProfile> {
    return this.updateUser(id, {
      active
    });
  }

  async updateEmail(
    userId: string,
    email: string
  ): Promise<void> {
    await this.invokeFunction(
      'manage-user',
      {
        action: 'update-email',
        user_id: userId,
        email
      }
    );
  }

  async resetPassword(
    userId: string,
    password: string
  ): Promise<void> {
    await this.invokeFunction(
      'manage-user',
      {
        action: 'reset-password',
        user_id: userId,
        password
      }
    );
  }

  async deleteUser(
    userId: string,
    softDelete = true
  ): Promise<void> {
    await this.invokeFunction(
      'manage-user',
      {
        action: 'delete-user',
        user_id: userId,
        soft_delete: softDelete
      }
    );
  }

  async getAuthUsers(): Promise<AuthUserData[]> {
    const data = await this.invokeFunction(
      'manage-user',
      {
        action: 'get-auth-users'
      }
    );

    return Array.isArray(data.users)
      ? data.users
      : [];
  }
private async invokeFunction(
  functionName: string,
  body: object
): Promise<ManageUserResponse> {

  const { data, error } =
    await this.supabaseService.client.functions.invoke(
      functionName,
      {
        body
      }
    );

  if (error) {
    const message =
      await this.extractFunctionError(error);

    throw new Error(message);
  }

  const response =
    (data ?? {}) as ManageUserResponse;

  if (response.error) {
    throw new Error(response.error);
  }

  return response;
}

  private async extractFunctionError(
    error: unknown
  ): Promise<string> {
    const fallbackMessage =
      error instanceof Error
        ? error.message
        : 'No fue posible ejecutar la operación.';

    const functionError = error as {
      context?: Response;
      message?: string;
    };

    if (!functionError.context) {
      return functionError.message ??
        fallbackMessage;
    }

    try {
      const response =
        functionError.context.clone();

      const responseBody =
        await response.json() as {
          error?: string;
          message?: string;
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

  private mapUser(
    user: SupabaseUserProfile
  ): UserProfile {
    const role = Array.isArray(user.role)
      ? user.role[0] ?? null
      : user.role;

    const dependency = Array.isArray(
      user.dependency
    )
      ? user.dependency[0] ?? null
      : user.dependency;

    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      dependency_id: user.dependency_id,
      active: user.active,
      created_at: user.created_at,
      role,
      dependency,
      auth_created_at: null,
      last_sign_in_at: null,
      email_confirmed_at: null
    };
  }
}
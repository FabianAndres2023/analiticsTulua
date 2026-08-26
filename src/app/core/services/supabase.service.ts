import {
  Injectable
} from '@angular/core';

import {
  createClient,
  SupabaseClient
} from '@supabase/supabase-js';

import {
  environment
} from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {


  /* =======================================================
   * CLIENTE
   * ======================================================= */

  private readonly supabase:
    SupabaseClient;


  /* =======================================================
   * CONSTRUCTOR
   * ======================================================= */

  constructor() {

    this.supabase =
      createClient(

        environment.supabaseUrl,

        environment.supabaseKey,

        {
          auth: {

            /*
             * Mantener la sesión del usuario
             * entre recargas del navegador.
             */

            persistSession:
              true,


            /*
             * Supabase renueva automáticamente
             * el access token.
             */

            autoRefreshToken:
              true,


            /*
             * Permite recuperar sesiones cuando
             * Supabase utiliza parámetros en la URL.
             */

            detectSessionInUrl:
              true

          }
        }

      );
  }


  /* =======================================================
   * CLIENTE PÚBLICO
   * ======================================================= */

  get client():
    SupabaseClient {

    return this.supabase;
  }
}
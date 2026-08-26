import {
  CommonModule
} from '@angular/common';

import {
  Component,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from '../../core/services/auth.service';


@Component({

  selector:
    'app-login',

  standalone:
    true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './login.html',

  styleUrl:
    './login.scss'

})
export class Login {


  /* =======================================================
   * FORMULARIO
   * ======================================================= */

  email =
    '';


  password =
    '';


  /* =======================================================
   * ESTADO REACTIVO
   * ======================================================= */

  readonly loading =
    signal(
      false
    );


  readonly errorMessage =
    signal(
      ''
    );


  /* =======================================================
   * CONSTRUCTOR
   * ======================================================= */

  constructor(

    private readonly authService:
      AuthService,

    private readonly router:
      Router

  ) {}


  /* =======================================================
   * LOGIN
   * ======================================================= */

  async login():
    Promise<void> {


    /* =====================================================
     * EVITAR DOBLE ENVÍO
     * ===================================================== */

    if (
      this.loading()
    ) {

      return;
    }


    /* =====================================================
     * NORMALIZAR DATOS
     * ===================================================== */

    const email =
      this.email
        .trim()
        .toLowerCase();


    /* =====================================================
     * VALIDAR CORREO
     * ===================================================== */

    if (
      !email
    ) {

      this.errorMessage.set(
        'Ingresa tu correo electrónico.'
      );

      return;
    }


    /* =====================================================
     * VALIDAR CONTRASEÑA
     * ===================================================== */

    if (
      !this.password
    ) {

      this.errorMessage.set(
        'Ingresa tu contraseña.'
      );

      return;
    }


    /* =====================================================
     * INICIAR LOGIN
     * ===================================================== */

    this.loading.set(
      true
    );


    this.errorMessage.set(
      ''
    );


    try {


      const response =
        await this.authService
          .login(
            email,
            this.password
          );


      /* ===================================================
       * LOGIN RECHAZADO
       * =================================================== */

      if (
        response.error
      ) {


        console.warn(
          'Inicio de sesión rechazado:',
          {
            code:
              response.error.code,

            message:
              response.error.message,

            status:
              response.error.status
          }
        );


        /* =================================================
         * CREDENCIALES INVÁLIDAS
         * ================================================= */

        if (
          response.error.code ===
            'invalid_credentials'
        ) {


          this.errorMessage.set(
            'Correo electrónico o contraseña incorrectos.'
          );


          return;
        }


        /* =================================================
         * CORREO NO CONFIRMADO
         * ================================================= */

        if (
          response.error.code ===
            'email_not_confirmed'
        ) {


          this.errorMessage.set(
            'El correo electrónico todavía no ha sido confirmado.'
          );


          return;
        }


        /* =================================================
         * RATE LIMIT
         * ================================================= */

        if (
          response.error.status ===
            429
        ) {


          this.errorMessage.set(
            'Se realizaron demasiados intentos. Espera unos segundos e inténtalo nuevamente.'
          );


          return;
        }


        /* =================================================
         * OTRO ERROR DE AUTENTICACIÓN
         * ================================================= */

        this.errorMessage.set(
          'No fue posible iniciar sesión. Verifica tus credenciales.'
        );


        return;
      }


      /* ===================================================
       * LOGIN CORRECTO
       * =================================================== */

      this.errorMessage.set(
        ''
      );


      await this.router
        .navigate(
          [
            '/dashboard'
          ]
        );


    } catch (
      error
    ) {


      console.error(
        'Error inesperado durante el inicio de sesión:',
        error
      );


      this.errorMessage.set(
        'No fue posible conectar con el servicio de autenticación. Inténtalo nuevamente.'
      );


    } finally {


      /*
       * Como loading es un signal,
       * Angular actualizará inmediatamente
       * la interfaz.
       */

      this.loading.set(
        false
      );
    }
  }


  /* =======================================================
   * LIMPIAR ERROR AL ESCRIBIR
   * ======================================================= */

  limpiarError():
    void {


    if (
      this.errorMessage()
    ) {

      this.errorMessage.set(
        ''
      );
    }
  }
}
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
  LucideCircleAlert,
  LucideEye,
  LucideEyeOff,
  LucideLockKeyhole,
  LucideMail,
  LucideShieldCheck
} from '@lucide/angular';

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

    FormsModule,

    LucideCircleAlert,

    LucideEye,

    LucideEyeOff,

    LucideLockKeyhole,

    LucideMail,

    LucideShieldCheck
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


  readonly showPassword =
    signal(
      false
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
   * MOSTRAR / OCULTAR CONTRASEÑA
   * ======================================================= */

  togglePasswordVisibility():
    void {

    if (
      this.loading()
    ) {

      return;
    }


    this.showPassword.update(
      current =>
        !current
    );
  }


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


    if (
      !this.isValidEmail(
        email
      )
    ) {

      this.errorMessage.set(
        'Ingresa un correo electrónico válido.'
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
         * OTRO ERROR
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

      this.loading.set(
        false
      );
    }
  }


  /* =======================================================
   * LIMPIAR ERROR
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


  /* =======================================================
   * VALIDAR CORREO
   * ======================================================= */

  private isValidEmail(
    email:
      string
  ): boolean {

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return emailPattern.test(
      email
    );
  }
}
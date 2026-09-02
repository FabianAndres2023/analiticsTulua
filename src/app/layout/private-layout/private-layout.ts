import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  LucideCar,
  LucideHouse,
  LucideLeaf,
  LucideLogOut,
  LucideMenu,
  LucideSettings,
  LucideTrees,
  LucideX
} from '@lucide/angular';

import {
  AuthService
} from '../../core/services/auth.service';


@Component({

  selector:
    'app-private-layout',

  standalone:
    true,

  imports: [

    RouterOutlet,

    RouterLink,

    RouterLinkActive,

    LucideHouse,

    LucideLeaf,

    LucideCar,

    LucideTrees,

    LucideSettings,

    LucideLogOut,

    LucideMenu,

    LucideX

  ],

  templateUrl:
    './private-layout.html',

  styleUrl:
    './private-layout.scss'

})
export class PrivateLayout implements OnInit {


  /* =======================================================
   * SERVICIOS
   * ======================================================= */

  readonly authService =
    inject(
      AuthService
    );


  /* =======================================================
   * MENÚ MÓVIL
   * ======================================================= */

  readonly mobileMenuOpen =
    signal(
      false
    );


  /* =======================================================
   * USUARIO
   * ======================================================= */

  readonly profile =
    this.authService.currentProfile;


  readonly currentUser =
    this.authService.currentUser;


  readonly loadingUser =
    this.authService.loadingProfile;


  readonly loadingPermissions =
    this.authService.loadingPermissions;


  /* =======================================================
   * PERMISOS
   * ======================================================= */

  readonly puedeVerDashboard =
    computed(
      () =>
        this.authService.hasPermission(
          'dashboard.ver'
        )
    );


  readonly puedeVerAmbiente =
    computed(
      () =>
        this.authService.hasPermission(
          'ambiente.ver'
        )
    );


  readonly puedeVerMovilidad =
    computed(
      () =>
        this.authService.hasPermission(
          'movilidad.ver'
        )
    );


  readonly puedeVerTurismo =
    computed(
      () =>
        this.authService.hasPermission(
          'turismo.ver'
        )
    );


  readonly puedeVerConfiguracion =
    computed(
      () =>
        this.authService.hasAnyPermission(
          [
            'usuarios.ver',
            'roles.ver',
            'dependencias.ver',
            'carga_masiva.ver'
          ]
        )
    );


  /* =======================================================
   * DATOS DEL USUARIO
   * ======================================================= */

  readonly userName =
    computed(
      () => {

        const profile =
          this.profile();


        const user =
          this.currentUser();


        return (

          profile?.full_name?.trim() ||

          user?.user_metadata?.['full_name']?.trim() ||

          user?.user_metadata?.['name']?.trim() ||

          user?.email?.split('@')[0] ||

          'Usuario'

        );
      }
    );


  readonly userEmail =
    computed(
      () => {

        return (

          this.profile()?.email ||

          this.currentUser()?.email ||

          ''

        );
      }
    );


  readonly initials =
    computed(
      () => {

        return this.createInitials(
          this.userName()
        );
      }
    );


  /* =======================================================
   * INICIALIZACIÓN
   * ======================================================= */

  async ngOnInit():
    Promise<void> {

    /*
     * Carga sesión, perfil y permisos.
     *
     * También permite que la aplicación funcione
     * correctamente cuando el navegador se recarga
     * directamente sobre una ruta privada.
     */

    await this.authService
      .initializeSession();
  }


  /* =======================================================
   * MENÚ MÓVIL
   * ======================================================= */

  openMobileMenu():
    void {

    this.mobileMenuOpen.set(
      true
    );
  }


  closeMobileMenu():
    void {

    this.mobileMenuOpen.set(
      false
    );
  }


  toggleMobileMenu():
    void {

    this.mobileMenuOpen.update(
      current =>
        !current
    );
  }


  /* =======================================================
   * INICIALES
   * ======================================================= */

  private createInitials(
    name:
      string
  ): string {

    const words =
      name
        .trim()
        .split(/\s+/)
        .filter(
          Boolean
        );


    if (
      words.length ===
      0
    ) {

      return 'US';
    }


    if (
      words.length ===
      1
    ) {

      return words[0]
        .substring(
          0,
          2
        )
        .toUpperCase();
    }


    return (

      words[0][0] +

      words[
        words.length - 1
      ][0]

    ).toUpperCase();
  }


  /* =======================================================
   * CERRAR SESIÓN
   * ======================================================= */

  async logout():
    Promise<void> {

    this.closeMobileMenu();


    await this.authService
      .logout();
  }

}
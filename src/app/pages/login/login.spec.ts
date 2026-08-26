import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import {
  Router
} from '@angular/router';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import {
  Login
} from './login';

import {
  AuthService
} from '../../core/services/auth.service';


describe(
  'Login',
  () => {

    let component:
      Login;

    let fixture:
      ComponentFixture<Login>;


    /* =======================================================
     * MOCK AUTH SERVICE
     * ======================================================= */

    const authServiceMock = {

      login:
        vi.fn()

    };


    /* =======================================================
     * MOCK ROUTER
     * ======================================================= */

    const routerMock = {

      navigate:
        vi.fn()

    };


    /* =======================================================
     * CONFIGURACIÓN
     * ======================================================= */

    beforeEach(
      async () => {

        vi.clearAllMocks();


        await TestBed
          .configureTestingModule({

            imports: [
              Login
            ],

            providers: [

              {
                provide:
                  AuthService,

                useValue:
                  authServiceMock
              },

              {
                provide:
                  Router,

                useValue:
                  routerMock
              }

            ]

          })
          .compileComponents();


        fixture =
          TestBed.createComponent(
            Login
          );


        component =
          fixture.componentInstance;


        fixture.detectChanges();


        await fixture
          .whenStable();
      }
    );


    /* =======================================================
     * CREACIÓN
     * ======================================================= */

    it(
      'debe crear el componente',
      () => {

        expect(
          component
        )
          .toBeTruthy();
      }
    );


    /* =======================================================
     * ESTADO INICIAL
     * ======================================================= */

    it(
      'debe iniciar con los campos vacíos',
      () => {

        expect(
          component.email
        )
          .toBe('');


        expect(
          component.password
        )
          .toBe('');


        expect(
          component.loading
        )
          .toBe(false);


        expect(
          component.errorMessage
        )
          .toBe('');
      }
    );


    /* =======================================================
     * LOGIN INCORRECTO
     * ======================================================= */

    it(
      'debe mostrar error cuando las credenciales son incorrectas',
      async () => {

        authServiceMock
          .login
          .mockResolvedValue({

            data: {
              user:
                null,

              session:
                null
            },

            error: {
              message:
                'Invalid login credentials'
            }

          });


        component.email =
          'usuario@ejemplo.com';


        component.password =
          'incorrecta';


        await component
          .login();


        expect(
          authServiceMock.login
        )
          .toHaveBeenCalledWith(

            'usuario@ejemplo.com',

            'incorrecta'

          );


        expect(
          component.errorMessage
        )
          .toBe(
            'Correo o contraseña incorrectos'
          );


        expect(
          component.loading
        )
          .toBe(false);


        expect(
          routerMock.navigate
        )
          .not
          .toHaveBeenCalled();
      }
    );


    /* =======================================================
     * LOGIN CORRECTO
     * ======================================================= */

    it(
      'debe navegar al dashboard cuando el login es correcto',
      async () => {

        authServiceMock
          .login
          .mockResolvedValue({

            data: {

              user: {
                id:
                  'usuario-prueba'
              },

              session: {
                access_token:
                  'token-prueba'
              }

            },

            error:
              null

          });


        routerMock
          .navigate
          .mockResolvedValue(
            true
          );


        component.email =
          'usuario@ejemplo.com';


        component.password =
          '123456';


        await component
          .login();


        expect(
          authServiceMock.login
        )
          .toHaveBeenCalledWith(

            'usuario@ejemplo.com',

            '123456'

          );


        expect(
          component.errorMessage
        )
          .toBe('');


        expect(
          component.loading
        )
          .toBe(false);


        expect(
          routerMock.navigate
        )
          .toHaveBeenCalledWith(
            [
              '/dashboard'
            ]
          );
      }
    );


    /* =======================================================
     * LOADING
     * ======================================================= */

    it(
      'debe finalizar el estado loading después de un intento fallido',
      async () => {

        authServiceMock
          .login
          .mockResolvedValue({

            data: {
              user:
                null,

              session:
                null
            },

            error: {
              message:
                'Invalid login credentials'
            }

          });


        component.email =
          'prueba@ejemplo.com';


        component.password =
          'incorrecta';


        await component
          .login();


        expect(
          component.loading
        )
          .toBe(false);
      }
    );

  }
);
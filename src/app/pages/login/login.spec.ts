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


    /* =====================================================
     * MOCK AUTH SERVICE
     * ===================================================== */

    const authServiceMock = {

      login:
        vi.fn()

    };


    /* =====================================================
     * MOCK ROUTER
     * ===================================================== */

    const routerMock = {

      navigate:
        vi.fn()

    };


    /* =====================================================
     * CONFIGURACIÓN
     * ===================================================== */

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


    /* =====================================================
     * CREACIÓN
     * ===================================================== */

    it(
      'debe crear el componente',
      () => {

        expect(
          component
        )
          .toBeTruthy();
      }
    );


    /* =====================================================
     * ESTADO INICIAL
     * ===================================================== */

    it(
      'debe iniciar con el formulario vacío',
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
          component.loading()
        )
          .toBe(false);


        expect(
          component.errorMessage()
        )
          .toBe('');


        expect(
          component.showPassword()
        )
          .toBe(false);
      }
    );


    /* =====================================================
     * MOSTRAR CONTRASEÑA
     * ===================================================== */

    it(
      'debe alternar la visibilidad de la contraseña',
      () => {

        component
          .togglePasswordVisibility();


        expect(
          component.showPassword()
        )
          .toBe(true);


        component
          .togglePasswordVisibility();


        expect(
          component.showPassword()
        )
          .toBe(false);
      }
    );


    /* =====================================================
     * VALIDACIÓN CORREO
     * ===================================================== */

    it(
      'debe solicitar el correo cuando está vacío',
      async () => {

        component.email =
          '';


        component.password =
          '123456';


        await component
          .login();


        expect(
          component.errorMessage()
        )
          .toBe(
            'Ingresa tu correo electrónico.'
          );


        expect(
          authServiceMock.login
        )
          .not
          .toHaveBeenCalled();
      }
    );


    /* =====================================================
     * VALIDACIÓN CONTRASEÑA
     * ===================================================== */

    it(
      'debe solicitar la contraseña cuando está vacía',
      async () => {

        component.email =
          'usuario@ejemplo.com';


        component.password =
          '';


        await component
          .login();


        expect(
          component.errorMessage()
        )
          .toBe(
            'Ingresa tu contraseña.'
          );


        expect(
          authServiceMock.login
        )
          .not
          .toHaveBeenCalled();
      }
    );


    /* =====================================================
     * LOGIN INCORRECTO
     * ===================================================== */

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

              code:
                'invalid_credentials',

              message:
                'Invalid login credentials',

              status:
                400
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
          component.errorMessage()
        )
          .toBe(
            'Correo electrónico o contraseña incorrectos.'
          );


        expect(
          component.loading()
        )
          .toBe(false);


        expect(
          routerMock.navigate
        )
          .not
          .toHaveBeenCalled();
      }
    );


    /* =====================================================
     * LOGIN CORRECTO
     * ===================================================== */

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
          'USUARIO@EJEMPLO.COM';


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
          component.errorMessage()
        )
          .toBe('');


        expect(
          component.loading()
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


    /* =====================================================
     * LIMPIAR ERROR
     * ===================================================== */

    it(
      'debe limpiar el mensaje de error',
      () => {

        component.errorMessage.set(
          'Error de prueba'
        );


        component
          .limpiarError();


        expect(
          component.errorMessage()
        )
          .toBe('');
      }
    );

  }
);
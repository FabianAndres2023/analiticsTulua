import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  CreateUserInput,
  UserProfile,
  UsersService
} from '../../../core/services/users.service';

import {
  CatalogsService,
  Dependency,
  Role
} from '../../../core/services/catalogs.service';

import {
  AuthService
} from '../../../core/services/auth.service';


/* =========================================================
 * INTERFACES
 * ========================================================= */

interface UserEditForm {
  full_name: string;
  email: string;
  role_id: number | null;
  dependency_id: number | null;
  active: boolean;
}


interface UserCreateForm {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role_id: number | null;
  dependency_id: number | null;
  active: boolean;
}


interface PasswordForm {
  password: string;
  confirm_password: string;
}


/* =========================================================
 * COMPONENTE
 * ========================================================= */

@Component({
  selector: 'app-usuarios',
  imports: [
    FormsModule
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios
  implements OnInit {


  /* =======================================================
   * DATOS
   * ======================================================= */

  readonly usuarios =
    signal<UserProfile[]>([]);


  readonly roles =
    signal<Role[]>([]);


  readonly dependencias =
    signal<Dependency[]>([]);


  /* =======================================================
   * ESTADOS DE CARGA
   * ======================================================= */

  readonly cargando =
    signal(false);


  readonly guardando =
    signal(false);


  readonly creando =
    signal(false);


  readonly restableciendoPassword =
    signal(false);


  readonly eliminando =
    signal(false);


  readonly cambiandoEstadoId =
    signal<string | null>(null);


  /* =======================================================
   * MENSAJES
   * ======================================================= */

  readonly errorMessage =
    signal('');


  readonly modalErrorMessage =
    signal('');


  readonly successMessage =
    signal('');


  /* =======================================================
   * FILTROS
   * ======================================================= */

  readonly busqueda =
    signal('');


  readonly filtroEstado =
    signal<
      'todos' |
      'activos' |
      'inactivos'
    >(
      'todos'
    );


  /* =======================================================
   * MODALES
   * ======================================================= */

  readonly modalEditarAbierto =
    signal(false);


  readonly modalCrearAbierto =
    signal(false);


  readonly modalPasswordAbierto =
    signal(false);


  readonly modalEliminarAbierto =
    signal(false);


  readonly usuarioSeleccionado =
    signal<UserProfile | null>(
      null
    );


  readonly mostrarPasswordCreacion =
    signal(false);


  readonly mostrarPasswordNueva =
    signal(false);


  /* =======================================================
   * PERMISOS
   * ======================================================= */

  readonly puedeVerUsuarios =
    computed(
      () =>
        this.authService
          .hasPermission(
            'usuarios.ver'
          )
    );


  readonly puedeCrearUsuarios =
    computed(
      () =>
        this.authService
          .hasPermission(
            'usuarios.crear'
          )
    );


  readonly puedeEditarUsuarios =
    computed(
      () =>
        this.authService
          .hasPermission(
            'usuarios.editar'
          )
    );


  readonly puedeCambiarEstado =
    computed(
      () =>
        this.authService
          .hasPermission(
            'usuarios.estado'
          )
    );


  readonly puedeRestablecerPassword =
    computed(
      () =>
        this.authService
          .hasPermission(
            'usuarios.password'
          )
    );


  readonly puedeEliminarUsuarios =
    computed(
      () =>
        this.authService
          .hasPermission(
            'usuarios.eliminar'
          )
    );


  /* =======================================================
   * FORMULARIOS
   * ======================================================= */

  formularioEdicion:
    UserEditForm = {

      full_name: '',

      email: '',

      role_id: null,

      dependency_id: null,

      active: true

    };


  formularioCreacion:
    UserCreateForm = {

      full_name: '',

      email: '',

      password: '',

      confirm_password: '',

      role_id: null,

      dependency_id: null,

      active: true

    };


  formularioPassword:
    PasswordForm = {

      password: '',

      confirm_password: ''

    };


  /* =======================================================
   * USUARIOS FILTRADOS
   * ======================================================= */

  readonly usuariosFiltrados =
    computed(
      () => {

        const texto =
          this.busqueda()
            .trim()
            .toLowerCase();


        const estado =
          this.filtroEstado();


        return this
          .usuarios()
          .filter(
            (usuario) => {

              const nombre =
                usuario.full_name
                  ?.toLowerCase() ??
                '';


              const correo =
                usuario.email
                  ?.toLowerCase() ??
                '';


              const rol =
                usuario.role?.name
                  ?.toLowerCase() ??
                '';


              const dependencia =
                usuario.dependency?.name
                  ?.toLowerCase() ??
                '';


              const coincideBusqueda =
                nombre.includes(texto) ||
                correo.includes(texto) ||
                rol.includes(texto) ||
                dependencia.includes(texto);


              const coincideEstado =
                estado === 'todos' ||
                (
                  estado === 'activos' &&
                  usuario.active
                ) ||
                (
                  estado === 'inactivos' &&
                  !usuario.active
                );


              return (
                coincideBusqueda &&
                coincideEstado
              );

            }
          );

      }
    );


  /* =======================================================
   * CONSTRUCTOR
   * ======================================================= */

  constructor(

    private readonly usersService:
      UsersService,

    private readonly catalogsService:
      CatalogsService,

    readonly authService:
      AuthService

  ) {}


  /* =======================================================
   * INICIALIZACIÓN
   * ======================================================= */

  async ngOnInit():
    Promise<void> {

    if (
      !this.puedeVerUsuarios()
    ) {

      this.errorMessage.set(
        'No tienes permiso para consultar usuarios.'
      );

      return;

    }


    await Promise.all([

      this.cargarUsuarios(),

      this.cargarCatalogos()

    ]);

  }


  /* =======================================================
   * CARGAR USUARIOS
   * ======================================================= */

  async cargarUsuarios():
    Promise<void> {

    if (
      !this.verificarPermiso(
        'usuarios.ver',
        'No tienes permiso para consultar usuarios.'
      )
    ) {

      return;

    }


    this.cargando.set(
      true
    );


    this.errorMessage.set(
      ''
    );


    try {

      const usuarios =
        await this.usersService
          .getUsersWithAuthData();


      this.usuarios.set(
        usuarios
      );


    } catch (
      error
    ) {

      console.error(
        'Error cargando usuarios:',
        error
      );


      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cargar los usuarios.'
        )
      );


    } finally {

      this.cargando.set(
        false
      );

    }

  }


  /* =======================================================
   * CARGAR CATÁLOGOS
   * ======================================================= */

  async cargarCatalogos():
    Promise<void> {

    if (
      !this.puedeVerUsuarios()
    ) {
      return;
    }


    try {

      const [
        roles,
        dependencias
      ] =
        await Promise.all([

          this.catalogsService
            .getActiveRoles(),

          this.catalogsService
            .getActiveDependencies()

        ]);


      this.roles.set(
        roles
      );


      this.dependencias.set(
        dependencias
      );


    } catch (
      error
    ) {

      console.error(
        'Error cargando catálogos:',
        error
      );


      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cargar roles y dependencias.'
        )
      );

    }

  }


  /* =======================================================
   * CREAR USUARIO
   * ======================================================= */

  nuevoUsuario():
    void {

    if (
      !this.verificarPermiso(
        'usuarios.crear',
        'No tienes permiso para crear usuarios.'
      )
    ) {

      return;

    }


    this.limpiarMensajes();

    this.limpiarErrorModal();


    this.formularioCreacion = {

      full_name: '',

      email: '',

      password: '',

      confirm_password: '',

      role_id: null,

      dependency_id: null,

      active: true

    };


    this.mostrarPasswordCreacion
      .set(
        false
      );


    this.modalCrearAbierto
      .set(
        true
      );

  }


  cerrarModalCrear():
    void {

    if (
      this.creando()
    ) {

      return;

    }


    this.modalCrearAbierto
      .set(
        false
      );


    this.limpiarErrorModal();

  }


  async crearUsuario():
    Promise<void> {

    if (
      !this.verificarPermisoModal(
        'usuarios.crear',
        'No tienes permiso para crear usuarios.'
      )
    ) {

      return;

    }


    this.limpiarErrorModal();


    const fullName =
      this.formularioCreacion
        .full_name
        .trim();


    const email =
      this.formularioCreacion
        .email
        .trim()
        .toLowerCase();


    const password =
      this.formularioCreacion
        .password;


    if (
      !fullName
    ) {

      this.modalErrorMessage.set(
        'El nombre completo es obligatorio.'
      );

      return;

    }


    if (
      !this.esCorreoValido(
        email
      )
    ) {

      this.modalErrorMessage.set(
        'Ingresa un correo electrónico válido.'
      );

      return;

    }


    if (
      password.length <
      8
    ) {

      this.modalErrorMessage.set(
        'La contraseña debe tener al menos 8 caracteres.'
      );

      return;

    }


    if (
      password !==
      this.formularioCreacion
        .confirm_password
    ) {

      this.modalErrorMessage.set(
        'Las contraseñas no coinciden.'
      );

      return;

    }


    if (
      this.formularioCreacion
        .role_id ===
      null
    ) {

      this.modalErrorMessage.set(
        'Debes seleccionar un rol.'
      );

      return;

    }


    if (
      this.formularioCreacion
        .dependency_id ===
      null
    ) {

      this.modalErrorMessage.set(
        'Debes seleccionar una dependencia.'
      );

      return;

    }


    const input:
      CreateUserInput = {

        full_name:
          fullName,

        email,

        password,

        role_id:
          this.formularioCreacion
            .role_id,

        dependency_id:
          this.formularioCreacion
            .dependency_id,

        active:
          this.formularioCreacion
            .active

      };


    this.creando.set(
      true
    );


    this.successMessage.set(
      ''
    );


    try {

      await this.usersService
        .createUser(
          input
        );


      await this
        .cargarUsuarios();


      this.modalCrearAbierto
        .set(
          false
        );


      this.limpiarErrorModal();


      this.successMessage.set(
        'El usuario fue creado correctamente.'
      );


    } catch (
      error
    ) {

      console.error(
        'Error creando usuario:',
        error
      );


      this.modalErrorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible crear el usuario.'
        )
      );


    } finally {

      this.creando.set(
        false
      );

    }

  }


  /* =======================================================
   * EDITAR USUARIO
   * ======================================================= */

  editarUsuario(
    usuario:
      UserProfile
  ):
    void {

    if (
      !this.verificarPermiso(
        'usuarios.editar',
        'No tienes permiso para editar usuarios.'
      )
    ) {

      return;

    }


    this.limpiarMensajes();

    this.limpiarErrorModal();


    this.usuarioSeleccionado
      .set(
        usuario
      );


    this.formularioEdicion = {

      full_name:
        usuario.full_name ??
        '',

      email:
        usuario.email ??
        '',

      role_id:
        usuario.role_id,

      dependency_id:
        usuario.dependency_id,

      active:
        usuario.active

    };


    this.modalEditarAbierto
      .set(
        true
      );

  }


  cerrarModalEditar():
    void {

    if (
      this.guardando()
    ) {

      return;

    }


    this.modalEditarAbierto
      .set(
        false
      );


    this.usuarioSeleccionado
      .set(
        null
      );


    this.limpiarErrorModal();

  }


  async guardarEdicion():
    Promise<void> {

    if (
      !this.verificarPermisoModal(
        'usuarios.editar',
        'No tienes permiso para editar usuarios.'
      )
    ) {

      return;

    }


    const usuario =
      this.usuarioSeleccionado();


    if (
      !usuario
    ) {

      return;

    }


    this.limpiarErrorModal();


    const nombre =
      this.formularioEdicion
        .full_name
        .trim();


    const correo =
      this.formularioEdicion
        .email
        .trim()
        .toLowerCase();


    if (
      !nombre
    ) {

      this.modalErrorMessage.set(
        'El nombre completo es obligatorio.'
      );

      return;

    }


    if (
      !this.esCorreoValido(
        correo
      )
    ) {

      this.modalErrorMessage.set(
        'Ingresa un correo electrónico válido.'
      );

      return;

    }


    if (
      this.formularioEdicion
        .role_id ===
      null
    ) {

      this.modalErrorMessage.set(
        'Debes seleccionar un rol.'
      );

      return;

    }


    if (
      this.formularioEdicion
        .dependency_id ===
      null
    ) {

      this.modalErrorMessage.set(
        'Debes seleccionar una dependencia.'
      );

      return;

    }


    this.guardando.set(
      true
    );


    this.successMessage.set(
      ''
    );


    try {

      const correoCambio =
        correo !==
        usuario.email
          .toLowerCase();


      if (
        correoCambio
      ) {

        await this.usersService
          .updateEmail(
            usuario.id,
            correo
          );

      }


      await this.usersService
        .updateUser(
          usuario.id,
          {

            full_name:
              nombre,

            role_id:
              this.formularioEdicion
                .role_id,

            dependency_id:
              this.formularioEdicion
                .dependency_id,

            active:
              this.formularioEdicion
                .active

          }
        );


      await this
        .cargarUsuarios();


      this.modalEditarAbierto
        .set(
          false
        );


      this.usuarioSeleccionado
        .set(
          null
        );


      this.limpiarErrorModal();


      this.successMessage.set(
        'El usuario fue actualizado correctamente.'
      );


    } catch (
      error
    ) {

      console.error(
        'Error actualizando usuario:',
        error
      );


      this.modalErrorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible actualizar el usuario.'
        )
      );


    } finally {

      this.guardando.set(
        false
      );

    }

  }


  /* =======================================================
   * RESTABLECER CONTRASEÑA
   * ======================================================= */

  abrirRestablecerPassword(
    usuario:
      UserProfile
  ):
    void {

    if (
      !this.verificarPermiso(
        'usuarios.password',
        'No tienes permiso para restablecer contraseñas.'
      )
    ) {

      return;

    }


    this.limpiarMensajes();

    this.limpiarErrorModal();


    this.usuarioSeleccionado
      .set(
        usuario
      );


    this.formularioPassword = {

      password: '',

      confirm_password: ''

    };


    this.mostrarPasswordNueva
      .set(
        false
      );


    this.modalPasswordAbierto
      .set(
        true
      );

  }


  cerrarModalPassword():
    void {

    if (
      this.restableciendoPassword()
    ) {

      return;

    }


    this.modalPasswordAbierto
      .set(
        false
      );


    this.usuarioSeleccionado
      .set(
        null
      );


    this.limpiarErrorModal();

  }


  async restablecerPassword():
    Promise<void> {

    if (
      !this.verificarPermisoModal(
        'usuarios.password',
        'No tienes permiso para restablecer contraseñas.'
      )
    ) {

      return;

    }


    const usuario =
      this.usuarioSeleccionado();


    if (
      !usuario
    ) {

      return;

    }


    this.limpiarErrorModal();


    const password =
      this.formularioPassword
        .password;


    if (
      password.length <
      8
    ) {

      this.modalErrorMessage.set(
        'La contraseña debe tener al menos 8 caracteres.'
      );

      return;

    }


    if (
      password !==
      this.formularioPassword
        .confirm_password
    ) {

      this.modalErrorMessage.set(
        'Las contraseñas no coinciden.'
      );

      return;

    }


    this.restableciendoPassword
      .set(
        true
      );


    this.successMessage.set(
      ''
    );


    try {

      await this.usersService
        .resetPassword(
          usuario.id,
          password
        );


      this.modalPasswordAbierto
        .set(
          false
        );


      this.usuarioSeleccionado
        .set(
          null
        );


      this.limpiarErrorModal();


      this.successMessage.set(
        'La contraseña fue restablecida correctamente.'
      );


    } catch (
      error
    ) {

      console.error(
        'Error restableciendo contraseña:',
        error
      );


      this.modalErrorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible restablecer la contraseña.'
        )
      );


    } finally {

      this.restableciendoPassword
        .set(
          false
        );

    }

  }


  /* =======================================================
   * ELIMINAR USUARIO
   * ======================================================= */

  abrirEliminarUsuario(
    usuario:
      UserProfile
  ):
    void {

    if (
      !this.verificarPermiso(
        'usuarios.eliminar',
        'No tienes permiso para eliminar usuarios.'
      )
    ) {

      return;

    }


    this.limpiarMensajes();

    this.limpiarErrorModal();


    this.usuarioSeleccionado
      .set(
        usuario
      );


    this.modalEliminarAbierto
      .set(
        true
      );

  }


  cerrarModalEliminar():
    void {

    if (
      this.eliminando()
    ) {

      return;

    }


    this.modalEliminarAbierto
      .set(
        false
      );


    this.usuarioSeleccionado
      .set(
        null
      );


    this.limpiarErrorModal();

  }


  async eliminarUsuario():
    Promise<void> {

    if (
      !this.verificarPermisoModal(
        'usuarios.eliminar',
        'No tienes permiso para eliminar usuarios.'
      )
    ) {

      return;

    }


    const usuario =
      this.usuarioSeleccionado();


    if (
      !usuario
    ) {

      return;

    }


    this.eliminando.set(
      true
    );


    this.limpiarErrorModal();

    this.successMessage.set(
      ''
    );


    try {

      await this.usersService
        .deleteUser(
          usuario.id,
          true
        );


      await this
        .cargarUsuarios();


      this.modalEliminarAbierto
        .set(
          false
        );


      this.usuarioSeleccionado
        .set(
          null
        );


      this.limpiarErrorModal();


      this.successMessage.set(
        'El usuario fue eliminado correctamente.'
      );


    } catch (
      error
    ) {

      console.error(
        'Error eliminando usuario:',
        error
      );


      this.modalErrorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible eliminar el usuario.'
        )
      );


    } finally {

      this.eliminando.set(
        false
      );

    }

  }


  /* =======================================================
   * CAMBIAR ESTADO
   * ======================================================= */

  async cambiarEstado(
    usuario:
      UserProfile
  ):
    Promise<void> {

    if (
      !this.verificarPermiso(
        'usuarios.estado',
        'No tienes permiso para cambiar el estado de usuarios.'
      )
    ) {

      return;

    }


    this.limpiarMensajes();


    this.cambiandoEstadoId
      .set(
        usuario.id
      );


    try {

      const actualizado =
        await this.usersService
          .changeStatus(
            usuario.id,
            !usuario.active
          );


      this.usuarios.update(
        (usuarios) =>
          usuarios.map(
            (item) =>
              item.id ===
              actualizado.id
                ? {
                    ...item,
                    ...actualizado
                  }
                : item
          )
      );


      this.successMessage.set(
        actualizado.active
          ? 'El usuario fue activado.'
          : 'El usuario fue desactivado.'
      );


    } catch (
      error
    ) {

      console.error(
        'Error cambiando estado:',
        error
      );


      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cambiar el estado.'
        )
      );


    } finally {

      this.cambiandoEstadoId
        .set(
          null
        );

    }

  }


  /* =======================================================
   * FILTROS
   * ======================================================= */

  limpiarFiltros():
    void {

    this.busqueda.set(
      ''
    );


    this.filtroEstado.set(
      'todos'
    );

  }


  /* =======================================================
   * UTILIDADES
   * ======================================================= */

  obtenerIniciales(
    nombre:
      string |
      null
  ):
    string {

    if (
      !nombre?.trim()
    ) {

      return '?';

    }


    return nombre
      .trim()
      .split(
        /\s+/
      )
      .slice(
        0,
        2
      )
      .map(
        (parte) =>
          parte
            .charAt(0)
            .toUpperCase()
      )
      .join(
        ''
      );

  }


  formatearFecha(
    fecha:
      string |
      null |
      undefined
  ):
    string {

    if (
      !fecha
    ) {

      return 'Sin registro';

    }


    const valor =
      new Date(
        fecha
      );


    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {

      return 'Sin registro';

    }


    return new Intl.DateTimeFormat(
      'es-CO',
      {

        dateStyle:
          'medium',

        timeStyle:
          'short'

      }
    )
      .format(
        valor
      );

  }


  /* =======================================================
   * PERMISOS
   * ======================================================= */

  private verificarPermiso(
    codigo:
      string,

    mensaje:
      string
  ):
    boolean {

    if (
      this.authService
        .hasPermission(
          codigo
        )
    ) {

      return true;

    }


    this.errorMessage.set(
      mensaje
    );


    return false;

  }


  private verificarPermisoModal(
    codigo:
      string,

    mensaje:
      string
  ):
    boolean {

    if (
      this.authService
        .hasPermission(
          codigo
        )
    ) {

      return true;

    }


    this.modalErrorMessage.set(
      mensaje
    );


    return false;

  }


  /* =======================================================
   * MENSAJES
   * ======================================================= */

  private limpiarMensajes():
    void {

    this.errorMessage.set(
      ''
    );


    this.successMessage.set(
      ''
    );

  }


  private limpiarErrorModal():
    void {

    this.modalErrorMessage.set(
      ''
    );

  }


  /* =======================================================
   * VALIDACIONES
   * ======================================================= */

  private esCorreoValido(
    email:
      string
  ):
    boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(
        email
      );

  }


  /* =======================================================
   * ERRORES
   * ======================================================= */

  private obtenerMensajeError(
    error:
      unknown,

    mensajePredeterminado:
      string
  ):
    string {

    return error instanceof Error
      ? error.message
      : mensajePredeterminado;

  }

}
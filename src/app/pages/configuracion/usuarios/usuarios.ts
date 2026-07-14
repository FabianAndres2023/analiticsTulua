import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios implements OnInit {
  readonly usuarios = signal<UserProfile[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly dependencias = signal<Dependency[]>([]);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly creando = signal(false);
  readonly restableciendoPassword = signal(false);
  readonly eliminando = signal(false);

  readonly cambiandoEstadoId =
    signal<string | null>(null);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly busqueda = signal('');

  readonly filtroEstado =
    signal<'todos' | 'activos' | 'inactivos'>(
      'todos'
    );

  readonly modalEditarAbierto = signal(false);
  readonly modalCrearAbierto = signal(false);
  readonly modalPasswordAbierto = signal(false);
  readonly modalEliminarAbierto = signal(false);

  readonly usuarioSeleccionado =
    signal<UserProfile | null>(null);

  readonly mostrarPasswordCreacion = signal(false);
  readonly mostrarPasswordNueva = signal(false);

  formularioEdicion: UserEditForm = {
    full_name: '',
    email: '',
    role_id: null,
    dependency_id: null,
    active: true
  };

  formularioCreacion: UserCreateForm = {
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role_id: null,
    dependency_id: null,
    active: true
  };

  formularioPassword: PasswordForm = {
    password: '',
    confirm_password: ''
  };

  readonly usuariosFiltrados = computed(() => {
    const texto = this.busqueda()
      .trim()
      .toLowerCase();

    const estado = this.filtroEstado();

    return this.usuarios().filter((usuario) => {
      const nombre =
        usuario.full_name?.toLowerCase() ?? '';

      const correo =
        usuario.email?.toLowerCase() ?? '';

      const rol =
        usuario.role?.name?.toLowerCase() ?? '';

      const dependencia =
        usuario.dependency?.name?.toLowerCase() ?? '';

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

      return coincideBusqueda && coincideEstado;
    });
  });

  constructor(
    private readonly usersService: UsersService,
    private readonly catalogsService: CatalogsService
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.cargarUsuarios(),
      this.cargarCatalogos()
    ]);
  }

  async cargarUsuarios(): Promise<void> {
    this.cargando.set(true);
    this.errorMessage.set('');

    try {
      const usuarios =
        await this.usersService.getUsersWithAuthData();

      this.usuarios.set(usuarios);
    } catch (error) {
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
      this.cargando.set(false);
    }
  }

  async cargarCatalogos(): Promise<void> {
    try {
      const [roles, dependencias] =
        await Promise.all([
          this.catalogsService.getRoles(),
          this.catalogsService.getDependencies()
        ]);

      this.roles.set(roles);
      this.dependencias.set(dependencias);
    } catch (error) {
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

  nuevoUsuario(): void {
    this.limpiarMensajes();

    this.formularioCreacion = {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
      role_id: null,
      dependency_id: null,
      active: true
    };

    this.mostrarPasswordCreacion.set(false);
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrear(): void {
    if (this.creando()) {
      return;
    }

    this.modalCrearAbierto.set(false);
  }

  async crearUsuario(): Promise<void> {
    const fullName =
      this.formularioCreacion.full_name.trim();

    const email =
      this.formularioCreacion.email
        .trim()
        .toLowerCase();

    const password =
      this.formularioCreacion.password;

    if (!fullName) {
      this.errorMessage.set(
        'El nombre completo es obligatorio.'
      );
      return;
    }

    if (!this.esCorreoValido(email)) {
      this.errorMessage.set(
        'Ingresa un correo electrónico válido.'
      );
      return;
    }

    if (password.length < 8) {
      this.errorMessage.set(
        'La contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    if (
      password !==
      this.formularioCreacion.confirm_password
    ) {
      this.errorMessage.set(
        'Las contraseñas no coinciden.'
      );
      return;
    }

    if (
      this.formularioCreacion.role_id === null
    ) {
      this.errorMessage.set(
        'Debes seleccionar un rol.'
      );
      return;
    }

    if (
      this.formularioCreacion.dependency_id === null
    ) {
      this.errorMessage.set(
        'Debes seleccionar una dependencia.'
      );
      return;
    }

    const input: CreateUserInput = {
      full_name: fullName,
      email,
      password,
      role_id: this.formularioCreacion.role_id,
      dependency_id:
        this.formularioCreacion.dependency_id,
      active: this.formularioCreacion.active
    };

    this.creando.set(true);
    this.limpiarMensajes();

    try {
      await this.usersService.createUser(input);
      await this.cargarUsuarios();

      this.modalCrearAbierto.set(false);

      this.successMessage.set(
        'El usuario fue creado correctamente.'
      );
    } catch (error) {
      console.error(
        'Error creando usuario:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible crear el usuario.'
        )
      );
    } finally {
      this.creando.set(false);
    }
  }

  editarUsuario(usuario: UserProfile): void {
    this.limpiarMensajes();

    this.usuarioSeleccionado.set(usuario);

    this.formularioEdicion = {
      full_name: usuario.full_name ?? '',
      email: usuario.email ?? '',
      role_id: usuario.role_id,
      dependency_id: usuario.dependency_id,
      active: usuario.active
    };

    this.modalEditarAbierto.set(true);
  }

  cerrarModalEditar(): void {
    if (this.guardando()) {
      return;
    }

    this.modalEditarAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  async guardarEdicion(): Promise<void> {
    const usuario = this.usuarioSeleccionado();

    if (!usuario) {
      return;
    }

    const nombre =
      this.formularioEdicion.full_name.trim();

    const correo =
      this.formularioEdicion.email
        .trim()
        .toLowerCase();

    if (!nombre) {
      this.errorMessage.set(
        'El nombre completo es obligatorio.'
      );
      return;
    }

    if (!this.esCorreoValido(correo)) {
      this.errorMessage.set(
        'Ingresa un correo electrónico válido.'
      );
      return;
    }

    if (this.formularioEdicion.role_id === null) {
      this.errorMessage.set(
        'Debes seleccionar un rol.'
      );
      return;
    }

    if (
      this.formularioEdicion.dependency_id === null
    ) {
      this.errorMessage.set(
        'Debes seleccionar una dependencia.'
      );
      return;
    }

    this.guardando.set(true);
    this.limpiarMensajes();

    try {
      const correoCambio =
        correo !== usuario.email.toLowerCase();

      if (correoCambio) {
        await this.usersService.updateEmail(
          usuario.id,
          correo
        );
      }

      await this.usersService.updateUser(
        usuario.id,
        {
          full_name: nombre,
          role_id:
            this.formularioEdicion.role_id,
          dependency_id:
            this.formularioEdicion.dependency_id,
          active:
            this.formularioEdicion.active
        }
      );

      await this.cargarUsuarios();

      this.modalEditarAbierto.set(false);
      this.usuarioSeleccionado.set(null);

      this.successMessage.set(
        'El usuario fue actualizado correctamente.'
      );
    } catch (error) {
      console.error(
        'Error actualizando usuario:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible actualizar el usuario.'
        )
      );
    } finally {
      this.guardando.set(false);
    }
  }

  abrirRestablecerPassword(
    usuario: UserProfile
  ): void {
    this.limpiarMensajes();
    this.usuarioSeleccionado.set(usuario);

    this.formularioPassword = {
      password: '',
      confirm_password: ''
    };

    this.mostrarPasswordNueva.set(false);
    this.modalPasswordAbierto.set(true);
  }

  cerrarModalPassword(): void {
    if (this.restableciendoPassword()) {
      return;
    }

    this.modalPasswordAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  async restablecerPassword(): Promise<void> {
    const usuario = this.usuarioSeleccionado();

    if (!usuario) {
      return;
    }

    const password =
      this.formularioPassword.password;

    if (password.length < 8) {
      this.errorMessage.set(
        'La contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    if (
      password !==
      this.formularioPassword.confirm_password
    ) {
      this.errorMessage.set(
        'Las contraseñas no coinciden.'
      );
      return;
    }

    this.restableciendoPassword.set(true);
    this.limpiarMensajes();

    try {
      await this.usersService.resetPassword(
        usuario.id,
        password
      );

      this.modalPasswordAbierto.set(false);
      this.usuarioSeleccionado.set(null);

      this.successMessage.set(
        'La contraseña fue restablecida correctamente.'
      );
    } catch (error) {
      console.error(
        'Error restableciendo contraseña:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible restablecer la contraseña.'
        )
      );
    } finally {
      this.restableciendoPassword.set(false);
    }
  }

  abrirEliminarUsuario(
    usuario: UserProfile
  ): void {
    this.limpiarMensajes();
    this.usuarioSeleccionado.set(usuario);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) {
      return;
    }

    this.modalEliminarAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  async eliminarUsuario(): Promise<void> {
    const usuario = this.usuarioSeleccionado();

    if (!usuario) {
      return;
    }

    this.eliminando.set(true);
    this.limpiarMensajes();

    try {
      await this.usersService.deleteUser(
        usuario.id,
        true
      );

      await this.cargarUsuarios();

      this.modalEliminarAbierto.set(false);
      this.usuarioSeleccionado.set(null);

      this.successMessage.set(
        'El usuario fue eliminado correctamente.'
      );
    } catch (error) {
      console.error(
        'Error eliminando usuario:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible eliminar el usuario.'
        )
      );
    } finally {
      this.eliminando.set(false);
    }
  }

  async cambiarEstado(
    usuario: UserProfile
  ): Promise<void> {
    this.limpiarMensajes();
    this.cambiandoEstadoId.set(usuario.id);

    try {
      const actualizado =
        await this.usersService.changeStatus(
          usuario.id,
          !usuario.active
        );

      this.usuarios.update((usuarios) =>
        usuarios.map((item) =>
          item.id === actualizado.id
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
    } catch (error) {
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
      this.cambiandoEstadoId.set(null);
    }
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('todos');
  }

  obtenerIniciales(
    nombre: string | null
  ): string {
    if (!nombre?.trim()) {
      return '?';
    }

    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) =>
        parte.charAt(0).toUpperCase()
      )
      .join('');
  }

  formatearFecha(
    fecha: string | null | undefined
  ): string {
    if (!fecha) {
      return 'Sin registro';
    }

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return 'Sin registro';
    }

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(valor);
  }

  private limpiarMensajes(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private esCorreoValido(
    email: string
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string
  ): string {
    return error instanceof Error
      ? error.message
      : mensajePredeterminado;
  }
}
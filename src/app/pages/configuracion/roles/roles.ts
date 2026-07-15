import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  CreateRoleInput,
  RoleItem,
  RolesService
} from '../../../core/services/roles.service';

import {
  PermissionGroup,
  PermissionItem,
  PermissionsService
} from '../../../core/services/permissions.service';

interface RoleForm {
  name: string;
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-roles',
  imports: [FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class Roles implements OnInit {
  readonly roles = signal<RoleItem[]>([]);
  readonly permisos = signal<PermissionItem[]>([]);
  readonly gruposPermisos = signal<PermissionGroup[]>([]);

  readonly cargando = signal(false);
  readonly cargandoPermisos = signal(false);
  readonly guardando = signal(false);
  readonly guardandoPermisos = signal(false);
  readonly cambiandoEstadoId = signal<number | null>(null);
  readonly eliminando = signal(false);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly busqueda = signal('');

  readonly filtroEstado =
    signal<'todos' | 'activos' | 'inactivos'>(
      'todos'
    );

  readonly modalFormularioAbierto = signal(false);
  readonly modalEliminarAbierto = signal(false);

  readonly rolSeleccionado =
    signal<RoleItem | null>(null);

  readonly rolPermisosSeleccionado =
    signal<RoleItem | null>(null);

  readonly permisosSeleccionados =
    signal<Set<number>>(new Set<number>());

  readonly esModoEdicion = computed(
    () => this.rolSeleccionado() !== null
  );

  readonly rolesFiltrados = computed(() => {
    const texto = this.busqueda()
      .trim()
      .toLowerCase();

    const estado = this.filtroEstado();

    return this.roles().filter((rol) => {
      const nombre =
        rol.name?.toLowerCase() ?? '';

      const descripcion =
        rol.description?.toLowerCase() ?? '';

      const coincideBusqueda =
        nombre.includes(texto) ||
        descripcion.includes(texto);

      const coincideEstado =
        estado === 'todos' ||
        (
          estado === 'activos' &&
          rol.active
        ) ||
        (
          estado === 'inactivos' &&
          !rol.active
        );

      return coincideBusqueda && coincideEstado;
    });
  });

  readonly cantidadPermisosSeleccionados = computed(
    () => this.permisosSeleccionados().size
  );

  formulario: RoleForm = {
    name: '',
    description: '',
    active: true
  };

  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.cargarRoles(),
      this.cargarPermisos()
    ]);

    const primerRol = this.roles()[0];

    if (primerRol) {
      await this.seleccionarRolPermisos(
        primerRol
      );
    }
  }

  async cargarRoles(): Promise<void> {
    this.cargando.set(true);
    this.errorMessage.set('');

    try {
      const roles =
        await this.rolesService.getRoles();

      this.roles.set(roles);

      const rolActual =
        this.rolPermisosSeleccionado();

      if (rolActual) {
        const actualizado =
          roles.find(
            (rol) => rol.id === rolActual.id
          ) ?? null;

        this.rolPermisosSeleccionado.set(
          actualizado
        );
      }
    } catch (error) {
      console.error(
        'Error cargando roles:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cargar los roles.'
        )
      );
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarPermisos(): Promise<void> {
    this.cargandoPermisos.set(true);

    try {
      const permisos =
        await this.permissionsService.getPermissions();

      this.permisos.set(permisos);

      this.gruposPermisos.set(
        this.permissionsService.groupByModule(
          permisos
        )
      );
    } catch (error) {
      console.error(
        'Error cargando permisos:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cargar los permisos.'
        )
      );
    } finally {
      this.cargandoPermisos.set(false);
    }
  }

  async seleccionarRolPermisos(
    rol: RoleItem
  ): Promise<void> {
    if (this.guardandoPermisos()) {
      return;
    }

    this.limpiarMensajes();
    this.rolPermisosSeleccionado.set(rol);
    this.cargandoPermisos.set(true);

    try {
      if (rol.id === 1) {
        this.permisosSeleccionados.set(
          new Set(
            this.permisos().map(
              (permiso) => permiso.id
            )
          )
        );

        return;
      }

      const ids =
        await this.permissionsService
          .getRolePermissionIds(rol.id);

      this.permisosSeleccionados.set(
        new Set(ids)
      );
    } catch (error) {
      console.error(
        'Error cargando permisos del rol:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cargar los permisos del rol.'
        )
      );
    } finally {
      this.cargandoPermisos.set(false);
    }
  }

  tienePermiso(
    permissionId: number
  ): boolean {
    return this.permisosSeleccionados()
      .has(permissionId);
  }

  alternarPermiso(
    permissionId: number
  ): void {
    const rol =
      this.rolPermisosSeleccionado();

    if (!rol || rol.id === 1) {
      return;
    }

    const seleccionados =
      new Set(
        this.permisosSeleccionados()
      );

    if (seleccionados.has(permissionId)) {
      seleccionados.delete(permissionId);
    } else {
      seleccionados.add(permissionId);
    }

    this.permisosSeleccionados.set(
      seleccionados
    );
  }

  moduloCompleto(
    grupo: PermissionGroup
  ): boolean {
    return grupo.permissions.every(
      (permiso) =>
        this.permisosSeleccionados()
          .has(permiso.id)
    );
  }

  alternarModulo(
    grupo: PermissionGroup
  ): void {
    const rol =
      this.rolPermisosSeleccionado();

    if (!rol || rol.id === 1) {
      return;
    }

    const seleccionados =
      new Set(
        this.permisosSeleccionados()
      );

    const todosMarcados =
      this.moduloCompleto(grupo);

    for (
      const permiso of grupo.permissions
    ) {
      if (todosMarcados) {
        seleccionados.delete(
          permiso.id
        );
      } else {
        seleccionados.add(
          permiso.id
        );
      }
    }

    this.permisosSeleccionados.set(
      seleccionados
    );
  }

  seleccionarTodosLosPermisos(): void {
    const rol =
      this.rolPermisosSeleccionado();

    if (!rol || rol.id === 1) {
      return;
    }

    this.permisosSeleccionados.set(
      new Set(
        this.permisos().map(
          (permiso) => permiso.id
        )
      )
    );
  }

  limpiarTodosLosPermisos(): void {
    const rol =
      this.rolPermisosSeleccionado();

    if (!rol || rol.id === 1) {
      return;
    }

    this.permisosSeleccionados.set(
      new Set<number>()
    );
  }

  async guardarPermisosRol(): Promise<void> {
    const rol =
      this.rolPermisosSeleccionado();

    if (!rol) {
      this.errorMessage.set(
        'Selecciona un rol.'
      );

      return;
    }

    if (rol.id === 1) {
      this.errorMessage.set(
        'El rol Administrador conserva todos los permisos.'
      );

      return;
    }

    this.guardandoPermisos.set(true);
    this.limpiarMensajes();

    try {
      await this.permissionsService
        .saveRolePermissions(
          rol.id,
          Array.from(
            this.permisosSeleccionados()
          )
        );

      this.successMessage.set(
        `Los permisos del rol ${rol.name} fueron actualizados correctamente.`
      );
    } catch (error) {
      console.error(
        'Error guardando permisos:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible guardar los permisos.'
        )
      );
    } finally {
      this.guardandoPermisos.set(false);
    }
  }

  nuevoRol(): void {
    this.limpiarMensajes();

    this.rolSeleccionado.set(null);

    this.formulario = {
      name: '',
      description: '',
      active: true
    };

    this.modalFormularioAbierto.set(true);
  }

  editarRol(
    rol: RoleItem
  ): void {
    this.limpiarMensajes();

    this.rolSeleccionado.set(rol);

    this.formulario = {
      name: rol.name,
      description:
        rol.description ?? '',
      active: rol.active
    };

    this.modalFormularioAbierto.set(true);
  }

  cerrarModalFormulario(): void {
    if (this.guardando()) {
      return;
    }

    this.modalFormularioAbierto.set(false);
    this.rolSeleccionado.set(null);
  }

  async guardarRol(): Promise<void> {
    const nombre =
      this.formulario.name.trim();

    const descripcion =
      this.formulario.description.trim();

    if (!nombre) {
      this.errorMessage.set(
        'El nombre del rol es obligatorio.'
      );

      return;
    }

    if (nombre.length < 3) {
      this.errorMessage.set(
        'El nombre debe tener al menos 3 caracteres.'
      );

      return;
    }

    const rolActual =
      this.rolSeleccionado();

    if (
      rolActual?.id === 1 &&
      nombre !== 'Administrador'
    ) {
      this.errorMessage.set(
        'El rol Administrador no puede cambiar de nombre.'
      );

      return;
    }

    if (
      rolActual?.id === 1 &&
      !this.formulario.active
    ) {
      this.errorMessage.set(
        'El rol Administrador no puede desactivarse.'
      );

      return;
    }

    this.guardando.set(true);
    this.limpiarMensajes();

    try {
      if (rolActual) {
        const actualizado =
          await this.rolesService.updateRole(
            rolActual.id,
            {
              name: nombre,
              description:
                descripcion || null,
              active:
                this.formulario.active
            }
          );

        this.roles.update((roles) =>
          roles.map((rol) =>
            rol.id === actualizado.id
              ? {
                  ...rol,
                  ...actualizado,
                  users_count:
                    rol.users_count ?? 0
                }
              : rol
          )
        );

        this.successMessage.set(
          'El rol fue actualizado correctamente.'
        );
      } else {
        const input: CreateRoleInput = {
          name: nombre,
          description:
            descripcion || null,
          active:
            this.formulario.active
        };

        const creado =
          await this.rolesService.createRole(
            input
          );

        this.roles.update((roles) =>
          [...roles, creado].sort(
            (a, b) => a.id - b.id
          )
        );

        this.successMessage.set(
          'El rol fue creado correctamente.'
        );

        await this.seleccionarRolPermisos(
          creado
        );
      }

      this.modalFormularioAbierto.set(false);
      this.rolSeleccionado.set(null);
    } catch (error) {
      console.error(
        'Error guardando rol:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible guardar el rol.'
        )
      );
    } finally {
      this.guardando.set(false);
    }
  }

  async cambiarEstado(
    rol: RoleItem
  ): Promise<void> {
    if (rol.id === 1) {
      this.errorMessage.set(
        'El rol Administrador no puede desactivarse.'
      );

      return;
    }

    this.limpiarMensajes();
    this.cambiandoEstadoId.set(rol.id);

    try {
      const actualizado =
        await this.rolesService.changeStatus(
          rol
        );

      this.roles.update((roles) =>
        roles.map((item) =>
          item.id === actualizado.id
            ? {
                ...item,
                ...actualizado,
                users_count:
                  item.users_count ?? 0
              }
            : item
        )
      );

      this.successMessage.set(
        actualizado.active
          ? 'El rol fue activado.'
          : 'El rol fue desactivado.'
      );
    } catch (error) {
      console.error(
        'Error cambiando estado del rol:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cambiar el estado del rol.'
        )
      );
    } finally {
      this.cambiandoEstadoId.set(null);
    }
  }

  abrirEliminarRol(
    rol: RoleItem
  ): void {
    this.limpiarMensajes();

    if (rol.id === 1) {
      this.errorMessage.set(
        'El rol Administrador no puede eliminarse.'
      );

      return;
    }

    if (
      (rol.users_count ?? 0) > 0
    ) {
      this.errorMessage.set(
        'No puedes eliminar este rol porque tiene usuarios asignados.'
      );

      return;
    }

    this.rolSeleccionado.set(rol);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) {
      return;
    }

    this.modalEliminarAbierto.set(false);
    this.rolSeleccionado.set(null);
  }

  async eliminarRol(): Promise<void> {
    const rol =
      this.rolSeleccionado();

    if (!rol) {
      return;
    }

    this.eliminando.set(true);
    this.limpiarMensajes();

    try {
      await this.rolesService.deleteRole(
        rol
      );

      this.roles.update((roles) =>
        roles.filter(
          (item) => item.id !== rol.id
        )
      );

      if (
        this.rolPermisosSeleccionado()?.id ===
        rol.id
      ) {
        const primerRol =
          this.roles()[0] ?? null;

        this.rolPermisosSeleccionado.set(
          primerRol
        );

        if (primerRol) {
          await this.seleccionarRolPermisos(
            primerRol
          );
        } else {
          this.permisosSeleccionados.set(
            new Set<number>()
          );
        }
      }

      this.modalEliminarAbierto.set(false);
      this.rolSeleccionado.set(null);

      this.successMessage.set(
        'El rol fue eliminado correctamente.'
      );
    } catch (error) {
      console.error(
        'Error eliminando rol:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible eliminar el rol.'
        )
      );
    } finally {
      this.eliminando.set(false);
    }
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('todos');
  }

  formatearFecha(
    fecha: string | null | undefined
  ): string {
    if (!fecha) {
      return 'Sin registro';
    }

    const valor =
      new Date(fecha);

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

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string
  ): string {
    return error instanceof Error
      ? error.message
      : mensajePredeterminado;
  }
}
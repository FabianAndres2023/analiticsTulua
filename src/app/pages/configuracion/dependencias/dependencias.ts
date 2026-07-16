import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  CreateDependencyInput,
  DependenciesService,
  DependencyItem
} from '../../../core/services/dependencies.service';

import {
  AuthService
} from '../../../core/services/auth.service';

interface DependencyForm {
  name: string;
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-dependencias',
  imports: [
    FormsModule
  ],
  templateUrl: './dependencias.html',
  styleUrl: './dependencias.scss'
})
export class Dependencias implements OnInit {
  readonly dependencias =
    signal<DependencyItem[]>([]);

  readonly cargando =
    signal(false);

  readonly guardando =
    signal(false);

  readonly eliminando =
    signal(false);

  readonly cambiandoEstadoId =
    signal<number | null>(null);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  readonly busqueda =
    signal('');

  readonly filtroEstado =
    signal<
      'todos' |
      'activos' |
      'inactivos'
    >('todos');

  readonly modalFormularioAbierto =
    signal(false);

  readonly modalEliminarAbierto =
    signal(false);

  readonly dependenciaSeleccionada =
    signal<DependencyItem | null>(null);

  readonly puedeVerDependencias =
    computed(() =>
      this.authService.hasPermission(
        'dependencias.ver'
      )
    );

  readonly puedeCrearDependencias =
    computed(() =>
      this.authService.hasPermission(
        'dependencias.crear'
      )
    );

  readonly puedeEditarDependencias =
    computed(() =>
      this.authService.hasPermission(
        'dependencias.editar'
      )
    );

  readonly puedeCambiarEstado =
    computed(() =>
      this.authService.hasPermission(
        'dependencias.estado'
      )
    );

  readonly puedeEliminarDependencias =
    computed(() =>
      this.authService.hasPermission(
        'dependencias.eliminar'
      )
    );

  readonly esModoEdicion =
    computed(() =>
      this.dependenciaSeleccionada() !== null
    );

  readonly dependenciasFiltradas =
    computed(() => {
      const texto =
        this.busqueda()
          .trim()
          .toLowerCase();

      const estado =
        this.filtroEstado();

      return this.dependencias().filter(
        (dependencia) => {
          const nombre =
            dependencia.name
              .toLowerCase();

          const descripcion =
            dependencia.description
              ?.toLowerCase() ?? '';

          const coincideBusqueda =
            nombre.includes(texto) ||
            descripcion.includes(texto);

          const coincideEstado =
            estado === 'todos' ||
            (
              estado === 'activos' &&
              dependencia.active
            ) ||
            (
              estado === 'inactivos' &&
              !dependencia.active
            );

          return (
            coincideBusqueda &&
            coincideEstado
          );
        }
      );
    });

  formulario: DependencyForm = {
    name: '',
    description: '',
    active: true
  };

  constructor(
    private readonly dependenciesService:
      DependenciesService,

    readonly authService:
      AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.puedeVerDependencias()) {
      this.errorMessage.set(
        'No tienes permiso para consultar dependencias.'
      );

      return;
    }

    await this.cargarDependencias();
  }

  async cargarDependencias(): Promise<void> {
    if (
      !this.verificarPermiso(
        'dependencias.ver',
        'No tienes permiso para consultar dependencias.'
      )
    ) {
      return;
    }

    this.cargando.set(true);
    this.errorMessage.set('');

    try {
      const dependencias =
        await this.dependenciesService
          .getDependencies();

      this.dependencias.set(
        dependencias
      );
    } catch (error) {
      console.error(
        'Error cargando dependencias:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cargar las dependencias.'
        )
      );
    } finally {
      this.cargando.set(false);
    }
  }

  nuevaDependencia(): void {
    if (
      !this.verificarPermiso(
        'dependencias.crear',
        'No tienes permiso para crear dependencias.'
      )
    ) {
      return;
    }

    this.limpiarMensajes();

    this.dependenciaSeleccionada.set(
      null
    );

    this.formulario = {
      name: '',
      description: '',
      active: true
    };

    this.modalFormularioAbierto.set(
      true
    );
  }

  editarDependencia(
    dependencia: DependencyItem
  ): void {
    if (
      !this.verificarPermiso(
        'dependencias.editar',
        'No tienes permiso para editar dependencias.'
      )
    ) {
      return;
    }

    this.limpiarMensajes();

    this.dependenciaSeleccionada.set(
      dependencia
    );

    this.formulario = {
      name: dependencia.name,
      description:
        dependencia.description ?? '',
      active: dependencia.active
    };

    this.modalFormularioAbierto.set(
      true
    );
  }

  cerrarModalFormulario(): void {
    if (this.guardando()) {
      return;
    }

    this.modalFormularioAbierto.set(
      false
    );

    this.dependenciaSeleccionada.set(
      null
    );
  }

  async guardarDependencia(): Promise<void> {
    const permiso =
      this.esModoEdicion()
        ? 'dependencias.editar'
        : 'dependencias.crear';

    const mensaje =
      this.esModoEdicion()
        ? 'No tienes permiso para editar dependencias.'
        : 'No tienes permiso para crear dependencias.';

    if (
      !this.verificarPermiso(
        permiso,
        mensaje
      )
    ) {
      return;
    }

    const nombre =
      this.formulario.name.trim();

    const descripcion =
      this.formulario.description.trim();

    if (!nombre) {
      this.errorMessage.set(
        'El nombre de la dependencia es obligatorio.'
      );

      return;
    }

    if (nombre.length < 2) {
      this.errorMessage.set(
        'El nombre debe tener al menos 2 caracteres.'
      );

      return;
    }

    if (nombre.length > 100) {
      this.errorMessage.set(
        'El nombre no puede superar los 100 caracteres.'
      );

      return;
    }

    if (descripcion.length > 300) {
      this.errorMessage.set(
        'La descripción no puede superar los 300 caracteres.'
      );

      return;
    }

    this.guardando.set(true);
    this.limpiarMensajes();

    try {
      const seleccionada =
        this.dependenciaSeleccionada();

      if (seleccionada) {
        const actualizada =
          await this.dependenciesService
            .updateDependency(
              seleccionada.id,
              {
                name: nombre,
                description:
                  descripcion || null,
                active:
                  this.formulario.active
              }
            );

        this.dependencias.update(
          (dependencias) =>
            dependencias.map(
              (dependencia) =>
                dependencia.id ===
                actualizada.id
                  ? actualizada
                  : dependencia
            )
        );

        this.successMessage.set(
          'La dependencia fue actualizada correctamente.'
        );
      } else {
        const input: CreateDependencyInput = {
          name: nombre,
          description:
            descripcion || null,
          active:
            this.formulario.active
        };

        const creada =
          await this.dependenciesService
            .createDependency(input);

        this.dependencias.update(
          (dependencias) =>
            [
              ...dependencias,
              creada
            ].sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name,
                  'es'
                )
            )
        );

        this.successMessage.set(
          'La dependencia fue creada correctamente.'
        );
      }

      this.modalFormularioAbierto.set(
        false
      );

      this.dependenciaSeleccionada.set(
        null
      );
    } catch (error) {
      console.error(
        'Error guardando dependencia:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible guardar la dependencia.'
        )
      );
    } finally {
      this.guardando.set(false);
    }
  }

  async cambiarEstado(
    dependencia: DependencyItem
  ): Promise<void> {
    if (
      !this.verificarPermiso(
        'dependencias.estado',
        'No tienes permiso para cambiar el estado de dependencias.'
      )
    ) {
      return;
    }

    this.limpiarMensajes();

    this.cambiandoEstadoId.set(
      dependencia.id
    );

    try {
      const actualizada =
        await this.dependenciesService
          .changeStatus(
            dependencia
          );

      this.dependencias.update(
        (dependencias) =>
          dependencias.map(
            (item) =>
              item.id === actualizada.id
                ? actualizada
                : item
          )
      );

      this.successMessage.set(
        actualizada.active
          ? 'La dependencia fue activada.'
          : 'La dependencia fue desactivada.'
      );
    } catch (error) {
      console.error(
        'Error cambiando estado de dependencia:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible cambiar el estado de la dependencia.'
        )
      );
    } finally {
      this.cambiandoEstadoId.set(
        null
      );
    }
  }

  abrirEliminarDependencia(
    dependencia: DependencyItem
  ): void {
    if (
      !this.verificarPermiso(
        'dependencias.eliminar',
        'No tienes permiso para eliminar dependencias.'
      )
    ) {
      return;
    }

    if (
      dependencia.users_count > 0
    ) {
      this.errorMessage.set(
        'No puedes eliminar esta dependencia porque tiene usuarios asignados.'
      );

      return;
    }

    this.limpiarMensajes();

    this.dependenciaSeleccionada.set(
      dependencia
    );

    this.modalEliminarAbierto.set(
      true
    );
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) {
      return;
    }

    this.modalEliminarAbierto.set(
      false
    );

    this.dependenciaSeleccionada.set(
      null
    );
  }

  async eliminarDependencia():
    Promise<void> {
    if (
      !this.verificarPermiso(
        'dependencias.eliminar',
        'No tienes permiso para eliminar dependencias.'
      )
    ) {
      return;
    }

    const dependencia =
      this.dependenciaSeleccionada();

    if (!dependencia) {
      return;
    }

    if (
      dependencia.users_count > 0
    ) {
      this.errorMessage.set(
        'No puedes eliminar esta dependencia porque tiene usuarios asignados.'
      );

      return;
    }

    this.eliminando.set(true);
    this.limpiarMensajes();

    try {
      await this.dependenciesService
        .deleteDependency(
          dependencia
        );

      this.dependencias.update(
        (dependencias) =>
          dependencias.filter(
            (item) =>
              item.id !== dependencia.id
          )
      );

      this.modalEliminarAbierto.set(
        false
      );

      this.dependenciaSeleccionada.set(
        null
      );

      this.successMessage.set(
        'La dependencia fue eliminada correctamente.'
      );
    } catch (error) {
      console.error(
        'Error eliminando dependencia:',
        error
      );

      this.errorMessage.set(
        this.obtenerMensajeError(
          error,
          'No fue posible eliminar la dependencia.'
        )
      );
    } finally {
      this.eliminando.set(false);
    }
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set(
      'todos'
    );
  }

  obtenerInicial(
    nombre: string
  ): string {
    const valor =
      nombre.trim();

    if (!valor) {
      return '?';
    }

    return valor
      .charAt(0)
      .toUpperCase();
  }

  formatearFecha(
    fecha:
      string |
      null |
      undefined
  ): string {
    if (!fecha) {
      return 'Sin registro';
    }

    const valor =
      new Date(fecha);

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
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(valor);
  }

  private verificarPermiso(
    codigo: string,
    mensaje: string
  ): boolean {
    if (
      this.authService
        .hasPermission(codigo)
    ) {
      return true;
    }

    this.errorMessage.set(
      mensaje
    );

    return false;
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
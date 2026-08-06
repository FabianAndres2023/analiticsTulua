import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  LucideRefreshCw
} from '@lucide/angular';

import {
  ToastComponent
} from '../../../../../shared/toast/toast';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,

  imports: [
    LucideRefreshCw,
    ToastComponent
  ],

  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.scss'
})
export class DashboardHeaderComponent {

  @Input()
  ultimaSincronizacion = '--';

  @Input()
  loading = false;

  @Output()
  actualizar =
    new EventEmitter<void>();

  toastVisible = false;

  toastMessage = '';

  async copiarIframe(): Promise<void> {

    const iframe =
`<iframe
  src="https://analytics-tulua.onrender.com/embed/centro-datos-waze"
  width="100%"
  height="950"
  frameborder="0"
  loading="lazy"
  title="Centro de Datos Waze - Analytics Tuluá">
</iframe>`;

    try {

      await navigator.clipboard.writeText(
        iframe
      );

      this.mostrarToast(
        'Código iframe copiado correctamente.'
      );

    } catch (error: unknown) {

      console.error(
        'No fue posible copiar el iframe:',
        error
      );

      this.mostrarToast(
        'No fue posible copiar el código iframe.'
      );

    }
  }

  private mostrarToast(
    message: string
  ): void {

    this.toastMessage = message;

    this.toastVisible = true;

    window.setTimeout(
      () => {

        this.toastVisible = false;

      },
      3000
    );
  }

}
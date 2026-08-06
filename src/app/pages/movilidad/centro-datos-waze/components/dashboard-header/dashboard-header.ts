import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  LucideRefreshCw
} from '@lucide/angular';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,

  imports: [
    LucideRefreshCw
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
  actualizar = new EventEmitter<void>();

}
import { Component } from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  LucideBuilding2,
  LucideFileSpreadsheet,
  LucideSettings,
  LucideShieldCheck,
  LucideSlidersHorizontal,
  LucideUsers
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-configuracion',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideSettings,
    LucideUsers,
    LucideShieldCheck,
    LucideBuilding2,
    LucideSlidersHorizontal,
    LucideFileSpreadsheet
  ],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss'
})
export class Configuracion {
  constructor(
    readonly authService: AuthService
  ) {}
}
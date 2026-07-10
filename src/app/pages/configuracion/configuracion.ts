import { Component } from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  LucideBuilding2,
  LucideFileSpreadsheet,
  LucideKeyRound,
  LucideSettings,
  LucideShieldCheck,
  LucideSlidersHorizontal,
  LucideUsers
} from '@lucide/angular';

@Component({
  selector: 'app-configuracion',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideSettings,
    LucideUsers,
    LucideShieldCheck,
    LucideKeyRound,
    LucideBuilding2,
    LucideSlidersHorizontal,
    LucideFileSpreadsheet
  ],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss'
})
export class Configuracion {}
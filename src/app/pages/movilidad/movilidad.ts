import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  LucideActivity,
  LucideCarFront,
  LucideMapPinned,
  LucideTrafficCone
} from '@lucide/angular';

@Component({
  selector: 'app-movilidad',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideCarFront,
    LucideMapPinned,
    LucideTrafficCone,
    LucideActivity
  ],
  templateUrl: './movilidad.html',
  styleUrl: './movilidad.scss'
})
export class Movilidad {}
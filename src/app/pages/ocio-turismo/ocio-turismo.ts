import {
  Component
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  LucideLandmark,
  LucideMapPin
} from '@lucide/angular';


@Component({

  selector:
    'app-ocio-turismo',

  standalone:
    true,

  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideMapPin,
    LucideLandmark
  ],

  templateUrl:
    './ocio-turismo.html',

  styleUrl:
    './ocio-turismo.scss'

})
export class OcioTurismo {}
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {
  LucideLeaf
} from '@lucide/angular';

@Component({
  selector: 'app-ambiente',

  imports: [
    RouterOutlet,
    LucideLeaf
  ],

  templateUrl: './ambiente.html',
  styleUrl: './ambiente.scss',
})
export class Ambiente {}
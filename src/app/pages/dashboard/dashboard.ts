import {
  Component,
  computed,
  inject
} from '@angular/core';

import {
  LucideArrowRight,
  LucideArrowUp,
  LucideCar,
  LucideFileText,
  LucideShield,
  LucideWind
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    LucideShield,
    LucideCar,
    LucideWind,
    LucideFileText,
    LucideArrowUp,
    LucideArrowRight
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly authService = inject(AuthService);

  readonly profile = this.authService.currentProfile;
  readonly currentUser = this.authService.currentUser;
  readonly loadingUser = this.authService.loadingProfile;

  readonly userName = computed(() => {
    const profile = this.profile();
    const user = this.currentUser();

    return (
      profile?.full_name?.trim() ||
      user?.user_metadata?.['full_name']?.trim() ||
      user?.user_metadata?.['name']?.trim() ||
      user?.email?.split('@')[0] ||
      'Usuario'
    );
  });
}
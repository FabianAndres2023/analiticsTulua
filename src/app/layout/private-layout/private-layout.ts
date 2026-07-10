import {
  Component,
  OnInit,
  computed,
  inject
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  LucideCar,
  LucideHouse,
  LucideLeaf,
  LucideLogOut,
  LucideSettings,
  LucideTrees
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-private-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideHouse,
    LucideLeaf,
    LucideCar,
    LucideTrees,
    LucideSettings,
    LucideLogOut
  ],
  templateUrl: './private-layout.html',
  styleUrl: './private-layout.scss'
})
export class PrivateLayout implements OnInit {
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

  readonly userEmail = computed(() => {
    return (
      this.profile()?.email ||
      this.currentUser()?.email ||
      ''
    );
  });

  readonly initials = computed(() => {
    return this.createInitials(this.userName());
  });

  async ngOnInit(): Promise<void> {
    await this.authService.loadCurrentProfile();
  }

  private createInitials(name: string): string {
    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return 'US';
    }

    if (words.length === 1) {
      return words[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
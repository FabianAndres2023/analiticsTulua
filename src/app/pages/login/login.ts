import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    const { error } = await this.authService.login(
      this.email,
      this.password
    );

    this.loading = false;

    if (error) {
      this.errorMessage = 'Correo o contraseña incorrectos';
      return;
    }

    await this.router.navigate(['/dashboard']);
  }
}
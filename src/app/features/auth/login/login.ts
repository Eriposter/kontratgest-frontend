import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  shakeForm = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.showError('Por favor, preencha todos os campos.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.shakeForm = false;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const message = err.error?.message || 'Credenciais inválidas. Tente novamente.';
        this.showError(message);
      }
    });
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.shakeForm = true;
    setTimeout(() => this.shakeForm = false, 600);
  }
}
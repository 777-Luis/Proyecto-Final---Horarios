import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-superadmin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="superadmin-login-layout">
      <div class="login-card">
        <div class="card-header">
          <div class="icon-container">
            <lucide-icon name="shield-check" [size]="48" color="#FFD700"></lucide-icon>
          </div>
          <h1>Panel Nacional ChronoGest</h1>
          <p>Acceso exclusivo Super Administrador</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          @if (errorMessage()) {
            <div class="alert-error">
               <lucide-icon name="alert-triangle" [size]="16"></lucide-icon>
               <span>{{ errorMessage() }}</span>
            </div>
          }

          <div class="input-group">
            <label>Usuario</label>
            <div class="input-box" [class.focused]="isUserFocused">
              <lucide-icon name="user" [size]="18" class="input-icon"></lucide-icon>
              <input 
                type="text" 
                formControlName="username" 
                placeholder="superadmin" 
                (focus)="isUserFocused = true"
                (blur)="isUserFocused = false"
              />
            </div>
          </div>

          <div class="input-group">
            <label>Contraseña</label>
            <div class="input-box" [class.focused]="isPassFocused">
              <lucide-icon name="lock" [size]="18" class="input-icon"></lucide-icon>
              <input 
                [type]="showPassword() ? 'text' : 'password'" 
                formControlName="password" 
                placeholder="••••••••" 
                (focus)="isPassFocused = true"
                (blur)="isPassFocused = false"
              />
              <button type="button" class="btn-eye" (click)="togglePassword()">
                <lucide-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18"></lucide-icon>
              </button>
            </div>
          </div>

          <div class="input-group">
            <label>Código de acceso (6 dígitos)</label>
            <div class="input-box" [class.focused]="isCodeFocused">
              <lucide-icon name="key" [size]="18" class="input-icon"></lucide-icon>
              <input 
                type="password" 
                formControlName="codigo_acceso" 
                placeholder="••••••" 
                maxlength="6"
                (focus)="isCodeFocused = true"
                (blur)="isCodeFocused = false"
              />
            </div>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || isLoading()">
             <span *ngIf="!isLoading()">Acceder al Panel Nacional</span>
             <lucide-icon name="loader-2" [size]="18" *ngIf="isLoading()" class="spin-icon"></lucide-icon>
             <span *ngIf="isLoading()">Verificando...</span>
          </button>
        </form>

        <div class="back-link">
          <a (click)="goToNormalLogin()">
             <lucide-icon name="arrow-left" [size]="14"></lucide-icon> Volver al login normal
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .superadmin-login-layout {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1B5C3A;
      font-family: 'Inter', system-ui, sans-serif;
      padding: 20px;
    }

    .login-card {
      background: #FFFFFF;
      width: 100%;
      max-width: 440px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      padding: 40px;
      animation: slideUp 0.5s ease-out forwards;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .icon-container {
      width: 80px;
      height: 80px;
      background: #0D3321;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      box-shadow: 0 4px 10px rgba(13, 51, 33, 0.3);
    }

    .card-header h1 {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 8px 0;
    }

    .card-header p {
      color: #6B7280;
      font-size: 14px;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .alert-error {
      background: #FEF2F2;
      color: #DC2626;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #FCA5A5;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-group label {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .input-box {
      position: relative;
      display: flex;
      align-items: center;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .input-box.focused {
      border-color: #0D3321;
      box-shadow: 0 0 0 3px rgba(13, 51, 33, 0.1);
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: #9CA3AF;
    }

    .input-box.focused .input-icon {
      color: #0D3321;
    }

    input {
      width: 100%;
      padding: 12px 40px 12px 42px;
      border: none;
      background: transparent;
      font-size: 14px;
      color: #111827;
      outline: none;
    }

    .btn-eye {
      position: absolute;
      right: 14px;
      background: transparent;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #0D3321;
      color: #FFD700;
      border: none;
      padding: 14px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 8px;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0a291a;
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .back-link {
      margin-top: 24px;
      text-align: center;
    }

    .back-link a {
      color: #6B7280;
      font-size: 13px;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      transition: color 0.2s;
    }

    .back-link a:hover {
      color: #374151;
    }
  `]
})
export class SuperadminLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  isUserFocused = false;
  isPassFocused = false;
  isCodeFocused = false;

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    codigo_acceso: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.superadminLogin(this.loginForm.value).subscribe({
      next: () => {
        if (this.authService.isSuperAdmin()) {
          this.router.navigate(['/superadmin/dashboard']);
        } else {
          this.router.navigate(['/auth/login']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Credenciales inválidas');
      }
    });
  }

  goToNormalLogin() {
    this.router.navigate(['/auth/login']);
  }
}

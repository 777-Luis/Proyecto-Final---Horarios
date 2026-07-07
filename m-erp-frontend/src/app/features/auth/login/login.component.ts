import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, LogoComponent],
  template: `
    <div class="split-layout">
      <!-- Left side: Image and Brand -->
      <div class="brand-panel">
        <div class="brand-overlay"></div>
        <div class="brand-content">
          <app-logo [size]="80" [animate]="true" [rounded]="true" style="margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 24px;"></app-logo>
          <h2>Gestión Inteligente de Horarios</h2>
          <p>Plataforma oficial para la programación académica y administrativa del SENA Sede Yamboro.</p>
        </div>
      </div>

      <!-- Right side: Login Form -->
      <div class="form-panel">
        <div class="form-wrapper">
          <div class="form-header">
            <h1>Bienvenido</h1>
            <p>Ingresa tus credenciales para continuar al panel</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            
            @if (errorMessage()) {
              <div class="alert-error">
                 <lucide-icon name="alert-circle" [size]="16" style="min-width: 16px;"></lucide-icon>
                 <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="input-group">
              <label>Usuario o Documento</label>
              <div class="input-box" [class.focused]="isUserFocused">
                <lucide-icon name="user" [size]="18" class="input-icon"></lucide-icon>
                <input 
                  type="text" 
                  formControlName="username" 
                  placeholder="Ej. 1083994..." 
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

            <div class="form-options">
              <a class="forgot-link" (click)="goToRecovery()">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || isLoading()">
               <span *ngIf="!isLoading()">Iniciar Sesión</span>
               <lucide-icon name="loader-2" [size]="18" *ngIf="isLoading()" class="spin-icon"></lucide-icon>
               <span *ngIf="isLoading()">Verificando...</span>
            </button>
          </form>

          <div class="back-home">
            <button class="btn-secondary" (click)="goToLanding()">
               <lucide-icon name="arrow-left" [size]="16"></lucide-icon>
               Volver al inicio
            </button>
          </div>

          <div class="superadmin-link">
            <span>¿Eres Super Administrador?</span>
            <a (click)="goToSuperAdmin()">Ingresar como SuperAdmin</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .split-layout {
      display: flex;
      min-height: 100vh;
      width: 100%;
      font-family: 'Inter', system-ui, sans-serif;
      background: #FFFFFF;
    }

    /* --- Left Panel: Image --- */
    .brand-panel {
      flex: 1;
      position: relative;
      background: url('/images/campus-yamboro.png') center center / cover no-repeat;
      display: none; /* Hidden on mobile */
    }

    @media (min-width: 1024px) {
      .brand-panel {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }

    .brand-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(2, 44, 34, 0.95) 100%);
      z-index: 1;
    }

    .brand-content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: #FFFFFF;
      max-width: 480px;
      padding: 40px;
    }

    .brand-content h2 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 16px;
      line-height: 1.2;
      letter-spacing: -1px;
    }

    .brand-content p {
      font-size: 18px;
      color: #D1FAE5;
      line-height: 1.6;
      font-weight: 400;
    }

    /* --- Right Panel: Form --- */
    .form-panel {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #FFFFFF;
      padding: 24px;
    }

    .form-wrapper {
      width: 100%;
      max-width: 400px;
      animation: fadeIn 0.6s ease-out forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-header {
      margin-bottom: 48px;
    }

    .form-header h1 {
      font-size: 36px;
      font-weight: 800;
      margin: 0 0 8px 0;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #064E3B 0%, #10B981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: inline-block;
    }

    .form-header p {
      font-size: 16px;
      color: #6B7280;
      margin: 0;
      font-weight: 400;
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
      animation: shake 0.4s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-group label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .input-box {
      position: relative;
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .input-box:hover {
      border-color: #9CA3AF;
    }

    .input-box.focused {
      background: #FFFFFF;
      border-color: #16A34A;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: #9CA3AF;
      transition: color 0.2s;
    }

    .input-box.focused .input-icon {
      color: #16A34A;
    }

    input {
      width: 100%;
      padding: 12px 40px 12px 42px;
      border: none;
      background: transparent;
      font-size: 15px;
      color: #111827;
      outline: none;
      border-radius: 8px;
    }
    
    input::placeholder {
      color: #9CA3AF;
      font-weight: 400;
    }

    .btn-eye {
      position: absolute;
      right: 14px;
      background: transparent;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      transition: color 0.2s;
    }
    
    .btn-eye:hover {
      color: #4B5563;
    }

    .form-options {
      display: flex;
      justify-content: flex-end;
      margin-top: -4px;
      margin-bottom: 8px;
    }

    .forgot-link {
      font-size: 13px;
      color: #16A34A;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.2s;
    }

    .forgot-link:hover {
      color: #15803D;
      text-decoration: underline;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #16A34A;
      color: #FFFFFF;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .btn-primary:hover:not(:disabled) {
      background: #15803D;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .back-home {
      margin-top: 40px;
      display: flex;
      justify-content: center;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: none;
      color: #6B7280;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: #F3F4F6;
      color: #111827;
    }

    .superadmin-link {
      margin-top: 24px;
      text-align: center;
      font-size: 13px;
      color: #6B7280;
    }
    .superadmin-link a {
      color: #16A34A;
      font-weight: 600;
      cursor: pointer;
      margin-left: 6px;
    }
    .superadmin-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  isUserFocused = false;
  isPassFocused = false;

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        const role = this.authService.currentRole();
        if (role === 'Administrador') this.router.navigate(['/admin/dashboard']);
        else if (role === 'Instructor') this.router.navigate(['/instructor/mi-horario']);
        else if (role === 'Aprendiz') this.router.navigate(['/aprendiz/mi-horario']);
        else this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Credenciales inválidas');
      }
    });
  }

  goToRecovery() {
    this.router.navigate(['/auth/recuperar']);
  }

  goToLanding() {
    this.router.navigate(['/inicio']);
  }

  goToSuperAdmin() {
    this.router.navigate(['/superadmin/login']);
  }
}

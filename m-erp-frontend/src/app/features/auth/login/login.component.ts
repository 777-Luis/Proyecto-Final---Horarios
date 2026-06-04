import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="login-wrapper">
      <div class="bg-pattern"></div>
      
      <!-- Decorative curved lines -->
      <svg class="bg-lines" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <path d="M-200,600 C300,200 700,900 1600,300" stroke="rgba(255, 255, 255, 0.08)" stroke-width="24" fill="none" stroke-linecap="round"/>
        <path d="M-100,650 C400,250 800,950 1700,350" stroke="rgba(255, 255, 255, 0.04)" stroke-width="40" fill="none" stroke-linecap="round"/>
        <path d="M100,900 C500,400 1000,-100 1700,400" stroke="rgba(251, 191, 36, 0.7)" stroke-width="16" fill="none" stroke-linecap="round"/>
      </svg>
      
      <div class="login-card">
        <div class="logo-area">
          <div class="logo-icon">
            <lucide-icon name="calendar" [size]="28" color="#1B5C3A"></lucide-icon>
          </div>
          <h1>ChronoGest</h1>
          <p class="subtitle">SENA Sede Yamboro</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-container">
          
          @if (errorMessage()) {
            <div class="alert-error">
               <lucide-icon name="alert-circle" [size]="16" style="min-width: 16px;"></lucide-icon>
               <span>{{ errorMessage() }}</span>
            </div>
          }

          <div class="input-group">
            <div class="input-wrapper" [class.focused]="isUserFocused">
              <lucide-icon name="user" [size]="20" class="input-icon"></lucide-icon>
              <input 
                type="text" 
                formControlName="username" 
                placeholder="Usuario / Documento" 
                (focus)="isUserFocused = true"
                (blur)="isUserFocused = false"
              />
            </div>
            @if (loginForm.get('username')?.invalid && loginForm.get('username')?.touched) {
               <span class="error-msg">Requerido</span>
            }
          </div>

          <div class="input-group">
            <div class="input-wrapper" [class.focused]="isPassFocused">
              <lucide-icon name="lock" [size]="20" class="input-icon"></lucide-icon>
              <input 
                [type]="showPassword() ? 'text' : 'password'" 
                formControlName="password" 
                placeholder="Contraseña" 
                (focus)="isPassFocused = true"
                (blur)="isPassFocused = false"
              />
              <button type="button" class="btn-eye" (click)="togglePassword()">
                <lucide-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18"></lucide-icon>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || isLoading()">
             <lucide-icon name="log-in" [size]="18" *ngIf="!isLoading()"></lucide-icon>
             <lucide-icon name="loader-2" [size]="18" *ngIf="isLoading()" class="spin-icon"></lucide-icon>
             <span>{{ isLoading() ? 'Validando...' : 'Iniciar Sesión' }}</span>
          </button>

          <div class="form-actions">
            <a class="forgot-link" (click)="goToRecovery()">¿Olvidó su contraseña?</a>
          </div>
        </form>

        <div class="back-to-home">
          <a class="back-link" (click)="goToLanding()">
             <lucide-icon name="arrow-left" [size]="14"></lucide-icon>
             Volver a la página principal
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1B5C3A 0%, #0D3321 100%);
      position: relative;
      overflow: hidden;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .bg-pattern {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.05) 2px, transparent 2px);
      background-size: 32px 32px;
      opacity: 0.8;
      z-index: 1;
      animation: float 20s linear infinite;
    }

    @keyframes float {
      0% { transform: translateY(0) translateX(0); }
      100% { transform: translateY(-32px) translateX(-32px); }
    }

    .bg-lines {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
      filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.4)); /* Glow effect */
    }

    .login-card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
      padding: 48px;
      width: 100%;
      max-width: 420px;
      z-index: 2;
      position: relative;
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-area {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);
    }

    h1 {
      font-size: 28px;
      color: #111827;
      margin: 0 0 4px 0;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 14px;
      color: #6B7280;
      margin: 0;
      font-weight: 500;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 28px;
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
      position: relative;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      border-bottom: 2px solid #E5E7EB;
      transition: border-color 0.3s ease;
      background: transparent;
    }

    .input-wrapper.focused {
      border-bottom-color: #16A34A; /* Brighter green */
    }

    .input-icon {
      position: absolute;
      left: 4px;
      color: #9CA3AF;
      transition: color 0.3s ease;
    }

    .input-wrapper.focused .input-icon {
      color: #16A34A;
    }

    input {
      width: 100%;
      padding: 12px 40px 12px 36px;
      border: none;
      background: transparent;
      font-size: 15px;
      color: #111827;
      outline: none;
    }
    
    input::placeholder {
      color: #9CA3AF;
      font-weight: 400;
    }

    .btn-eye {
      position: absolute;
      right: 4px;
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

    .error-msg {
      font-size: 11px;
      color: #DC2626;
      position: absolute;
      bottom: -18px;
      left: 4px;
      font-weight: 500;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); /* Vibrant gradient */
      color: #FFFFFF;
      border: none;
      padding: 16px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 12px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(22, 163, 74, 0.4);
      background: linear-gradient(135deg, #15803D 0%, #166534 100%);
    }

    .btn-primary:disabled {
      background: #9CA3AF;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .form-actions {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }

    .forgot-link {
      font-size: 14px;
      color: #6B7280;
      cursor: pointer;
      font-weight: 500;
      transition: color 0.2s;
    }

    .forgot-link:hover {
      color: #16A34A;
      text-decoration: underline;
    }

    .back-to-home {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #F3F4F6;
      text-align: center;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      color: #6B7280;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      padding: 6px 12px;
      border-radius: 6px;
    }

    .back-link:hover {
      color: #111827;
      background: #F3F4F6;
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
}

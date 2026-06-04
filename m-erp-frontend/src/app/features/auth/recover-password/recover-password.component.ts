import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        
        <button class="back-btn" (click)="goBack()" title="Volver al Login">
           <lucide-icon name="arrow-left" [size]="20"></lucide-icon>
        </button>

        <div class="logo-area">
          <div class="logo-circle">
            <!-- Icon dynamically changing based on step -->
            @if (step() === 'sent') {
               <lucide-icon name="check-circle" [size]="32" color="#fff"></lucide-icon>
            } @else {
               <lucide-icon name="lock" [size]="32" color="#fff"></lucide-icon>
            }
          </div>
          <h1>Recuperar Acceso</h1>
          <p class="subtitle">{{ getSubtitle() }}</p>
        </div>

        <!-- SCREEN 1: Email Request -->
        @if (step() === 'request') {
          <form [formGroup]="requestForm" (ngSubmit)="onRequestSubmit()" class="form-container">
            @if (errorMessage()) {
              <div class="alert-error">{{ errorMessage() }}</div>
            }
            <div class="input-group">
              <label>Correo Electrónico Institucional</label>
              <div class="input-wrapper">
                <lucide-icon name="mail" [size]="18" class="input-icon"></lucide-icon>
                <input type="email" formControlName="email" placeholder="usuario@sena.edu.co" />
              </div>
            </div>
            <button type="submit" class="btn-primary" [disabled]="requestForm.invalid || isLoading()">
               {{ isLoading() ? 'Procesando...' : 'Enviar enlace de recuperación' }}
            </button>
          </form>
        }

        <!-- SCREEN 2: Confirmation Sent -->
        @if (step() === 'sent') {
          <div class="success-message">
             <h3>¡Correo Enviado!</h3>
             <p>Revisa tu bandeja de entrada. Hemos enviado un enlace seguro para restablecer tu contraseña. Si no lo encuentras, revisa tu carpeta de Spam.</p>
             <button type="button" class="btn-secondary" (click)="goBack()">Volver al Inicio Segregado</button>
          </div>
        }

        <!-- SCREEN 3: Reset Password (arriving via URL token) -->
        @if (step() === 'reset') {
          <form [formGroup]="resetForm" (ngSubmit)="onResetSubmit()" class="form-container">
            @if (errorMessage()) {
              <div class="alert-error">{{ errorMessage() }}</div>
            }
            @if (successMessage()) {
              <div class="alert-success">{{ successMessage() }}</div>
            } @else {
              <div class="input-group">
                <label>Nueva Contraseña</label>
                <div class="input-wrapper">
                  <lucide-icon name="lock" [size]="18" class="input-icon"></lucide-icon>
                  <input type="password" formControlName="newPassword" placeholder="••••••••" />
                </div>
              </div>
              <div class="input-group">
                <label>Confirmar Contraseña</label>
                <div class="input-wrapper">
                  <lucide-icon name="lock" [size]="18" class="input-icon"></lucide-icon>
                  <input type="password" formControlName="confirmPassword" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" class="btn-primary" [disabled]="resetForm.invalid || isLoading() || passwordsMismatch()">
                 {{ isLoading() ? 'Actualizando...' : 'Establecer nueva contraseña' }}
              </button>
            }
          </form>
        }

      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-bg);
      background-image: radial-gradient(var(--color-primary-light) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .login-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      padding: 40px 48px;
      width: 100%;
      max-width: 440px;
      border: 1px solid var(--color-border);
      position: relative;
    }

    .back-btn {
      position: absolute;
      top: 24px;
      left: 24px;
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: var(--color-bg);
      color: var(--color-text);
    }

    .logo-area {
      text-align: center;
      margin-bottom: 32px;
      margin-top: 12px;
    }

    .logo-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    h1 {
      font-size: 24px;
      color: var(--color-text);
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 14px;
      color: var(--color-text-muted);
      max-width: 280px;
      margin: 0 auto;
      line-height: 1.5;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .alert-error {
      background: var(--color-danger-light);
      color: var(--color-danger);
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      border: 1px solid var(--color-danger);
    }
    
    .alert-success {
      background: #ECFDF5;
      color: #065F46;
      padding: 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      border: 1px solid #A7F3D0;
    }

    .input-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: var(--color-text); }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; color: var(--color-text-muted); }
    
    input {
      width: 100%;
      padding: 10px 14px 10px 40px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      color: var(--color-text);
      transition: all 0.2s;
    }

    input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(46,125,82,0.1); }

    .btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: var(--color-primary); color: var(--color-white); border: none;
      padding: 12px 20px; border-radius: var(--radius-md); font-size: 15px; font-weight: 500;
      cursor: pointer; transition: background 0.2s; margin-top: 8px;
    }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .success-message {
      text-align: center;
    }
    .success-message h3 { font-size: 18px; color: var(--color-text); margin-bottom: 12px; }
    .success-message p { font-size: 14px; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 24px; }
    
    .btn-secondary {
      background: var(--color-white); color: var(--color-primary); border: 1px solid var(--color-primary);
      padding: 10px 20px; border-radius: var(--radius-md); font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all 0.2s; width: 100%;
    }
    .btn-secondary:hover { background: var(--color-primary-light); }
  `]
})
export class RecoverPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  // States: 'request' | 'sent' | 'reset'
  step = signal<'request' | 'sent' | 'reset'>('request');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  token = signal<string | null>(null);

  requestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token.set(params['token']);
        this.step.set('reset');
      }
    });
  }

  getSubtitle(): string {
    switch(this.step()) {
       case 'request': return 'Ingresa tu correo asocidado para recibir las instrucciones';
       case 'sent': return 'El proceso de recuperación ha sido iniciado exitosamente';
       case 'reset': return 'Establece y confirma tu nueva contraseña de acceso';
    }
  }

  passwordsMismatch(): boolean {
    if (this.step() !== 'reset') return false;
    const pwd = this.resetForm.get('newPassword')?.value;
    const cpwd = this.resetForm.get('confirmPassword')?.value;
    return pwd !== cpwd && cpwd !== '';
  }

  onRequestSubmit() {
    if (this.requestForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = this.requestForm.value;

    this.http.post(`http://localhost:3000/api/erp/v1/auth/forgot-password`, payload).subscribe({
      next: () => {
         this.isLoading.set(false);
         this.step.set('sent');
      },
      error: (e) => {
         this.isLoading.set(false);
         this.errorMessage.set(e.error?.message || 'Hubo un error al tramitar la recuperación.');
         // Forcing transition to sent for demonstration if API isn't strictly alive:
         // En entornos reales no se indica falso positivo, pero si se desea disuadir enumeraciones, está bien:
         // this.step.set('sent'); 
      }
    });
  }

  onResetSubmit() {
    if (this.resetForm.invalid || this.passwordsMismatch()) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = {
       token: this.token(),
       newPassword: this.resetForm.value.newPassword
    };

    this.http.post(`http://localhost:3000/api/erp/v1/auth/reset-password`, payload).subscribe({
      next: () => {
         this.isLoading.set(false);
         this.successMessage.set('Contraseña actualizada correctamente. ¡Ya puedes iniciar sesión!');
         setTimeout(() => {
            this.router.navigate(['/auth/login']);
         }, 4000);
      },
      error: (e) => {
         this.isLoading.set(false);
         this.errorMessage.set(e.error?.message || 'El enlace provisto ha expirado o es inválido.');
      }
    });
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}

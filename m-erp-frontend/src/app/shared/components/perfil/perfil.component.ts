import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Save, User } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminUsersService } from '../../../core/services/admin-users.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container" translate="no">
       <!-- Premium Header Area -->
       <div class="profile-header-banner">
         <div class="banner-content">
            <h1 class="page-title">Mi Perfil Institucional</h1>
            <p class="page-subtitle">Gestione su información de contacto y credenciales de acceso</p>
         </div>
       </div>

       @if (isLoading()) {
         <div class="loading-state">
           <div class="spinner"></div>
           <p>Cargando datos del perfil...</p>
         </div>
       } @else {
         <div class="layout-grid">
           <!-- Side info (Read Only) -->
           <div class="glass-card profile-sidebar">
              <div class="avatar-section">
                 <div class="avatar-wrapper">
                    <lucide-icon name="user" [size]="56" color="#ffffff"></lucide-icon>
                 </div>
                 <h3 class="user-role">{{ rParams().rol || 'Instructor' }}</h3>
                 <span class="badge active">{{ rParams().estado || 'Activo' }}</span>
              </div>
              
              <div class="divider"></div>
              
              <div class="info-list">
                 <div class="info-item">
                   <lucide-icon name="credit-card" [size]="18" class="info-icon"></lucide-icon>
                   <div class="info-text">
                     <label>Identificación</label>
                     <span>{{ rParams().identificacion || 'N/A' }}</span>
                   </div>
                 </div>
                 
                 @if (rParams().area) {
                    <div class="info-item">
                      <lucide-icon name="briefcase" [size]="18" class="info-icon"></lucide-icon>
                      <div class="info-text">
                        <label>Área Adscrita</label>
                        <span>{{ rParams().area }}</span>
                      </div>
                    </div>
                 }
                 
                 @if (rParams().curso) {
                    <div class="info-item">
                      <lucide-icon name="book-open" [size]="18" class="info-icon"></lucide-icon>
                      <div class="info-text">
                        <label>Ficha Asignada</label>
                        <span>{{ rParams().curso }}</span>
                      </div>
                    </div>
                 }
              </div>
           </div>

           <!-- Edit form -->
           <div class="glass-card form-section">
              <div class="section-heading">
                <h3>Información Personal</h3>
                <p>Actualice sus datos para mantener su cuenta al día.</p>
              </div>
              
              <form [formGroup]="perfilForm" class="modern-form">
                 <div class="form-row">
                   <div class="input-group">
                     <label>Nombre Completo</label>
                     <div class="input-wrapper">
                       <lucide-icon name="user" [size]="18" class="input-icon"></lucide-icon>
                       <input type="text" formControlName="nombre" class="form-control with-icon" placeholder="Ej. Juan Pérez" />
                     </div>
                   </div>
                   <div class="input-group">
                     <label>Correo Electrónico</label>
                     <div class="input-wrapper">
                       <lucide-icon name="mail" [size]="18" class="input-icon"></lucide-icon>
                       <input type="email" formControlName="correo" class="form-control with-icon" placeholder="ejemplo@correo.com" />
                     </div>
                   </div>
                 </div>

                 <div class="form-row">
                   <div class="input-group">
                     <label>Dirección de Residencia</label>
                     <div class="input-wrapper">
                       <lucide-icon name="map-pin" [size]="18" class="input-icon"></lucide-icon>
                       <input type="text" formControlName="direccion" class="form-control with-icon" placeholder="Ej. Calle 123 #45-67" />
                     </div>
                   </div>
                   <div class="input-group">
                     <label>Municipio</label>
                     <div class="input-wrapper">
                       <lucide-icon name="map" [size]="18" class="input-icon"></lucide-icon>
                       <select formControlName="municipio_id" class="form-control with-icon">
                          <option value="">Seleccione un municipio...</option>
                          @for (m of srv.municipios(); track m.id) {
                            <option [value]="m.id">{{ m.nombre }}</option>
                          }
                       </select>
                     </div>
                   </div>
                 </div>

                 <div class="input-group" style="max-width: 48%;">
                   <label>Género</label>
                   <select formControlName="genero" class="form-control">
                      <option value="" disabled>Seleccione...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                   </select>
                 </div>

                 <!-- Feedback Alert -->
                 @if (updateSuccess()) {
                    <div class="alert-box success">
                      <lucide-icon name="check-circle" [size]="20"></lucide-icon>
                      <span>¡Perfil actualizado exitosamente en los registros centralizados!</span>
                    </div>
                 }

                 <div class="form-actions">
                   <button type="button" class="btn-primary" [disabled]="perfilForm.invalid || isSaving()" (click)="saveProfile()">
                      <lucide-icon name="save" [size]="18"></lucide-icon>
                      {{ isSaving() ? 'Guardando...' : 'Guardar Cambios' }}
                   </button>
                 </div>
              </form>
           </div>
         </div>
       }
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 30px; animation: fadeIn 0.4s ease-out; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Premium Banner */
    .profile-header-banner {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      border-radius: var(--radius-xl);
      padding: 40px;
      color: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    }
    
    .profile-header-banner::after {
      content: '';
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      background: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>') repeat;
      opacity: 0.5;
      pointer-events: none;
    }

    .banner-content { position: relative; z-index: 1; }
    .page-title { font-size: 28px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; }
    .page-subtitle { font-size: 15px; opacity: 0.9; margin: 0; font-weight: 400; }
    
    .loading-state { padding: 60px; text-align: center; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .layout-grid { display: grid; grid-template-columns: 300px 1fr; gap: 30px; align-items: start; }
    
    /* Glass Cards */
    .glass-card { background: var(--color-white); border-radius: var(--radius-xl); border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden; transition: box-shadow 0.3s ease; }
    .glass-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
    
    /* Sidebar */
    .profile-sidebar { padding: 32px 24px; text-align: center; }
    .avatar-section { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .avatar-wrapper { width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(0,0,0,0.1); border: 4px solid white; }
    .user-role { margin: 8px 0 0 0; font-size: 18px; color: var(--color-text); font-weight: 600; }
    
    .badge.active { background: #ECFDF5; color: #059669; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #A7F3D0; }
    
    .divider { height: 1px; background: #F0F2F4; margin: 24px 0; width: 100%; }
    
    .info-list { display: flex; flex-direction: column; gap: 20px; text-align: left; }
    .info-item { display: flex; align-items: flex-start; gap: 12px; }
    .info-icon { color: var(--color-primary); margin-top: 2px; }
    .info-text { display: flex; flex-direction: column; gap: 4px; }
    .info-text label { font-size: 12px; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-text span { font-size: 14px; color: var(--color-text); font-weight: 500; }
    
    /* Form Section */
    .form-section { padding: 32px; }
    .section-heading { margin-bottom: 30px; border-bottom: 1px solid #F0F2F4; padding-bottom: 16px; }
    .section-heading h3 { margin: 0 0 8px 0; font-size: 20px; color: var(--color-text); font-weight: 600; }
    .section-heading p { margin: 0; color: var(--color-text-muted); font-size: 14px; }
    
    .modern-form { display: flex; flex-direction: column; gap: 24px; }
    .form-row { display: flex; gap: 24px; }
    .form-row .input-group { flex: 1; }
    
    .input-group { display: flex; flex-direction: column; gap: 8px; }
    .input-group label { font-size: 13px; font-weight: 600; color: var(--color-text); }
    
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; color: #9CA3AF; pointer-events: none; transition: color 0.2s; }
    
    .form-control { width: 100%; padding: 12px 16px; border: 1px solid #E5E7EB; border-radius: var(--radius-md); font-size: 14px; outline: none; transition: all 0.2s; background: #F9FAFB; color: var(--color-text); font-family: inherit; }
    .form-control.with-icon { padding-left: 42px; }
    .form-control:hover { border-color: #D1D5DB; }
    .form-control:focus { border-color: var(--color-primary); background: white; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
    .input-wrapper:focus-within .input-icon { color: var(--color-primary); }
    
    .alert-box.success { background: #ECFDF5; color: #065F46; padding: 16px; border-radius: var(--radius-md); font-size: 14px; border: 1px solid #A7F3D0; display: flex; align-items: center; gap: 12px; font-weight: 500; animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    
    .form-actions { display: flex; justify-content: flex-end; padding-top: 24px; border-top: 1px solid #F0F2F4; margin-top: 8px; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: white; border: none; padding: 12px 24px; border-radius: var(--radius-md); font-weight: 600; font-size: 14px; cursor: pointer; display: flex; gap: 10px; align-items: center; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3); }
    .btn-primary:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2); }
    .btn-primary:disabled { background: #9CA3AF; box-shadow: none; cursor: not-allowed; transform: none; }
  `]
})
export class PerfilComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  public srv = inject(AdminUsersService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = signal(false);
  isSaving = signal(false);
  updateSuccess = signal(false);

  // Payload readonly del backend
  rParams = signal<any>({});

  perfilForm = this.fb.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    direccion: [''],
    municipio_id: [''],
    genero: ['']
  });

  ngOnInit() {
    this.isLoading.set(true);

    // Fetch municipios usign the centralized service
    this.srv.fetchMunicipios();

    // Asumimos GET /usuarios/me
    const ctx = this.auth.userContextSignal(); // fallback temporal
    this.http.get<any>(`http://localhost:3000/api/erp/v1/users/${ctx?.userId || 'me'}`).subscribe({
       next: (u) => {
         this.rParams.set({
            identificacion: u.numero_documento,
            rol: u.rol || 'Usuario',
            area: u.area_nombre,
            curso: undefined,
            estado: u.estado
         });
         this.perfilForm.patchValue({
            nombre: u.nombre,
            correo: u.correo || u.credencial?.username,
            direccion: u.direccion,
            municipio_id: u.municipio_id || '',
            genero: u.genero
         });
         this.isLoading.set(false);
         this.cdr.detectChanges();
       },
       error: () => {
         this.isLoading.set(false);
         this.cdr.detectChanges();
       }
    });
  }

  saveProfile() {
    if (this.perfilForm.invalid) return;
    this.isSaving.set(true);
    this.updateSuccess.set(false);

    const ctx = this.auth.userContextSignal();
    this.http.patch(`http://localhost:3000/api/erp/v1/users/${ctx?.userId || 'me'}`, this.perfilForm.value).subscribe({
      next: () => {
         this.isSaving.set(false);
         this.updateSuccess.set(true);
         setTimeout(() => this.updateSuccess.set(false), 4000);
      },
      error: () => this.isSaving.set(false)
    });
  }
}

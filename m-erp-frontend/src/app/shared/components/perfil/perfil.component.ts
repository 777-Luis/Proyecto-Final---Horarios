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
       <div class="page-header">
         <div>
           <h1 class="page-title">Mi Perfil Institucional</h1>
           <p class="page-subtitle">Actualice su información de contacto</p>
         </div>
       </div>

       @if (isLoading()) {
         <div class="loading-state">Cargando datos del perfil...</div>
       } @else {
         <div class="layout-grid">
           <!-- Side info (Read Only params specified by user) -->
           <div class="readonly-card">
              <div class="avatar-box">
                 <lucide-icon name="user" [size]="48" color="#a3aed0"></lucide-icon>
              </div>
              <h4>Datos de Sistema</h4>
              <div class="info-list">
                 <div class="info-item">
                   <label>Identificación</label>
                   <span>{{ rParams().identificacion || 'N/A' }}</span>
                 </div>
                 <div class="info-item">
                   <label>Rol Base</label>
                   <span>{{ rParams().rol || 'N/A' }}</span>
                 </div>
                 @if (rParams().area) {
                    <div class="info-item">
                      <label>Área Adscrita</label>
                      <span>{{ rParams().area }}</span>
                    </div>
                 }
                 @if (rParams().curso) {
                    <div class="info-item">
                      <label>Ficha Asignada</label>
                      <span>{{ rParams().curso }}</span>
                    </div>
                 }
                 <div class="info-item">
                   <label>Estado Activo</label>
                   <span class="badge active">{{ rParams().estado || 'Activo' }}</span>
                 </div>
              </div>
           </div>

           <!-- Edit form -->
           <div class="edit-card">
              <h3>Información Personal</h3>
              <form [formGroup]="perfilForm" class="advanced-form">
                 <div class="form-row">
                   <div class="input-group">
                     <label>Nombre Completo</label>
                     <input type="text" formControlName="nombre" class="form-control" />
                   </div>
                   <div class="input-group">
                     <label>Correo Electrónico</label>
                     <input type="email" formControlName="correo" class="form-control" />
                   </div>
                 </div>

                 <div class="form-row">
                   <div class="input-group">
                     <label>Dirección Residencia</label>
                     <input type="text" formControlName="direccion" class="form-control" />
                   </div>
                   <div class="input-group">
                     <label>Municipio</label>
                     <select formControlName="municipio_id" class="form-control">
                        <option value="">Seleccione...</option>
                        @for (m of srv.municipios(); track m.id) {
                          <option [value]="m.id">{{ m.nombre }}</option>
                        }
                     </select>
                   </div>
                 </div>

                 <div class="input-group" style="max-width: 50%;">
                   <label>Género</label>
                   <select formControlName="genero" class="form-control">
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                   </select>
                 </div>

                 <!-- Feedback Alert -->
                 @if (updateSuccess()) {
                    <div class="info-alert success">¡Perfil actualizado exitosamente en los registros centralizados!</div>
                 }

                 <div class="form-actions">
                   <button type="button" class="btn-primary" [disabled]="perfilForm.invalid || isSaving()" (click)="saveProfile()">
                      <lucide-icon name="save" [size]="16"></lucide-icon>
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
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 22px; color: var(--color-text); font-weight: 600; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .loading-state { padding: 40px; text-align: center; color: var(--color-text-muted); }
    
    .layout-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: start; }
    
    .readonly-card, .edit-card { background: var(--color-white); border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); padding: 24px; }
    
    .avatar-box { width: 80px; height: 80px; border-radius: 50%; background: #F3F4F6; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; }
    .readonly-card h4 { text-align: center; margin: 0 0 20px 0; color: var(--color-text); }
    .info-list { display: flex; flex-direction: column; gap: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid #F0F2F4; padding-bottom: 8px; }
    .info-item:last-child { border: none; }
    .info-item label { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
    .info-item span { font-size: 14px; color: var(--color-text); font-weight: 500; }
    .badge.active { background: var(--color-primary-light); color: var(--color-primary-dark); padding: 4px 12px; border-radius: 20px; font-size: 12px; width: fit-content; }
    
    .edit-card h3 { margin: 0 0 24px 0; font-size: 18px; color: var(--color-text); }
    .advanced-form { display: flex; flex-direction: column; gap: 20px; }
    .form-row { display: flex; gap: 16px; }
    .form-row .input-group { flex: 1; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label { font-size: 13px; font-weight: 500; color: var(--color-text); }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 14px; outline: none; transition: border 0.2s; background: var(--color-white); }
    .form-control:focus { border-color: var(--color-primary); }
    .form-actions { display: flex; justify-content: flex-end; padding-top: 16px; border-top: 1px dashed var(--color-border); }
    .btn-primary { background: var(--color-primary); color: var(--color-white); border: none; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .info-alert.success { background: #ECFDF5; color: #065F46; padding: 12px 16px; border-radius: var(--radius-md); font-size: 13px; border: 1px solid #A7F3D0; text-align: center; }
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

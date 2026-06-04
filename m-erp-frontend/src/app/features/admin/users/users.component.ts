import { Component, OnInit, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserPlus, UploadCloud, DownloadCloud, X } from 'lucide-angular';
import { AdminUsersService } from '../../../core/services/admin-users.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/table/table.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Usuarios</h1>
          <p class="page-subtitle">Administra roles, identifica aprendices e instructores</p>
        </div>
        <div class="header-actions">
           @if (srv.currentTab() === 'Aprendices') {
             <button class="btn-secondary" (click)="showBulkModal.set(true)">
               <lucide-icon name="upload-cloud" [size]="16"></lucide-icon> Carga Masiva
             </button>
           }
           <button class="btn-primary" (click)="openCreateModal()">
             <lucide-icon name="user-plus" [size]="16"></lucide-icon> Añadir Usuario
           </button>
        </div>
      </div>

      <!-- TABS -->
      <div class="tabs-container">
        @for (tab of srv.roles; track tab) {
          <button 
             class="tab-btn" 
             [class.active]="srv.currentTab() === tab" 
             (click)="onTabChange(tab)">
            {{ tab }}
          </button>
        }
      </div>

      <!-- CASCADING FILTERS -->
      <div class="filters-card">
        <div class="filter-group">
          <label>Área Funcional</label>
          <select 
             [ngModel]="srv.selectedAreaId()" 
             (ngModelChange)="onAreaChange($event)"
             class="form-select">
            <option [ngValue]="null">Todas las áreas</option>
            @for (area of srv.areas(); track area.id) {
              <option [value]="area.id">{{ area.nombre }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <label>Programa de Formación</label>
          <select 
             [disabled]="!srv.selectedAreaId()"
             [ngModel]="srv.selectedProgramaId()" 
             (ngModelChange)="onProgramaChange($event)"
             class="form-select">
            <option [ngValue]="null">Seleccione un programa...</option>
            @for (prog of srv.programas(); track prog.id) {
              <option [value]="prog.id">{{ prog.nombre }}</option>
            }
          </select>
        </div>

        @if (srv.currentTab() === 'Aprendices') {
          <div class="filter-group">
            <label>Ficha (Curso)</label>
            <select 
               [disabled]="!srv.selectedProgramaId()"
               [ngModel]="srv.selectedCursoId()" 
               (ngModelChange)="onCursoChange($event)"
               class="form-select">
              <option [ngValue]="null">Seleccione ficha...</option>
              @for (curso of srv.cursos(); track curso.id) {
                <option [value]="curso.id">{{ curso.id_curso }} - {{ curso.jornada }}</option>
              }
            </select>
          </div>
        }
      </div>

      <!-- DATA TABLE CACHE INJECTION -->
      @if (srv.isLoading()) {
         <div class="loading-state">Buscando usuarios...</div>
      } @else {
         <app-data-table 
             [columns]="tableColumns()" 
             [data]="mappedUsers()"
             (onEdit)="editUser($event)"
             (onDelete)="deleteUser($event)">
         </app-data-table>
      }

      <!-- CREATE USER MODAL -->
      @if (showCreateModal()) {
        <div class="modal-overlay">
          <div class="modal-content animate-slide-up">
            <div class="modal-header">
              <h3>Crear Nuevo Usuario</h3>
              <button class="close-btn" (click)="closeCreateModal()"><lucide-icon name="x" [size]="20"></lucide-icon></button>
            </div>
            <form (ngSubmit)="submitCreateUser()" #f="ngForm">
              <div class="modal-body user-form-grid">
                 <!-- Form Fields -->
                 <div class="form-group grid-2">
                   <div>
                     <label>Nombre Completo</label>
                     <input type="text" class="form-control" name="nombre" [(ngModel)]="newUser.nombre" required />
                   </div>
                   <div>
                     <label>Apellido</label>
                     <input type="text" class="form-control" name="apellido" [(ngModel)]="newUser.apellido" required />
                   </div>
                 </div>
                 <div class="form-group grid-2">
                   <div>
                     <label>Tipo Documento</label>
                     <select class="form-select" name="tipo_documento" [(ngModel)]="newUser.tipo_documento" required>
                       <option value="CC">CC</option>
                       <option value="TI">TI</option>
                       <option value="CE">CE</option>
                       <option value="Pasaporte">Pasaporte</option>
                     </select>
                   </div>
                   <div>
                     <label>Número de Documento</label>
                     <input type="text" class="form-control" name="numero_documento" [(ngModel)]="newUser.numero_documento" required />
                   </div>
                 </div>
                 <div class="form-group">
                   <label>Correo Electrónico</label>
                   <input type="email" class="form-control" name="correo" [(ngModel)]="newUser.correo" required />
                 </div>
                 <div class="form-group grid-2">
                   <div>
                     <label>Contraseña</label>
                     <input type="password" class="form-control" name="password" [(ngModel)]="newUser.password" required />
                   </div>
                    <div>
                      <label>Rol</label>
                      <select class="form-select" name="rol_new" [(ngModel)]="newUser.rol" (ngModelChange)="onRolChange($event)" required>
                        <option value="Administrador">Administrador</option>
                        <option value="Instructor">Instructor</option>
                        <option value="Aprendiz">Aprendiz</option>
                      </select>
                    </div>
                 </div>
                 <div class="form-group">
                   <label>Dirección</label>
                   <input type="text" class="form-control" name="direccion" [(ngModel)]="newUser.direccion" />
                 </div>
                 <div class="form-group grid-2">
                   <div>
                     <label>Municipio</label>
                     <select class="form-select" name="municipio_id" [(ngModel)]="newUser.municipio_id" required>
                       <option value="">Seleccione...</option>
                       @for (mun of srv.municipios(); track mun.id) {
                         <option [value]="mun.id">{{ mun.nombre }}</option>
                       }
                     </select>
                   </div>
                   <div>
                     <label>Género</label>
                     <select class="form-select" name="genero" [(ngModel)]="newUser.genero">
                       <option value="Masculino">Masculino</option>
                       <option value="Femenino">Femenino</option>
                       <option value="Otro">Otro</option>
                     </select>
                   </div>
                  </div>
                @if (newUserRol() === 'Instructor') {
                  <div class="form-group grid-2" style="grid-column: 1 / -1;">
                    <div>
                      <label>Área Funcional <span style="color:#DC2626">*</span></label>
                      <select class="form-select" name="area_id_new" [(ngModel)]="newUser.area_id" [required]="newUserRol() === 'Instructor'">
                        <option value="">Seleccione un área...</option>
                        @for (a of srv.areas(); track a.id) {
                          <option [value]="a.id">{{ a.nombre }}</option>
                        }
                      </select>
                    </div>
                  </div>
                }
                <!-- Ficha/Curso only when Rol = Aprendiz -->
                @if (newUserRol() === 'Aprendiz') {
                  <div class="form-group grid-2" style="grid-column: 1 / -1;">
                    <div>
                      <label>Ficha / Curso <span style="color:#DC2626">*</span></label>
                      <select class="form-select" name="curso_id" [(ngModel)]="newUser.curso_id" (ngModelChange)="onCursoSelected($event)" [required]="newUserRol() === 'Aprendiz'">
                        <option value="">Seleccione ficha...</option>
                        @for (c of srv.allCursos(); track c.id) {
                          <option [value]="c.id">{{ c.id_curso }} – {{ c.programa?.nombre || 'Sin programa' }} – {{ c.jornada || '' }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label>Área Funcional</label>
                      <input type="text" class="form-control" [value]="readonlyAreaName" disabled
                             style="background-color: #F4F6F8; border-color: #e2e8f0; color: #64748b; cursor: not-allowed;" 
                             placeholder="Se asigna automáticamente según la ficha seleccionada">
                    </div>
                  </div>
                }
               </div>
               <div class="modal-footer">
                  <button type="button" class="btn-outline-success" (click)="closeCreateModal()">Cancelar</button>
                  <button type="submit" class="btn-success" [disabled]="f.invalid || creatingUser()">
                    {{ creatingUser() ? 'Guardando...' : 'Guardar Usuario' }}
                  </button>
               </div>
            </form>
          </div>
        </div>
      }

      <!-- BULK MODAL (OVERLAY BACKDROP) -->
      @if (showBulkModal()) {
        <div class="modal-overlay">
          <div class="modal-content bulk-modal animate-slide-up">
            <div class="modal-header">
              <h3>Carga Masiva de Aprendices</h3>
              <button class="close-btn" (click)="closeBulkModal()"><lucide-icon name="x" [size]="20"></lucide-icon></button>
            </div>
            <div class="modal-body">
               <p class="modal-text">Por favor descargue la plantilla, llene los datos en formato estricto y suba el archivo aquí.</p>
               
               <div class="download-section" style="margin-bottom: 16px;">
                 <button class="btn-secondary" (click)="srv.downloadTemplate()">
                   <lucide-icon name="download-cloud" [size]="16"></lucide-icon> Descargar Plantilla
                 </button>
               </div>

               <input type="file" #fileInput accept=".xlsx, .xls" class="file-input" (change)="onFileSelected($event)" />
               
               @if (bulkLogs().length > 0) {
                 <div class="logs-container">
                   @for (log of bulkLogs(); track $index) {
                     <div class="log-item" [class.success]="log.success" [class.error]="!log.success">
                       Fila {{ log.row }}: {{ log.message }}
                     </div>
                   }
                 </div>
               }
            </div>
            <div class="modal-footer">
               <button class="btn-secondary" (click)="closeBulkModal()">Cancelar</button>
               <button class="btn-primary" (click)="submitMassiveUpload()" [disabled]="!selectedFile() || uploading()">
                 {{ uploading() ? 'Procesando...' : 'Cargar Usuarios' }}
               </button>
            </div>
          </div>
        </div>
      }

      <!-- EDIT USER MODAL -->
      @if (showEditModal()) {
        <div class="modal-overlay">
          <div class="modal-content animate-slide-up">
            <div class="modal-header">
              <h3>Editar Usuario</h3>
              <button class="close-btn" (click)="closeEditModal()"><lucide-icon name="x" [size]="20"></lucide-icon></button>
            </div>
            <form (ngSubmit)="submitEditUser()" #fEdit="ngForm">
              <div class="modal-body user-form-grid">
                 <div class="form-group grid-2">
                   <div>
                     <label>Nombre Completo</label>
                     <input type="text" class="form-control" name="nombre" [(ngModel)]="editUserPayload.nombre" required />
                   </div>
                   <div>
                     <label>Apellido</label>
                     <input type="text" class="form-control" name="apellido" [(ngModel)]="editUserPayload.apellido" required />
                   </div>
                 </div>
                 <div class="form-group grid-2">
                   <div>
                     <label>Tipo Documento</label>
                     <select class="form-select" name="tipo_documento" [(ngModel)]="editUserPayload.tipo_documento" required>
                       <option value="CC">CC</option>
                       <option value="TI">TI</option>
                       <option value="CE">CE</option>
                       <option value="Pasaporte">Pasaporte</option>
                     </select>
                   </div>
                   <div>
                     <label>Número de Documento</label>
                     <input type="text" class="form-control" name="numero_documento" [(ngModel)]="editUserPayload.numero_documento" required />
                   </div>
                 </div>
                 <div class="form-group">
                   <label>Correo Electrónico</label>
                   <input type="email" class="form-control" name="correo" [(ngModel)]="editUserPayload.correo" required />
                 </div>
                 <div class="form-group grid-2">
                   <div>
                     <label>Contraseña (Opcional)</label>
                     <input type="password" class="form-control" name="password" [(ngModel)]="editUserPayload.password" placeholder="Solo si desea cambiarla" />
                   </div>
                    <div>
                      <label>Rol</label>
                      <select class="form-select" name="rol_edit" [(ngModel)]="editUserPayload.rol" (ngModelChange)="onEditRolChange($event)" required>
                        <option value="Administrador">Administrador</option>
                        <option value="Instructor">Instructor</option>
                        <option value="Aprendiz">Aprendiz</option>
                      </select>
                    </div>
                 </div>
                 <div class="form-group">
                   <label>Dirección</label>
                   <input type="text" class="form-control" name="direccion" [(ngModel)]="editUserPayload.direccion" />
                 </div>
                 <div class="form-group grid-2">
                   <div>
                     <label>Municipio</label>
                     <select class="form-select" name="municipio_id" [(ngModel)]="editUserPayload.municipio_id" required>
                       <option value="">Seleccione...</option>
                       @for (mun of srv.municipios(); track mun.id) {
                         <option [value]="mun.id">{{ mun.nombre }}</option>
                       }
                     </select>
                   </div>
                   <div>
                     <label>Género</label>
                     <select class="form-select" name="genero" [(ngModel)]="editUserPayload.genero">
                       <option value="Masculino">Masculino</option>
                       <option value="Femenino">Femenino</option>
                       <option value="Otro">Otro</option>
                     </select>
                   </div>
                 </div>
                @if (editUserRol() === 'Instructor') {
                  <div class="form-group grid-2" style="grid-column: 1 / -1;">
                    <div>
                      <label>Área Funcional <span style="color:#DC2626">*</span></label>
                      <select class="form-select" name="area_id_edit" [(ngModel)]="editUserPayload.area_id" [required]="editUserRol() === 'Instructor'">
                        <option value="">Seleccione un área...</option>
                        @for (a of srv.areas(); track a.id) {
                          <option [value]="a.id">{{ a.nombre }}</option>
                        }
                      </select>
                    </div>
                  </div>
                }
               <!-- Ficha/Curso only when Rol = Aprendiz -->
               @if (editUserRol() === 'Aprendiz') {
                 <div class="form-group grid-2" style="grid-column: 1 / -1;">
                   <div>
                     <label>Ficha / Curso <span style="color:#DC2626">*</span></label>
                     <select class="form-select" name="edit_curso_id" [(ngModel)]="editUserPayload.curso_id" (ngModelChange)="onCursoSelected($event)">
                       <option value="">Seleccione ficha...</option>
                       @for (c of srv.allCursos(); track c.id) {
                         <option [value]="c.id">{{ c.id_curso }} – {{ c.programa?.nombre || 'Sin programa' }} – {{ c.jornada || '' }}</option>
                       }
                     </select>
                   </div>
                   <div>
                     <label>Área Funcional</label>
                     <input type="text" class="form-control" [value]="readonlyAreaName" disabled
                            style="background-color: #F4F6F8; border-color: #e2e8f0; color: #64748b; cursor: not-allowed;" 
                            placeholder="Se asigna automáticamente según la ficha seleccionada">
                   </div>
                 </div>
               }
               </div>
              <div class="modal-footer">
                 <button type="button" class="btn-outline-success" (click)="closeEditModal()">Cancelar</button>
                 <button type="submit" class="btn-success" [disabled]="fEdit.invalid || operatingUser()">
                   {{ operatingUser() ? 'Guardando...' : 'Actualizar Usuario' }}
                 </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- DELETE MODAL -->
      @if (showDeleteModal()) {
        <div class="modal-overlay">
          <div class="modal-content animate-slide-up" style="max-width: 400px; padding: 12px;">
            <div class="modal-body" style="text-align: center;">
              <h3 style="margin-bottom: 8px;">Eliminar Usuario</h3>
              <p class="modal-text" style="color: var(--color-text); font-size: 15px;">¿Estás seguro de que deseas eliminar a <strong>{{ selectedUserForDelete()?.nombre }}</strong>? Esta acción no se puede deshacer.</p>
            </div>
             <div class="modal-footer" style="border-top: none; justify-content: center; padding-bottom: 6px;">
                <button type="button" class="btn-outline-success" (click)="closeDeleteModal()">Cancelar</button>
                <button type="button" class="btn-danger" (click)="submitDeleteUser()" [disabled]="operatingUser()">
                  {{ operatingUser() ? 'Procesando...' : 'Eliminar' }}
                </button>
             </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .page-title {
      font-size: 22px;
      color: var(--color-text);
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--color-text-muted);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .tabs-container {
      display: flex;
      gap: 8px;
      padding: 4px;
      background: var(--color-bg);
      border-radius: var(--radius-md);
      width: fit-content;
      border: 1px solid var(--color-border);
    }

    .tab-btn {
      background: transparent;
      border: none;
      padding: 8px 16px;
      color: var(--color-text-muted);
      font-size: 14px;
      font-weight: 500;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: var(--color-white);
      color: var(--color-primary);
      box-shadow: var(--shadow-sm);
    }

    .filters-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      padding: 20px 24px;
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 200px;
      flex: 1;
    }

    .filter-group label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text);
    }

    .form-select {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      background: var(--color-white);
      color: var(--color-text);
      outline: none;
    }

    .form-select:focus {
      border-color: var(--color-primary);
    }

    .form-select:disabled {
      background: var(--color-bg);
      opacity: 0.6;
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--color-primary);
      color: var(--color-white);
      border: none;
    }
    
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-secondary {
      background: var(--color-white);
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
    }

    .btn-secondary:hover { background: var(--color-primary-light); }

    .loading-state {
      padding: 40px;
      text-align: center;
      color: var(--color-text-muted);
    }

    /* Modals backdrop */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-content {
      background: var(--color-white);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      padding: 24px 28px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: 18px;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
    }

    .modal-body {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-text {
      font-size: 14px;
      color: var(--color-text-muted);
    }

    .file-input {
      border: 1px dashed var(--color-border);
      padding: 32px;
      text-align: center;
      border-radius: var(--radius-lg);
      background: var(--color-bg);
    }

    .logs-container {
      max-height: 200px;
      overflow-y: auto;
      background: #111827;
      color: #D1D5DB;
      padding: 12px;
      border-radius: var(--radius-md);
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .log-item.success { color: #34D399; }
    .log-item.error { color: #F87171; }

    .modal-footer {
      padding: 16px 28px;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: var(--color-bg);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text);
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      outline: none;
    }
    
    .form-control:focus {
      border-color: #2E7D52;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .user-form-grid {
      gap: 16px;
    }

    .btn-success {
      background: #2E7D52;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-success:hover:not(:disabled) { background: #23603F; }
    .btn-success:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-outline-success {
      background: white;
      color: #2E7D52;
      border: 1px solid #2E7D52;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .btn-outline-success:hover { background: #F0FDF4; }

    .btn-danger {
      background: #EF4444;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-danger:hover:not(:disabled) { background: #DC2626; }
    .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-slide-up {
      animation: slideUp 0.3s ease-out forwards;
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  srv = inject(AdminUsersService);

  tableColumns = signal<TableColumn[]>([
    { field: 'documento', header: 'Documento' },
    { field: 'nombre', header: 'Nombre Completo' },
    { field: 'correo', header: 'Correo Electrónico' },
    { field: 'liderazgo', header: 'Liderazgo', isLiderazgo: true },
    { field: 'estado', header: 'Estado', isBadge: true },
    { field: 'acciones', header: '', isAction: true }
  ]);

  showBulkModal = signal(false);
  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  bulkLogs = signal<any[]>([]);

  showCreateModal = signal(false);
  creatingUser = signal(false);
  newUserRol = signal<string>('Aprendiz');
  editUserRol = signal<string>('Aprendiz');
  newUser = {
    nombre: '',
    tipo_documento: 'CC',
    numero_documento: '',
    correo: '',
    password: '',
    rol: 'Aprendiz',
    direccion: '',
    municipio_id: '',
    genero: 'Masculino',
    curso_id: '',
    area_id: '',
    apellido: ''
  };

  openCreateModal() {
    const currentRoleStr = this.srv.currentTab();
    const roleMapping: any = {
      'Instructores': 'Instructor',
      'Aprendices': 'Aprendiz',
      'Administradores': 'Administrador'
    };
    const defaultRol = roleMapping[currentRoleStr] || 'Aprendiz';
    
    this.newUser = {
      nombre: '',
      tipo_documento: 'CC',
      numero_documento: '',
      correo: '',
      password: '',
      rol: defaultRol,
      direccion: '',
      municipio_id: '',
      genero: 'Masculino',
      curso_id: '',
      area_id: '',
      apellido: ''
    };
    this.newUserRol.set(defaultRol);
    this.readonlyAreaName = '';
    this.showCreateModal.set(true);
  }

  readonlyAreaName = '';

  onRolChange(val: string) {
    this.newUser.rol = val;
    this.newUserRol.set(val);
  }

  onEditRolChange(val: string) {
    this.editUserPayload.rol = val;
    this.editUserRol.set(val);
  }

  onCursoSelected(cursoId: string) {
    if (!cursoId) {
      this.readonlyAreaName = '';
      return;
    }
    this.srv.getCursoById(cursoId).subscribe(res => {
      this.readonlyAreaName = res.area?.nombre || 'Sin Área asignada';
    });
  }

  ngOnInit() {
    this.srv.fetchAreas();
    this.srv.fetchMunicipios();
    this.srv.fetchAllCursos();
    this.srv.fetchUsers();
  }

  // Mapear los datos que vienen directo de la tabla de la base de datos (Usuario -> Persona) al schema plano de la tabla
  mappedUsers = computed(() => {
    return this.srv.users().map((u: any) => ({
      id: u.id,
      documento: u.identificacion || u.persona?.numero_documento || 'No Asignado',
      nombre: u.nombre || u.persona?.nombre || 'Desconocido',
      correo: u.correo || u.persona?.correo || u.credencial?.username || 'Sin Correo',
      estado: u.estado,
      es_lider_area: u.es_lider_area,
      nombre_area: u.nombre_area,
      es_lider_ficha: u.es_lider_ficha,
      numero_ficha: u.numero_ficha
    }));
  });

  onTabChange(tab: string) {
    this.srv.currentTab.set(tab);

    if (tab === 'Instructores') {
      this.tableColumns.set([
        { field: 'documento', header: 'Documento' },
        { field: 'nombre', header: 'Nombre Completo' },
        { field: 'correo', header: 'Correo Electrónico' },
        { field: 'liderazgo', header: 'Liderazgo', isLiderazgo: true },
        { field: 'estado', header: 'Estado', isBadge: true },
        { field: 'acciones', header: '', isAction: true }
      ]);
    } else {
      this.tableColumns.set([
        { field: 'documento', header: 'Documento' },
        { field: 'nombre', header: 'Nombre Completo' },
        { field: 'correo', header: 'Correo Electrónico' },
        { field: 'estado', header: 'Estado', isBadge: true },
        { field: 'acciones', header: '', isAction: true }
      ]);
    }

    // Reiniciar cascadas y cargar defaults
    this.srv.selectedAreaId.set(null);
    this.srv.selectedProgramaId.set(null);
    this.srv.selectedCursoId.set(null);
    this.srv.fetchUsers();
  }

  onAreaChange(id: string) {
    this.srv.selectedAreaId.set(id);
    this.srv.fetchProgramas(id);
    this.srv.fetchUsers();
  }

  onProgramaChange(id: string) {
    this.srv.selectedProgramaId.set(id);
    this.srv.fetchCursos(id);
    this.srv.fetchUsers();
  }

  onCursoChange(id: string) {
    this.srv.selectedCursoId.set(id);
    this.srv.fetchUsers();
  }

  onFileSelected(event: any) {
    this.selectedFile.set(event.target.files[0] || null);
  }

  showEditModal = signal(false);
  showDeleteModal = signal(false);
  operatingUser = signal(false);
  selectedUserForEditId = signal<string | null>(null);
  selectedUserForDelete = signal<any>(null);
  
  editUserPayload = {
    nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '',
    correo: '', password: '', rol: 'Aprendiz',
    direccion: '', municipio_id: '', genero: 'Masculino', curso_id: '', area_id: ''
  };

  editUser(row: any) {
    this.operatingUser.set(true);
    this.srv.getUser(row.id).subscribe({
      next: (fullUser: any) => {
        this.operatingUser.set(false);
        this.selectedUserForEditId.set(fullUser.id);
        const rolCargado = fullUser.rol || 'Aprendiz';
        this.editUserRol.set(rolCargado);
        this.editUserPayload = {
          nombre: fullUser.nombre || '',
          apellido: fullUser.apellido || '',
          tipo_documento: fullUser.tipo_documento || 'CC',
          numero_documento: fullUser.numero_documento || '',
          correo: fullUser.correo || '',
          password: '',
          rol: rolCargado,
          direccion: fullUser.direccion || '',
          municipio_id: fullUser.municipio_id || '',
          genero: fullUser.genero || 'Masculino',
          curso_id: '',
          area_id: fullUser.area_id || ''
        };

        // If Aprendiz, pre-load current matricula
        if (fullUser.rol === 'Aprendiz') {
          this.srv.getMatricula(fullUser.id).subscribe({
            next: (mat: any) => {
              if (mat && mat.curso) {
                this.editUserPayload.curso_id = mat.curso.id;
                this.onCursoSelected(mat.curso.id);
              }
              this.showEditModal.set(true);
            },
            error: () => this.showEditModal.set(true)
          });
        } else {
          this.showEditModal.set(true);
        }
      },
      error: (err) => {
        console.error(err);
        this.operatingUser.set(false);
        alert('Error al obtener datos completos del usuario desde la base de datos.');
      }
    });
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedUserForEditId.set(null);
    this.editUserRol.set('Aprendiz');
  }

  submitEditUser() {
    if (!this.selectedUserForEditId()) return;
    this.operatingUser.set(true);
    const userId = this.selectedUserForEditId()!;
    const payload = { ...this.editUserPayload, rol_nombre: this.editUserPayload.rol };
    
    this.srv.updateUser(userId, payload).subscribe({
      next: () => {
        const doFinish = () => {
          this.operatingUser.set(false);
          this.closeEditModal();
          this.srv.fetchUsers();
          alert('Usuario actualizado correctamente');
        };

        if (this.editUserPayload.rol === 'Aprendiz' && this.editUserPayload.curso_id) {
          this.srv.matricularAprendiz(userId, this.editUserPayload.curso_id).subscribe({
            next: () => doFinish(),
            error: (matErr) => {
              console.error('Error actualizando matrícula:', matErr);
              doFinish(); // still close, user data was updated
            }
          });
        } else {
          doFinish();
        }
      },
      error: (err) => {
        console.error('Error actualizando:', err);
        this.operatingUser.set(false);
        alert('Ocurrió un error al actualizar. Revise consola.');
      }
    });
  }

  deleteUser(row: any) {
    this.selectedUserForDelete.set(row);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedUserForDelete.set(null);
  }

  submitDeleteUser() {
    const usr = this.selectedUserForDelete();
    if (!usr) return;
    this.operatingUser.set(true);
    
    this.srv.deleteUser(usr.id).subscribe({
      next: () => {
        this.operatingUser.set(false);
        this.closeDeleteModal();
        this.srv.fetchUsers();
      },
      error: (err) => {
        console.error('Error eliminando:', err);
        this.operatingUser.set(false);
        alert('Ocurrió un error al eliminar. Revise consola.');
      }
    });
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.newUserRol.set('Aprendiz');
    this.newUser = {
      nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '',
      correo: '', password: '', rol: 'Aprendiz',
      direccion: '', municipio_id: '', genero: 'Masculino', curso_id: '', area_id: ''
    };
  }

  submitCreateUser() {
    this.creatingUser.set(true);
    const payload = { ...this.newUser, rol_nombre: this.newUser.rol };
    
    this.srv.createUser(payload).subscribe({
      next: (res: any) => {
        const doFinish = () => {
          this.creatingUser.set(false);
          this.closeCreateModal();
          this.srv.fetchUsers();
          alert(`¡Usuario creado correctamente!\nEl Username generado es: ${res.username}`);
        };

        // If Aprendiz and a course was selected, enroll them
        if (this.newUser.rol === 'Aprendiz' && this.newUser.curso_id) {
          this.srv.matricularAprendiz(res.id, this.newUser.curso_id).subscribe({
            next: () => doFinish(),
            error: (matErr) => {
              console.error('Error matriculando:', matErr);
              // User was created but matricula failed – still close and inform
              this.creatingUser.set(false);
              this.closeCreateModal();
              this.srv.fetchUsers();
              alert(`Usuario creado (${res.username}), pero hubo un error al asignar la ficha. Edita el usuario para corregirlo.`);
            }
          });
        } else {
          doFinish();
        }
      },
      error: (err) => {
        console.error('Error creando usuario:', err);
        this.creatingUser.set(false);
        alert('Ocurrió un error al crear el usuario. Revise la consola.');
      }
    });
  }

  closeBulkModal() {
    this.showBulkModal.set(false);
    this.selectedFile.set(null);
    this.bulkLogs.set([]);
  }

  submitMassiveUpload() {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.bulkLogs.set([]);

    this.srv.uploadMassive(file).subscribe({
      next: (res: any) => {
        this.uploading.set(false);
        // Supongamos que el backend responde con un array de logs { row: X, success: true/false, message: '' }
        this.bulkLogs.set(res.logs || [{ row: 0, success: true, message: 'Carga completada sin reportes avanzados.' }]);
        this.srv.fetchUsers(); // Refresh background
      },
      error: (err) => {
        this.uploading.set(false);
        this.bulkLogs.set([{ row: 0, success: false, message: 'Error fatal cargando el archivo: ' + err.message }]);
      }
    });
  }
}

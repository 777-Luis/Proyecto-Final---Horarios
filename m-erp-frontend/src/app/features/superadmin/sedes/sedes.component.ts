import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-superadmin-sedes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Gestión de Sedes</h1>
          <p>Administra los tenants (sedes) registrados en la plataforma</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <lucide-icon name="plus" [size]="18"></lucide-icon>
          Nueva Sede
        </button>
      </div>

      <div class="panel">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código (Subdominio)</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (sede of sedes(); track sede.id) {
                <tr>
                  <td class="font-medium">{{ sede.nombre }}</td>
                  <td><span class="badge gray">{{ sede.codigo }}</span></td>
                  <td>{{ sede.direccion || '-' }}</td>
                  <td>{{ sede.telefono || '-' }}</td>
                  <td>
                    <span class="badge" [class.success]="sede.activo" [class.danger]="!sede.activo">
                      {{ sede.activo ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon text-blue" title="Editar" (click)="edit(sede)">
                      <lucide-icon name="edit-2" [size]="16"></lucide-icon>
                    </button>
                    <button class="btn-icon text-red" title="Eliminar" (click)="delete(sede.id)">
                      <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                    </button>
                  </td>
                </tr>
              }
              @if (sedes().length === 0) {
                <tr>
                  <td colspan="6" class="text-center text-gray py-8">
                    No hay sedes registradas
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing() ? 'Editar Sede' : 'Nueva Sede' }}</h3>
            <button class="btn-close" (click)="closeModal()">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>
          <div class="modal-body">
            <form [formGroup]="sedeForm" (ngSubmit)="onSubmit()" class="form-layout">
              <div class="form-group">
                <label>Nombre de la Sede *</label>
                <input type="text" formControlName="nombre" class="form-control" placeholder="Ej. SENA Centro Tecnológico" />
              </div>
              <div class="form-group">
                <label>Código (Identificador único) *</label>
                <input type="text" formControlName="codigo" class="form-control" placeholder="Ej. centro-tec" [readonly]="isEditing()" />
                <span class="help-text">Se usa para identificar el tenant en la base de datos (Prefijo RLS)</span>
              </div>
              <div class="form-group">
                <label>Dirección</label>
                <input type="text" formControlName="direccion" class="form-control" />
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input type="text" formControlName="telefono" class="form-control" />
              </div>
              <div class="form-group checkbox-group">
                <input type="checkbox" formControlName="activo" id="activo" />
                <label for="activo">Sede activa</label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="sedeForm.invalid">
                  {{ isEditing() ? 'Guardar Cambios' : 'Crear Sede' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
    }

    .page-header h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #111827; }
    .page-header p { margin: 0; color: #6B7280; font-size: 14px; }

    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      background: #0D3321; color: #FFD700;
      border: none; padding: 10px 20px; border-radius: 8px;
      font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .btn-primary:hover { background: #0a291a; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-secondary {
      background: #FFFFFF; color: #374151; border: 1px solid #D1D5DB;
      padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .btn-secondary:hover { background: #F3F4F6; }

    .panel { background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #F3F4F6; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { background: #F9FAFB; padding: 12px 20px; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
    .data-table td { padding: 16px 20px; font-size: 14px; color: #374151; border-bottom: 1px solid #F3F4F6; }
    
    .font-medium { font-weight: 500; color: #111827 !important; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-gray { color: #6B7280; }
    .py-8 { padding-top: 32px !important; padding-bottom: 32px !important; }

    .badge { display: inline-flex; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    .badge.success { background: #D1FAE5; color: #065F46; }
    .badge.danger { background: #FEE2E2; color: #991B1B; }
    .badge.gray { background: #F3F4F6; color: #374151; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-icon { background: transparent; border: none; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: #F3F4F6; }
    .text-blue { color: #3B82F6; }
    .text-red { color: #EF4444; }

    /* Modal */
    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; }
    .modal-card { background: #FFFFFF; width: 100%; max-width: 500px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #111827; }
    .btn-close { background: transparent; border: none; color: #6B7280; cursor: pointer; padding: 4px; }
    .btn-close:hover { color: #111827; }
    .modal-body { padding: 24px; }
    
    .form-layout { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 14px; font-weight: 500; color: #374151; }
    .form-control { padding: 10px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; }
    .form-control:focus { outline: none; border-color: #0D3321; box-shadow: 0 0 0 3px rgba(13,51,33,0.1); }
    .form-control[readonly] { background: #F3F4F6; cursor: not-allowed; }
    .help-text { font-size: 12px; color: #6B7280; }
    
    .checkbox-group { flex-direction: row; align-items: center; gap: 8px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
  `]
})
export class SuperadminSedesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  
  sedes = signal<any[]>([]);
  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  sedeForm = this.fb.group({
    nombre: ['', Validators.required],
    codigo: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    direccion: [''],
    telefono: [''],
    activo: [true]
  });

  ngOnInit() {
    this.loadSedes();
  }

  loadSedes() {
    this.http.get<any[]>('http://localhost:3000/api/erp/v1/superadmin/sedes').subscribe(data => {
      this.sedes.set(data);
    });
  }

  openModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.sedeForm.reset({ activo: true });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  edit(sede: any) {
    this.isEditing.set(true);
    this.editingId.set(sede.id);
    this.sedeForm.patchValue({
      nombre: sede.nombre,
      codigo: sede.codigo,
      direccion: sede.direccion,
      telefono: sede.telefono,
      activo: sede.activo
    });
    this.showModal.set(true);
  }

  delete(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar esta sede?')) {
      this.http.delete(`http://localhost:3000/api/erp/v1/superadmin/sedes/${id}`).subscribe(() => {
        this.loadSedes();
      });
    }
  }

  onSubmit() {
    if (this.sedeForm.invalid) return;
    
    const val = this.sedeForm.value;
    if (this.isEditing()) {
      this.http.patch(`http://localhost:3000/api/erp/v1/superadmin/sedes/${this.editingId()}`, val).subscribe(() => {
        this.loadSedes();
        this.closeModal();
      });
    } else {
      this.http.post('http://localhost:3000/api/erp/v1/superadmin/sedes', val).subscribe(() => {
        this.loadSedes();
        this.closeModal();
      });
    }
  }
}

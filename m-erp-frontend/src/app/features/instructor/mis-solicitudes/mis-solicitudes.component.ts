import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, PlusCircle, CheckCircle, XCircle, Search } from 'lucide-angular';
import { InstructorService } from '../../../core/services/instructor.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormsModule } from '@angular/forms';
import { SolicitudVisualComponent } from './solicitud-visual.component';

@Component({
  selector: 'app-mis-solicitudes-lider',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DataTableComponent, SolicitudVisualComponent],
  template: `
    <div class="page-container">
       <div class="page-header">
         <div>
           <h1 class="page-title">Gestión de Solicitudes (Líder)</h1>
           <p class="page-subtitle">Solicite y gestione cambios a nombre de los instructores de su área.</p>
         </div>
         <div class="header-actions">
           <button class="btn-primary" (click)="openCreateModal()">
             <lucide-icon name="plus-circle" [size]="16"></lucide-icon> Nueva Solicitud
           </button>
         </div>
       </div>

       <!-- Filtros Visuales -->
       <div class="tabs-container">
         <button [class.active]="currentTab() === 'Todas'" (click)="currentTab.set('Todas')">Todas</button>
         <button [class.active]="currentTab() === 'Pendientes'" (click)="currentTab.set('Pendientes')">Pendientes</button>
         <button [class.active]="currentTab() === 'Aprobadas'" (click)="currentTab.set('Aprobadas')">Aprobadas</button>
         <button [class.active]="currentTab() === 'Rechazadas'" (click)="currentTab.set('Rechazadas')">Rechazadas</button>
       </div>

       @if (isCreatingNewReq()) {
         <app-solicitud-visual 
            (onCancel)="closeCreateView()" 
            (onSuccess)="onVisualSuccess()">
         </app-solicitud-visual>
       } @else {
         <div class="list-container">
            <app-data-table 
               [columns]="tableCols()" 
               [data]="filteredRevs()"
               (onNotify)="verDetalles($event)">
            </app-data-table>
         </div>
       }

       <!-- Modal Detalles (Ver Observaciones) -->
       @if (selectedReqDetalle()) {
         <div class="modal-overlay">
           <div class="modal-content animate-slide-up">
             <div class="modal-header">
               <h3>Detalles de la Solicitud</h3>
               <button class="close-btn" (click)="selectedReqDetalle.set(null)"><lucide-icon name="x-circle" [size]="20"></lucide-icon></button>
             </div>
             <div class="modal-body">
                <div class="detail-row"><span class="fw-500">Instructor:</span> {{ selectedReqDetalle().instructorName }}</div>
                <div class="detail-row"><span class="fw-500">Tipo:</span> {{ selectedReqDetalle().tipo_solicitud }}</div>
                <div class="detail-row"><span class="fw-500">Descripción:</span> {{ selectedReqDetalle().descripcion }}</div>
                
                <div class="status-box mt-3" [class.success]="selectedReqDetalle().estado === 'aprobado'" [class.danger]="selectedReqDetalle().estado === 'rechazado'">
                   <span class="fw-600">Estado:</span> {{ selectedReqDetalle().estadoFormateado }}
                   <div class="mt-2" *ngIf="selectedReqDetalle().observaciones_admin">
                      <span class="fw-500">Observaciones del Admin:</span>
                      <p class="mb-0 text-sm">{{ selectedReqDetalle().observaciones_admin }}</p>
                   </div>
                   <div class="mt-2" *ngIf="!selectedReqDetalle().observaciones_admin && selectedReqDetalle().estado === 'enviado_admin'">
                      <span class="text-sm">En espera de revisión por el administrador.</span>
                   </div>
                </div>
             </div>
             <div class="modal-footer">
                <button class="btn-primary" (click)="selectedReqDetalle.set(null)">Cerrar</button>
             </div>
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
    
    .header-actions { display: flex; gap: 12px; }
    
    .tabs-container { display: flex; gap: 8px; border-bottom: 1px solid var(--color-border); padding-bottom: 0; }
    .tabs-container button { background: transparent; border: none; padding: 10px 16px; font-weight: 500; color: var(--color-text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tabs-container button:hover { color: #2E7D52; }
    .tabs-container button.active { color: #2E7D52; border-bottom-color: #2E7D52; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: var(--color-white); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 550px; display: flex; flex-direction: column; overflow: hidden; max-height: 90vh; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 18px; }
    .close-btn { background: transparent; border: none; cursor: pointer; color: var(--color-text-muted); }
    
    .modal-body.custom-scroll { padding: 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 12px; background: var(--color-bg); }
    
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label { font-size: 13px; font-weight: 500; color: var(--color-text); }
    .form-control, .form-select { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 14px; outline: none; transition: border 0.2s; background: var(--color-white); font-family: inherit;}
    .form-control:focus, .form-select:focus { border-color: var(--color-primary); }

    .dynamic-section { background: #F9FAFB; border: 1px dashed #D1D5DB; padding: 16px; border-radius: 8px; margin-top: 8px; }
    .section-label { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 12px; display: block; }
    .change-fields-card { background: white; padding: 12px; border: 1px solid #E5E7EB; border-radius: 6px; margin-top: 12px; }
    .info-badge { background: #E0F2FE; color: #0284C7; font-size: 12px; font-weight: 500; padding: 4px 8px; border-radius: 4px; display: inline-block; }

    .btn-primary { display: flex; align-items: center; gap: 8px; background: #2E7D52; color: white; border: none; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; }
    .btn-primary:hover { background: #23603F; }

    .btn-success { background: #2E7D52; color: white; border: none; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; }
    .btn-success:hover:not(:disabled) { background: #23603F; }
    .btn-success:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-outline-success { background: white; color: #2E7D52; border: 1px solid #2E7D52; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; }
    .btn-outline-success:hover { background: #F0FDF4; }

    .status-box { padding: 16px; border-radius: 8px; background: #F3F4F6; border-left: 4px solid #9CA3AF; }
    .status-box.success { background: #F0FDF4; border-left-color: #22C55E; }
    .status-box.danger { background: #FEF2F2; border-left-color: #EF4444; }

    .flex-row { display: flex; }
    .flex-1 { flex: 1; }
    .gap-2 { gap: 8px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-0 { margin-bottom: 0; }
    .text-sm { font-size: 13px; }
    .fw-500 { font-weight: 500; }
    .fw-600 { font-weight: 600; }

    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
  `]
})
export class MisSolicitudesLiderComponent implements OnInit {
  srv = inject(InstructorService);

  currentTab = signal('Todas');

  tableCols = signal<TableColumn[]>([
    { field: 'instructorName', header: 'Instructor' },
    { field: 'tipo_solicitud', header: 'Tipo' },
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'estadoFormateado', header: 'Estado', isBadge: true },
    { field: 'acciones', header: 'Detalles', isNotifyAction: true }
  ]);

  isCreatingNewReq = signal(false);
  isSubmitting = signal(false);
  
  selectedReqDetalle = signal<any>(null);

  ngOnInit() {
    this.srv.fetchSolicitudesLider();
    this.srv.fetchInstructoresArea();
  }

  filteredRevs = computed(() => {
    let all = this.srv.solicitudesArea().map((s: any) => {
       let stateText = s.estado;
       if (s.estado === 'enviado_admin') stateText = 'Enviado';
       if (s.estado === 'aprobado') stateText = 'Aprobado';
       if (s.estado === 'rechazado') stateText = 'Rechazado';

       let badgeStyle = stateText;
       if (stateText === 'Enviado') badgeStyle = 'Activo';
       if (stateText === 'Rechazado') badgeStyle = 'Inactivo';

       return {
         ...s,
         instructorName: s.instructor?.nombre ? (s.instructor.nombre + ' ' + (s.instructor.apellido || '')) : 'Desconocido',
         estadoFormateado: badgeStyle,
         fechaFormateada: new Date(s.fecha_solicitud).toLocaleDateString(),
         // Trick DataTableComponent to show 'Ver' icon instead of 'Bell' by altering what the button does
         // The table.component.ts might hardcode lucide-bell, but we can override its text visually if we had access.
         // We will just use it to open the details modal.
       };
    });

    const tab = this.currentTab();
    if (tab === 'Todas') return all;
    if (tab === 'Pendientes') return all.filter(a => a.estadoFormateado === 'Activo');
    if (tab === 'Aprobadas') return all.filter(a => a.estadoFormateado === 'Aprobado');
    if (tab === 'Rechazadas') return all.filter(a => a.estadoFormateado === 'Inactivo');
    return all;
  });

  openCreateModal() {
    this.isCreatingNewReq.set(true);
  }

  closeCreateView() {
    this.isCreatingNewReq.set(false);
  }

  onVisualSuccess() {
    this.isCreatingNewReq.set(false);
    this.srv.fetchSolicitudesLider();
    // show a small alert or toast
    alert("Propuesta de cambio enviada exitosamente.");
  }

  verDetalles(row: any) {
    this.selectedReqDetalle.set(row);
  }
}

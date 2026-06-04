import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, CheckCircle, XCircle, Search, Clock, MapPin, User, Calendar } from 'lucide-angular';
import { DataTableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DataTableComponent],
  template: `
    <div class="page-container">
       <div class="page-header">
         <div>
           <h1 class="page-title">Gestión de Solicitudes</h1>
           <p class="page-subtitle">Revise, apruebe o rechace las solicitudes enviadas por los líderes de área.</p>
         </div>
       </div>

       <!-- Filtros Visuales -->
       <div class="tabs-container">
         <button [class.active]="currentTab() === 'Todas'" (click)="currentTab.set('Todas')">Todas</button>
         <button [class.active]="currentTab() === 'Pendientes'" (click)="currentTab.set('Pendientes')">Pendientes</button>
         <button [class.active]="currentTab() === 'Aprobadas'" (click)="currentTab.set('Aprobadas')">Aprobadas</button>
         <button [class.active]="currentTab() === 'Rechazadas'" (click)="currentTab.set('Rechazadas')">Rechazadas</button>
       </div>

       <div class="list-container">
          <app-data-table 
             [columns]="tableCols()" 
             [data]="filteredRequests()"
             (onEdit)="openProcessModal($event)">
          </app-data-table>
          <p class="hint-text">Utilice el botón lápiz para abrir y decidir sobre la solicitud elegida.</p>
       </div>

       @if (showProcessModal()) {
         <div class="modal-overlay">
           <div class="modal-content animate-slide-up">
             <div class="modal-header">
               <h3>Procesar Solicitud</h3>
               <button class="close-btn" (click)="showProcessModal.set(false)"><lucide-icon name="x-circle" [size]="20"></lucide-icon></button>
             </div>
             
             <div class="modal-body custom-scroll">
               <div class="request-summary">
                 <div class="detail-row"><span class="fw-500">Solicitante:</span> {{ currentReq()?.instructorName }}</div>
                 <div class="detail-row"><span class="fw-500">Autoriza (Líder):</span> {{ currentReq()?.liderName }}</div>
                 <div class="detail-row"><span class="fw-500">Tipo:</span> {{ currentReq()?.tipo_solicitud }}</div>
                 <div class="detail-row"><span class="fw-500">Fecha:</span> {{ currentReq()?.fechaFormateada }}</div>
               </div>

               <!-- Comparativa Visual (Antes vs Después) -->
               @if (currentReq()?.detalles_propuestos && ['Cambio de horario', 'Cambio de ambiente', 'Cambio de instructor', 'Edición de horario'].includes(currentReq()?.tipo_solicitud)) {
                 <div class="diff-container mt-3">
                    <h4 class="diff-title">Comparativa de Cambios</h4>
                    <div class="diff-cards">
                       <!-- Tarjeta Roja: Estado Actual -->
                       <div class="diff-card old-card">
                          <div class="card-header">Estado Actual</div>
                          <div class="card-body">
                             <div class="diff-item"><lucide-icon name="calendar" [size]="14"></lucide-icon> {{ currentReq()?.detalles_propuestos?.dia_actual }}</div>
                             <div class="diff-item"><lucide-icon name="clock" [size]="14"></lucide-icon> {{ currentReq()?.detalles_propuestos?.hora_inicio_actual | slice:0:5 }} - {{ currentReq()?.detalles_propuestos?.hora_fin_actual | slice:0:5 }}</div>
                             <div class="diff-item"><lucide-icon name="map-pin" [size]="14"></lucide-icon> {{ currentReq()?.detalles_propuestos?.ambiente_actual || 'Sin ambiente' }}</div>
                             <div class="diff-item"><lucide-icon name="user" [size]="14"></lucide-icon> {{ currentReq()?.instructorName }}</div>
                          </div>
                       </div>
                       
                       <!-- Tarjeta Verde: Propuesta -->
                       <div class="diff-card new-card">
                          <div class="card-header">Propuesta</div>
                          <div class="card-body">
                             <div class="diff-item" [class.highlight]="hasChanged(currentReq()?.detalles_propuestos?.dia_actual, currentReq()?.detalles_propuestos?.dia_propuesto)">
                                <lucide-icon name="calendar" [size]="14"></lucide-icon> 
                                {{ currentReq()?.detalles_propuestos?.dia_propuesto || currentReq()?.detalles_propuestos?.dia_actual }}
                             </div>
                             
                             <div class="diff-item" [class.highlight]="hasChanged(currentReq()?.detalles_propuestos?.hora_inicio_actual, currentReq()?.detalles_propuestos?.hora_inicio_propuesta) || hasChanged(currentReq()?.detalles_propuestos?.hora_fin_actual, currentReq()?.detalles_propuestos?.hora_fin_propuesta)">
                                <lucide-icon name="clock" [size]="14"></lucide-icon> 
                                {{ currentReq()?.detalles_propuestos?.hora_inicio_propuesta ? currentReq()?.detalles_propuestos?.hora_inicio_propuesta : currentReq()?.detalles_propuestos?.hora_inicio_actual }} - 
                                {{ currentReq()?.detalles_propuestos?.hora_fin_propuesta ? currentReq()?.detalles_propuestos?.hora_fin_propuesta : currentReq()?.detalles_propuestos?.hora_fin_actual }}
                             </div>
                             
                             <div class="diff-item" [class.highlight]="hasChanged(currentReq()?.detalles_propuestos?.ambiente_actual, currentReq()?.detalles_propuestos?.ambiente_propuesto) || hasChanged(currentReq()?.detalles_propuestos?.ambiente_actual, currentReq()?.detalles_propuestos?.ambiente_propuesto_id)">
                                <lucide-icon name="map-pin" [size]="14"></lucide-icon> 
                                {{ currentReq()?.detalles_propuestos?.ambiente_propuesto || currentReq()?.detalles_propuestos?.ambiente_propuesto_id || currentReq()?.detalles_propuestos?.ambiente_actual || 'Sin ambiente' }}
                             </div>

                             <div class="diff-item" [class.highlight]="currentReq()?.detalles_propuestos?.instructor_propuesto_id">
                                <lucide-icon name="user" [size]="14"></lucide-icon> 
                                {{ currentReq()?.detalles_propuestos?.instructor_propuesto_id ? 'Nuevo Instructor (Ver ID)' : currentReq()?.instructorName }}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               }
               
               @if (currentReq()?.tipo_solicitud === 'Permiso o ausencia') {
                 <div class="diff-container mt-3">
                    <h4 class="diff-title">Fechas Solicitadas</h4>
                    <div class="diff-cards">
                       <div class="diff-card info-card">
                          <div class="card-body">
                             <div class="diff-item"><lucide-icon name="calendar" [size]="14"></lucide-icon> Desde: <strong>{{ currentReq()?.detalles_propuestos?.fecha_inicio }}</strong></div>
                             <div class="diff-item"><lucide-icon name="calendar" [size]="14"></lucide-icon> Hasta: <strong>{{ currentReq()?.detalles_propuestos?.fecha_fin }}</strong></div>
                          </div>
                       </div>
                    </div>
                 </div>
               }

               <div class="justification-box mt-3">
                 <strong>Justificación del Líder:</strong><br/>
                 {{ currentReq()?.descripcion }}
               </div>

               <div class="input-group mt-3" *ngIf="currentReq()?.estado === 'enviado_admin'">
                 <label>Observaciones <span class="text-danger">*Obligatorio si se rechaza</span></label>
                 <textarea [(ngModel)]="observaciones" class="form-control" rows="3" placeholder="Añada comentarios explicativos sobre su decisión..."></textarea>
               </div>
             </div>

             <div class="modal-footer" *ngIf="currentReq()?.estado === 'enviado_admin'">
               <button class="btn-outline-danger" [disabled]="isSubmitting() || observaciones.trim() === ''" (click)="resolver(false)" title="Debe escribir observaciones para rechazar">
                 <lucide-icon name="x-circle" [size]="16"></lucide-icon> Rechazar
               </button>
               <button class="btn-success" [disabled]="isSubmitting()" (click)="resolver(true)">
                 <lucide-icon name="check-circle" [size]="16"></lucide-icon> Aprobar
               </button>
             </div>
             
             <div class="modal-footer" *ngIf="currentReq()?.estado !== 'enviado_admin'">
               <button class="btn-primary" (click)="showProcessModal.set(false)">Cerrar</button>
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
    .hint-text { font-size: 13px; color: var(--color-text-muted); margin-top: 12px; text-align: right; }
    
    .tabs-container { display: flex; gap: 8px; border-bottom: 1px solid var(--color-border); padding-bottom: 0; }
    .tabs-container button { background: transparent; border: none; padding: 10px 16px; font-weight: 500; color: var(--color-text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tabs-container button:hover { color: #2E7D52; }
    .tabs-container button.active { color: #2E7D52; border-bottom-color: #2E7D52; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: var(--color-white); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 600px; display: flex; flex-direction: column; overflow: hidden; max-height: 90vh; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 18px; }
    .close-btn { background: transparent; border: none; cursor: pointer; color: var(--color-text-muted); }
    
    .modal-body.custom-scroll { padding: 24px; display: flex; flex-direction: column; overflow-y: auto; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 12px; background: var(--color-bg); }
    
    .request-summary { font-size: 14px; color: var(--color-text); line-height: 1.6; background: #F9FAFB; padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--color-border); }
    .justification-box { font-size: 14px; color: var(--color-text-muted); border-left: 4px solid var(--color-primary); padding-left: 16px; margin: 4px 0; background: #F0FDF4; padding-top: 12px; padding-bottom: 12px; border-radius: 0 8px 8px 0; }
    
    /* Diff View Styles */
    .diff-title { font-size: 15px; margin: 0 0 12px 0; color: #111827; }
    .diff-cards { display: flex; gap: 16px; }
    .diff-card { flex: 1; border-radius: 8px; border: 1px solid var(--color-border); overflow: hidden; }
    .card-header { padding: 10px 16px; font-weight: 600; font-size: 13px; text-align: center; }
    .card-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; background: white; }
    
    .old-card .card-header { background: #FEF2F2; color: #B91C1C; border-bottom: 1px solid #FECACA; }
    .new-card .card-header { background: #F0FDF4; color: #15803D; border-bottom: 1px solid #BBF7D0; }
    .info-card { border-color: #BAE6FD; }
    .info-card .card-body { background: #F0F9FF; }

    .diff-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4B5563; }
    .diff-item.highlight { color: #15803D; font-weight: 600; background: #DCFCE7; padding: 4px 8px; border-radius: 4px; margin: -4px -8px; }
    
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label { font-size: 13px; font-weight: 500; color: var(--color-text); }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 14px; outline: none; transition: border 0.2s; background: var(--color-white); font-family: inherit;}
    .form-control:focus { border-color: var(--color-primary); }

    .btn-primary { display: flex; align-items: center; gap: 8px; background: #2E7D52; color: white; border: none; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; }
    .btn-primary:hover { background: #23603F; }

    .btn-success { background: #2E7D52; color: white; border: none; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; }
    .btn-success:hover:not(:disabled) { background: #23603F; }
    .btn-success:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-outline-danger { background: white; color: #EF4444; border: 1px solid #EF4444; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; }
    .btn-outline-danger:hover:not(:disabled) { background: #FEF2F2; }
    .btn-outline-danger:disabled { opacity: 0.6; cursor: not-allowed; }

    .text-danger { color: #EF4444; font-size: 12px; font-weight: 400; }
    .fw-500 { font-weight: 500; }
    .mt-3 { margin-top: 16px; }

    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
  `]
})
export class AdminSolicitudesComponent implements OnInit {
  private http = inject(HttpClient);
  
  solicitudes = signal<any[]>([]);
  currentTab = signal('Todas');

  tableCols = signal<TableColumn[]>([
    { field: 'instructorName', header: 'Solicita' },
    { field: 'liderName', header: 'Envió (Líder)' },
    { field: 'tipo_solicitud', header: 'Tipo' },
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'estadoFormateado', header: 'Estado', isBadge: true },
    { field: 'acciones', header: 'Revisar', isAction: true },
  ]);

  showProcessModal = signal(false);
  isSubmitting = signal(false);
  currentReq = signal<any>(null);
  observaciones = '';

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.http.get<any[]>('http://localhost:3000/api/erp/v1/solicitudes').subscribe(data => {
      this.solicitudes.set(data);
    });
  }

  filteredRequests = computed(() => {
    let all = this.solicitudes().map((s: any) => {
       let stateText = s.estado;
       if (s.estado === 'enviado_admin') stateText = 'Enviado';
       if (s.estado === 'aprobado') stateText = 'Aprobado';
       if (s.estado === 'rechazado') stateText = 'Rechazado';

       return {
         ...s,
         instructorName: s.instructor?.nombre ? (s.instructor.nombre + ' ' + (s.instructor.apellido || '')) : 'Desconocido',
         liderName: s.lider_area?.nombre ? (s.lider_area.nombre + ' ' + (s.lider_area.apellido || '')) : 'Desconocido',
         estadoFormateado: stateText,
         fechaFormateada: new Date(s.fecha_solicitud).toLocaleDateString()
       };
    });

    const tab = this.currentTab();
    if (tab === 'Todas') return all;
    if (tab === 'Pendientes') return all.filter(a => a.estadoFormateado === 'Enviado');
    if (tab === 'Aprobadas') return all.filter(a => a.estadoFormateado === 'Aprobado');
    if (tab === 'Rechazadas') return all.filter(a => a.estadoFormateado === 'Rechazado');
    return all;
  });

  openProcessModal(row: any) {
    this.currentReq.set(row);
    this.observaciones = '';
    this.showProcessModal.set(true);
  }

  hasChanged(oldVal: any, newVal: any): boolean {
    return newVal !== undefined && newVal !== null && newVal !== '' && newVal !== oldVal;
  }

  resolver(aprobado: boolean) {
    const r = this.currentReq();
    if (!r) return;
    if (!aprobado && this.observaciones.trim() === '') {
       alert("Debe agregar observaciones obligatoriamente para rechazar la solicitud.");
       return;
    }

    this.isSubmitting.set(true);
    this.http.patch(`http://localhost:3000/api/erp/v1/solicitudes/${r.id}/responder`, {
       aprobado,
       observaciones: this.observaciones
    }).subscribe({
      next: () => {
         this.isSubmitting.set(false);
         this.showProcessModal.set(false);
         this.fetchData();
      },
      error: (e) => {
         this.isSubmitting.set(false);
         alert(e.error?.message || "Ocurrió un error al procesar la solicitud.");
      }
    });
  }
}

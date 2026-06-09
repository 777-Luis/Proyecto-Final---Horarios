import { Component, OnInit, inject, signal, output, ChangeDetectionStrategy, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, XCircle, User, MapPin, Calendar, CheckCircle } from 'lucide-angular';
import { InstructorService } from '../../../core/services/instructor.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-solicitud-visual',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="visual-container">
      <div class="visual-header">
        <div>
          <h2 class="page-title">Nueva Solicitud Visual</h2>
          <p class="page-subtitle">Selecciona un instructor y haz clic sobre el bloque que deseas cambiar.</p>
        </div>
        <div class="header-actions">
           <button class="btn-cancel" (click)="onCancel.emit()">Cancelar</button>
           <button class="btn-primary" [disabled]="!canSubmit()" (click)="submitPropuesta()">Enviar Propuesta</button>
        </div>
      </div>

      <div class="toolbar">
         <div class="input-group" style="width: 300px;">
           <label>Seleccionar Instructor</label>
           <select [(ngModel)]="selectedInstructorId" (change)="loadSchedule()" class="form-select">
             <option value="">Seleccione...</option>
             @for (inst of srv.instructoresArea(); track inst.id) {
               <option [value]="inst.persona_id">{{ inst.nombre }} {{ inst.apellido || '' }}</option>
             }
           </select>
         </div>
         
         <div *ngIf="interactionMode() !== 'IDLE'" class="mode-badge">
            <span class="pulse-dot"></span> Modo: {{ interactionMode() }} - {{ interactionInstruction() }}
            <button class="btn-sm" (click)="resetInteraction()">Cancelar Acción</button>
         </div>
      </div>

      <div class="calendar-wrapper" *ngIf="selectedInstructorId()">
         @if (isLoading()) {
            <div class="loading-state">Cargando horario...</div>
         } @else if (schedule().length === 0) {
            <div class="loading-state">No hay clases asignadas.</div>
         } @else {
            <div class="table-responsive">
               <table>
                 <thead>
                   <tr>
                     @for (day of days; track day) {
                      <th [style.background]="'#1B5C3A'" style="color: white; text-align: center; width: 16.66%;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2; gap: 2px;">
                          <span>{{ day }}</span>
                          <span style="font-weight: 400; opacity: 0.9; font-size: 11px; text-transform: none;">{{ getFormattedDateForDay(day) }}</span>
                        </div>
                      </th>
                     }
                   </tr>
                 </thead>
                 <tbody>
                   <tr>
                     @for (day of days; track day) {
                       <td class="col-day">
                         <!-- BLOQUES DE CLASE -->
                         <div class="events-container">
                           @for (evt of getEventsForDay(day); track evt.id) {
                              <div class="schedule-card custom-tooltip-container" 
                                   [class.selected]="selectedBlock()?.id === evt.id"
                                   [class.dimmed]="interactionMode() !== 'IDLE' && selectedBlock()?.id !== evt.id"
                                   (click)="onBlockClick(evt, day)">
                                <div class="sch-time">{{ evt.hora_inicio?.substring(0,5) }} — {{ evt.hora_fin?.substring(0,5) }}</div>
                                <div class="sch-jornada">{{ evt.horario?.jornada }}</div>
                                <div class="sch-amb"><lucide-icon name="map-pin" [size]="12"></lucide-icon> {{ evt.horario?.ambiente?.nombre || 'Sin ambiente' }}</div>
                                
                                @if (evt.competencia) {
                                  <div class="custom-tooltip">
                                    <div class="tt-header">
                                      Información Académica
                                    </div>
                                    <div class="tt-body">
                                      <div><strong>Competencia:</strong><br/>{{ evt.competencia }}</div>
                                      <div style="margin-top: 4px;"><strong>Resultado:</strong><br/>{{ evt.resultado }}</div>
                                      <div style="margin-top: 4px; color: #EAB308;">
                                        <strong>Fecha inicio:</strong> {{ evt.fecha_inicio_competencia }} <br/>
                                        <strong>Fecha fin:</strong> {{ evt.fecha_fin_competencia }}
                                      </div>
                                    </div>
                                  </div>
                                }

                                @if (selectedBlock()?.id === evt.id && interactionMode() === 'IDLE') {
                                   <div class="action-menu">
                                      <button (click)="$event.stopPropagation(); setMode('EDITAR_HORARIO')">Editar Horario</button>
                                   </div>
                                }

                                @if (selectedBlock()?.id === evt.id && interactionMode() === 'EDITAR_HORARIO') {
                                   <div class="inline-form" (click)="$event.stopPropagation()">
                                      <label>Día</label>
                                      <select class="form-select mb-2 btn-sm" [(ngModel)]="propuesta.nuevo_dia">
                                         @for (d of days; track d) {
                                            <option [value]="d">{{ d }}</option>
                                         }
                                      </select>
                                      
                                      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                                         <div style="flex: 1;">
                                            <label>Inicio</label>
                                            <input type="time" class="form-control btn-sm" [(ngModel)]="propuesta.nueva_hora_inicio">
                                         </div>
                                         <div style="flex: 1;">
                                            <label>Fin</label>
                                            <input type="time" class="form-control btn-sm" [(ngModel)]="propuesta.nueva_hora_fin">
                                         </div>
                                      </div>

                                      <label>Ambiente</label>
                                      <input type="text" class="form-control mb-2 btn-sm" [(ngModel)]="propuesta.nuevo_ambiente" placeholder="Ej. Y15">
                                      
                                      <label>Instructor Alterno (Opcional)</label>
                                      <select class="form-select mb-3 btn-sm" [(ngModel)]="propuesta.nuevo_instructor">
                                         <option value="">Mantener mismo instructor</option>
                                         @for (inst of srv.instructoresArea(); track inst.id) {
                                            <option [value]="inst.persona_id" *ngIf="inst.persona_id !== selectedInstructorId()">{{ inst.nombre }}</option>
                                         }
                                      </select>
                                      
                                      <button class="btn-success btn-sm w-100" (click)="confirmarPropuestaLocal()">Confirmar Edición</button>
                                   </div>
                                }
                              </div>
                           }
                         </div>
                       </td>
                     }
                   </tr>
                 </tbody>
               </table>
            </div>
         }
      </div>

      <!-- Resumen de Propuesta (Bottom Bar) -->
      @if (propuesta.tipo) {
         <div class="proposal-summary animate-slide-up">
            <div class="summary-content">
               <div class="badge">{{ propuesta.tipo }}</div>
               <div>
                  <strong>Motivo / Justificación:</strong>
                  <input type="text" class="form-control" style="width: 300px; display: inline-block; margin-left: 10px;" [(ngModel)]="descripcionJustificacion" placeholder="Ej. El ambiente no cuenta con PC...">
               </div>
            </div>
         </div>
      }
    </div>
  `,
  styles: [`
    .visual-container { display: flex; flex-direction: column; gap: 20px; height: 100%; min-height: 80vh; background: #FAFAFA; border-radius: 12px; }
    .visual-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; background: white; border-bottom: 1px solid #E5E7EB; border-radius: 12px 12px 0 0; }
    .page-title { font-size: 22px; color: var(--color-text); font-weight: 600; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .header-actions { display: flex; gap: 12px; }
    .toolbar { padding: 0 20px; display: flex; align-items: flex-end; gap: 20px; }
    
    .btn-cancel { background: #F3F4F6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: #2E7D52; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-success { background: #2E7D52; color: white; border: none; cursor: pointer; border-radius: 4px; }
    .btn-sm { padding: 6px 10px; font-size: 12px; border-radius: 4px; }
    .w-100 { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
    .mt-2 { margin-top: 8px; }
    
    .input-group label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; }
    .form-control, .form-select { width: 100%; padding: 10px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; outline: none; background: white; }
    
    .mode-badge { display: flex; align-items: center; gap: 12px; background: #FFFBEB; border: 1px solid #FDE68A; padding: 8px 16px; border-radius: 8px; color: #92400E; font-weight: 600; font-size: 14px; }
    .pulse-dot { width: 10px; height: 10px; background: #F59E0B; border-radius: 50%; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }

    .calendar-wrapper { background: white; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; margin: 0 20px 20px; flex: 1; }
    .table-responsive { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    thead th { padding: 12px 16px; font-size: 14px; font-weight: 600; border: 1px solid #E5E7EB; }
    tbody tr { background: #FAFAFA; }
    td { border: 1px solid #E5E7EB; vertical-align: top; padding: 0; min-width: 200px; height: 400px; position: relative; }
    .col-day { background: #FAFAFA; }
    
    .events-container { display: flex; flex-direction: column; gap: 8px; padding: 12px; position: relative; z-index: 2; }
    .schedule-card { background: white; border: 1px solid #E5E7EB; border-left: 4px solid #2E7D52; padding: 12px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s; cursor: pointer; position: relative; }
    .schedule-card:hover { border-color: #2E7D52; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .schedule-card.selected { border-color: #F59E0B; border-left-color: #F59E0B; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2); z-index: 10; }
    .schedule-card.dimmed { opacity: 0.4; filter: grayscale(1); pointer-events: none; }
    .schedule-card.ghost-card { background: #F0FDF4; border: 2px dashed #22C55E; border-left: 4px solid #22C55E; opacity: 1; filter: none; }
    
    .sch-time { font-weight: 700; font-size: 13px; color: #111; }
    .sch-jornada { font-size: 11px; color: #6B7280; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
    .sch-amb { font-size: 12px; color: #4B5563; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
    
    .action-menu { position: absolute; top: 100%; left: 0; width: 100%; background: white; border: 1px solid #E5E7EB; border-radius: 6px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; z-index: 20; margin-top: 4px; }
    .action-menu button { background: none; border: none; padding: 10px; text-align: left; font-size: 13px; font-weight: 500; color: #374151; cursor: pointer; border-bottom: 1px solid #F3F4F6; }
    .action-menu button:hover { background: #F3F4F6; color: #111; }
    
    .inline-form { background: #F9FAFB; padding: 12px; border-radius: 6px; margin-top: 12px; border: 1px dashed #D1D5DB; }
    .inline-form label { font-size: 12px; font-weight: 600; color: #4B5563; display: block; margin-bottom: 4px; }
    
    .free-slots-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; padding: 12px; display: flex; flex-direction: column; gap: 8px; z-index: 1; pointer-events: auto; }
    .free-slot { background: rgba(34, 197, 94, 0.05); border: 2px dashed #86EFAC; color: #166534; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; height: 60px; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
    .free-slot:hover { background: rgba(34, 197, 94, 0.15); border-color: #22C55E; }

    .proposal-summary { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border: 1px solid #E5E7EB; padding: 16px 24px; z-index: 100; display: flex; align-items: center; gap: 16px; width: 600px; max-width: 90%; }
    .summary-content { display: flex; align-items: center; gap: 16px; width: 100%; }
    .badge { background: #FEF08A; color: #854D0E; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 20px; }
    .sch-badge.success { background: #DCFCE7; color: #166534; font-size: 11px; padding: 4px; border-radius: 4px; font-weight: 600; text-align: center; display: inline-block; }
    
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }

    /* CUSTOM TOOLTIP */
    .custom-tooltip-container { position: relative; }
    .custom-tooltip {
      visibility: hidden;
      opacity: 0;
      position: absolute;
      top: 0;
      left: calc(100% + 12px);
      z-index: 9999;
      background: #111827;
      color: #F9FAFB;
      width: 250px;
      padding: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
      transform: translateX(10px);
      pointer-events: none;
    }
    .custom-tooltip-container:hover .custom-tooltip {
      visibility: visible;
      opacity: 1;
      transform: translateX(0);
    }
    .custom-tooltip::before {
      content: '';
      position: absolute;
      top: 18px;
      left: -7px;
      border-width: 7px 7px 7px 0;
      border-style: solid;
      border-color: transparent #111827 transparent transparent;
      filter: drop-shadow(-1px 0px 1px rgba(0,0,0,0.1));
    }
    .custom-tooltip .tt-header {
      font-weight: 700;
      font-size: 14px;
      border-bottom: 1px solid #374151;
      padding-bottom: 8px;
      margin-bottom: 10px;
      color: #E5E7EB;
    }
    .custom-tooltip .tt-body {
      font-size: 12px;
      line-height: 1.5;
    }
    .custom-tooltip .tt-body strong {
      color: #9CA3AF;
      font-weight: 600;
    }
  `]
})
export class SolicitudVisualComponent {
  srv = inject(InstructorService);
  cdr = inject(ChangeDetectorRef);

  onCancel = output<void>();
  onSuccess = output<void>();

  selectedInstructorId = signal('');
  schedule = signal<any[]>([]);
  isLoading = signal(false);

  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Estados de Interacción: IDLE -> EDITAR_HORARIO -> LISTO
  interactionMode = signal<'IDLE' | 'EDITAR_HORARIO' | 'LISTO'>('IDLE');
  selectedBlock = signal<any>(null);

  propuesta: any = {};
  descripcionJustificacion = '';

  interactionInstruction = computed(() => {
    switch (this.interactionMode()) {
       case 'EDITAR_HORARIO': return 'Edita la información del bloque y confirma los cambios.';
       case 'LISTO': return 'Agrega una justificación abajo y envía la propuesta.';
       default: return '';
    }
  });

  loadSchedule() {
    this.resetInteraction();
    if (!this.selectedInstructorId()) {
      this.schedule.set([]);
      return;
    }
    this.isLoading.set(true);
    this.srv.fetchInstructorSchedule(this.selectedInstructorId()).subscribe({
      next: (data) => {
        this.schedule.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.schedule.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getDatesOfWeek(): string[] {
    const todayStr = new Date().toISOString().substring(0, 10);
    const d = new Date(todayStr + 'T00:00:00');
    const day = d.getDay() || 7; 
    const result: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const copy = new Date(d);
      copy.setDate(d.getDate() - day + i);
      result.push(copy.toISOString().substring(0, 10));
    }
    return result;
  }

  getFormattedDateForDay(day: string): string {
    const dates = this.getDatesOfWeek();
    const idx = this.days.indexOf(day);
    if (idx < 0) return '';
    const parts = dates[idx].split('-');
    return `${parts[2]}/${parts[1]}`;
  }

  getEventsForDay(dayName: string): any[] {
    const dayMap: { [key: string]: number } = {
      'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0
    };
    const dayNumber = dayMap[dayName];
    return this.schedule().filter(d => d.dia === dayNumber || String(d.dia) === dayName).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }

  onBlockClick(evt: any, dayName: string) {
    if (this.interactionMode() !== 'IDLE') return; // Bloquear si ya estamos en un modo
    this.selectedBlock.set(evt);
    this.propuesta = {
       bloque_original: evt,
       dia_original: dayName,
       nueva_hora_inicio: evt.hora_inicio,
       nueva_hora_fin: evt.hora_fin,
       nuevo_ambiente: evt.horario?.ambiente?.nombre || '',
       nuevo_instructor: '',
       nuevo_dia: dayName
    };
  }

  setMode(mode: 'EDITAR_HORARIO') {
    this.interactionMode.set(mode);
    this.propuesta.tipo = 'Edición de horario';
  }

  resetInteraction() {
    this.interactionMode.set('IDLE');
    this.selectedBlock.set(null);
    this.propuesta = {};
    this.descripcionJustificacion = '';
  }

  confirmarPropuestaLocal() {
     this.interactionMode.set('LISTO');
  }

  canSubmit(): boolean {
     return this.interactionMode() === 'LISTO' && this.descripcionJustificacion.trim().length > 0;
  }

  submitPropuesta() {
    if (!this.canSubmit()) return;
    
    const block = this.propuesta.bloque_original;
    const payload = {
      instructor_id: this.selectedInstructorId(),
      tipo_solicitud: this.propuesta.tipo,
      descripcion: this.descripcionJustificacion,
      detalles_propuestos: {
          horario_detalle_id: block.id,
          horario_id: block.horario?.id,
          instructor_actual_id: this.selectedInstructorId(),
          hora_inicio_actual: block.hora_inicio,
          hora_fin_actual: block.hora_fin,
          ambiente_actual: block.horario?.ambiente?.nombre,
          dia_actual: this.propuesta.dia_original,
          
          dia_propuesto: this.propuesta.nuevo_dia || null,
          hora_inicio_propuesta: this.propuesta.nueva_hora_inicio || null,
          hora_fin_propuesta: this.propuesta.nueva_hora_fin || null,
          ambiente_propuesto: this.propuesta.nuevo_ambiente || null,
          instructor_propuesto_id: this.propuesta.nuevo_instructor || null
      }
    };

    this.srv.createSolicitudLider(payload).subscribe({
      next: () => {
         this.onSuccess.emit();
      },
      error: () => {
         alert("Error al enviar la solicitud.");
      }
    });
  }
}

import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, DownloadCloud, Play, User, Clock, AlertCircle } from 'lucide-angular';
import { InstructorService } from '../../../core/services/instructor.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-instructor-horario',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="page-container">
       <div class="page-header">
         <div>
           <h1 class="page-title">Mi Horario</h1>
           <p class="page-subtitle">Sistema de activación y seguimiento de clases</p>
         </div>
         <div class="header-actions">
            <button class="btn-primary-outline" (click)="srv.downloadPdf()">
              <lucide-icon name="download-cloud" [size]="16"></lucide-icon> Guardar PDF
            </button>
         </div>
       </div>

       <!-- SUCCESS TOAST -->
       @if (toastMessage()) {
         <div class="toast">
           {{ toastMessage() }}
         </div>
       }

       <div class="table-card">
         <div class="table-responsive">
           <table>
             <thead>
               <tr>
                 @for (day of days; track day; let i = $index) {
                    <th [style.background]="day === currentDayName() ? '#2E7D52' : '#1B5C3A'" style="color: white; text-align: center; width: 16.66%;">
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
                   <td class="col-day" [class.is-today]="day === currentDayName()">
                     @if (getEventsForDay(day).length > 0) {
                       <div class="events-container">
                         @for (evt of getEventsForDay(day); track evt.id) {
                            <div class="schedule-card custom-tooltip-container" style="cursor: pointer;" (click)="openEditModal(evt)">
                             <div class="sch-time">{{ evt.hora_inicio?.substring(0,5) }} — {{ evt.hora_fin?.substring(0,5) }}</div>
                             <div class="sch-jornada">{{ evt.horario?.jornada }}</div>
                             <div class="sch-ficha">Ficha {{ evt.horario?.curso?.id_curso }}</div>
                             <div class="sch-prog">{{ evt.horario?.curso?.programa?.nombre || 'Sin programa' }}</div>
                             <div class="sch-amb">{{ evt.horario?.ambiente?.nombre || 'Sin ambiente' }}</div>
                             
                             <!-- Badge Estado -->
                              @if (getBadge(evt, day); as badge) {
                                <div class="sch-badge" [ngClass]="badge.type.toLowerCase()">
                                  {{ badge.text }}
                                </div>

                                @if (badge.type === 'Activa' || badge.type === 'Retraso') {
                                  <div class="progress-container">
                                    <div class="progress-bar" [style.width.%]="getClassProgress(evt, day)"></div>
                                  </div>
                                }
                                
                                <!-- Botones de Acción (Solo para el día de hoy) -->
                               @if (day === currentDayName() && canShowButton(evt, badge.type)) {
                                 <div class="action-buttons-group">
                                   @if (badge.type === 'Pendiente') {
                                     <button 
                                       class="btn-activar" 
                                       [class.disabled]="isButtonDisabled(evt)"
                                       [disabled]="isButtonDisabled(evt) || isActivating()"
                                       (click)="$event.stopPropagation(); activarClase(evt)">
                                       @if (isButtonDisabled(evt)) {
                                         Disponible a las {{ evt.hora_inicio?.substring(0,5) }}
                                       } @else {
                                         <lucide-icon name="play" [size]="14"></lucide-icon> Activar
                                       }
                                     </button>
                                   }
                                   
                                   @if (badge.type === 'Activa' || badge.type === 'Retraso') {
                                     <button class="btn-suspend" (click)="$event.stopPropagation(); openSuspendModal(badge.registroId)">Suspender</button>
                                     <button class="btn-activar" style="background:#1E40AF" (click)="$event.stopPropagation(); finalizarClase(badge.registroId)">Finalizar</button>
                                   }

                                   @if (badge.type === 'Suspendida') {
                                     <button class="btn-activar" style="background:#2E7D52" (click)="$event.stopPropagation(); reanudarClase(badge.registroId)">Reanudar</button>
                                     <button class="btn-activar" style="background:#1E40AF" (click)="$event.stopPropagation(); finalizarClase(badge.registroId)">Finalizar</button>
                                   }
                                 </div>
                               }
                             }
                             
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
                           </div>
                         }
                       </div>
                     } @else {
                       <div class="empty-cell">Sin asignaciones</div>
                     }
                   </td>
                 }
               </tr>
             </tbody>
           </table>
         </div>
       </div>
       
       <!-- SUSPEND MODAL -->
       @if (showSuspendModal()) {
         <div class="modal-overlay" (click)="closeSuspendModal()">
           <div class="modal-container" (click)="$event.stopPropagation()">
             <div class="modal-header">
               <h2 class="modal-title">Suspender Clase</h2>
             </div>
             <div class="modal-body">
               <p style="font-size: 13px; color: #4B5563; margin-top: 0;">Por favor, justifica el motivo de la suspensión. Esta información será enviada inmediatamente a administración para su validación.</p>
               <textarea class="field-input" rows="4" [(ngModel)]="suspendReason" placeholder="Ej. Traslado urgente de sede, calamidad..."></textarea>
             </div>
             <div class="modal-footer">
               <button class="btn-cancel" (click)="closeSuspendModal()">Cancelar</button>
               <button class="btn-save" style="background: #EAB308; color: #713F12;" [disabled]="!suspendReason().trim()" (click)="confirmSuspend()">Confirmar Suspensión</button>
             </div>
           </div>
         </div>
       }

       <!-- EDIT COMPETENCIA MODAL -->
       @if (showEditModal()) {
         <div class="modal-overlay" (click)="closeEditModal()">
           <div class="modal-container" style="max-width: 500px;" (click)="$event.stopPropagation()">
             <div class="modal-header">
               <h2 class="modal-title">Asignar Competencia</h2>
             </div>
             <div class="modal-body">
               <p style="font-size: 13px; color: #4B5563; margin-top: 0;">Ingresa la información académica que dictarás en esta franja.</p>
               
               <div style="display: flex; flex-direction: column; gap: 4px;">
                 <label style="font-size: 12px; font-weight: 600;">Competencia</label>
                 <textarea class="field-input" rows="2" [(ngModel)]="editData.competencia" placeholder="Ej. Modelado de los artefactos del software..."></textarea>
               </div>
               
               <div style="display: flex; flex-direction: column; gap: 4px;">
                 <label style="font-size: 12px; font-weight: 600;">Resultado de Aprendizaje</label>
                 <textarea class="field-input" rows="3" [(ngModel)]="editData.resultado" placeholder="Ej. Verificar los entregables..."></textarea>
               </div>

               <div style="display: flex; gap: 12px;">
                 <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                   <label style="font-size: 12px; font-weight: 600;">Fecha de Inicio</label>
                   <input type="date" class="field-input" [(ngModel)]="editData.fecha_inicio_competencia">
                 </div>
                 <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                   <label style="font-size: 12px; font-weight: 600;">Fecha de Fin</label>
                   <input type="date" class="field-input" [(ngModel)]="editData.fecha_fin_competencia">
                 </div>
               </div>

               <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                 <input type="checkbox" id="aplicarTodos" [(ngModel)]="editData.aplicar_todos" style="width: 16px; height: 16px; accent-color: #2E7D52;">
                 <label for="aplicarTodos" style="font-size: 13px; font-weight: 500; color: #111; cursor: pointer;">Aplicar a todos mis bloques de esta Ficha</label>
               </div>
             </div>
             <div class="modal-footer">
               <button class="btn-cancel" (click)="closeEditModal()">Cancelar</button>
               <button class="btn-save" style="background: #2E7D52; color: white;" [disabled]="savingCompetencia()" (click)="saveCompetencia()">
                 {{ savingCompetencia() ? 'Guardando...' : 'Guardar Información' }}
               </button>
             </div>
           </div>
         </div>
       }
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; position: relative; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 22px; color: var(--color-text); font-weight: 600; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .btn-primary-outline { background: #fff; color: #2E7D52; border: 1px solid #2E7D52; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; font-size: 14px; }
    .btn-primary-outline:hover { background: #F0FDF4; }

    .table-card { background: var(--color-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); overflow: hidden; }
    .table-responsive { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    thead th { padding: 12px 16px; font-size: 14px; font-weight: 600; border: 1px solid var(--color-border); }
    tbody tr { background: #fff; }
    td { border: 1px solid var(--color-border); vertical-align: top; padding: 0; min-width: 200px; }
    .col-day.is-today { background: #F8FAFC; }
    
    .events-container { display: flex; flex-direction: column; gap: 12px; padding: 12px; }
    .empty-cell { padding: 40px 12px; text-align: center; color: #9CA3AF; font-size: 13px; font-weight: 500; }

    .schedule-card { background: white; border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 4px; }
    .sch-time { font-weight: 700; font-size: 13px; color: #111; }
    .sch-jornada { font-size: 11px; color: #6B7280; font-weight: bold; text-transform: uppercase; }
    .sch-ficha { font-size: 12px; font-weight: 600; color: #2E7D52; margin-top: 4px; }
    .sch-prog { font-size: 12px; color: #4B5563; }
    .sch-amb { font-size: 12px; color: #4B5563; }

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
      border-radius: 8px;
      border: 1px solid #374151;
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

    .sch-badge { margin-top: 8px; padding: 6px; border-radius: 4px; font-size: 12px; font-weight: 600; text-align: center; }
    .sch-badge.pendiente { background: #F4F6F8; color: #6B7280; }
    .sch-badge.activa { background: #E8F5EE; color: #1B5C3A; }
    .sch-badge.retraso { background: #FEE2E2; color: #991B1B; }
    .sch-badge.finalizada { background: #EFF6FF; color: #1E40AF; }
    .sch-badge.no-asistio { background: #FEE2E2; color: #991B1B; }
    .sch-badge.suspendida { background: #FEF08A; color: #854D0E; }
    .progress-container { width: 100%; height: 6px; background: #E5E7EB; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-bar { height: 100%; background: #1B5C3A; transition: width 1s linear; }

    .action-buttons-group { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
    .btn-activar { flex: 1; background: #2E7D52; color: white; border: none; padding: 8px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; }
    .btn-activar:hover:not(.disabled):not(:disabled) { opacity: 0.9; }
    .btn-activar.disabled { background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; }
    .btn-activar:disabled { opacity: 0.7; }
    
    .btn-suspend { flex: 1; background: #FEF08A; color: #854D0E; border: none; padding: 8px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .btn-suspend:hover { opacity: 0.8; }

    .toast { position: fixed; bottom: 24px; right: 24px; background: #2E7D52; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeOverlay 0.2s ease; }
    @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
    .modal-container { background: #fff; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18); overflow: hidden; animation: popIn 0.22s ease; }
    @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
    .modal-title { font-size: 18px; font-weight: 600; color: #111; margin: 0; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
    .field-input { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 8px; font-size: 13px; color: var(--color-text); background: #fff; outline: none; width: 100%; box-sizing: border-box; resize: vertical; }
    .field-input:focus { border-color: #EAB308; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 0 24px 20px; }
    .btn-cancel { background: #F3F4F6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-save { border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class MiHorarioComponent implements OnInit, OnDestroy {
  srv = inject(InstructorService);
  auth = inject(AuthService);
  cdr = inject(ChangeDetectorRef);
  
  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  todayDateStr = signal((() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })());
  
  toastMessage = signal('');
  isActivating = signal(false);
  pollingInterval: any;

  ngOnInit() {
    this.srv.fetchPersonalSchedule();
    this.fetchTodayRegistros();

    // Polling every 30s
    this.pollingInterval = setInterval(() => {
      this.fetchTodayRegistros();
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      this.todayDateStr.set(`${yyyy}-${mm}-${dd}`);
      this.cdr.detectChanges();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  fetchTodayRegistros() {
    this.srv.fetchRegistroClases();
  }

  getDatesOfWeek(): string[] {
    const d = new Date(this.todayDateStr() + 'T00:00:00');
    const day = d.getDay() || 7; 
    const result: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const copy = new Date(d);
      copy.setDate(d.getDate() - day + i);
      result.push(copy.toISOString().substring(0, 10));
    }
    return result;
  }

  currentDayName(): string {
    const d = new Date(this.todayDateStr() + 'T00:00:00');
    return this.days[(d.getDay() || 7) - 1] || '';
  }

  getFormattedDateForDay(day: string): string {
    const dates = this.getDatesOfWeek();
    const idx = this.days.indexOf(day);
    if (idx < 0) return '';
    const parts = dates[idx].split('-');
    return `${parts[2]}/${parts[1]}`;
  }

  getEventsForDay(day: string): any[] {
    const dayMap: { [key: string]: number } = {
      'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0
    };
    const dayNumber = dayMap[day];
    const schedule = this.srv.personalSchedule();
    return schedule.filter(d => d.dia === dayNumber || String(d.dia) === day).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }

  getBadge(evt: any, dayName: string) {
    const dates = this.getDatesOfWeek();
    const dayIndex = this.days.indexOf(dayName);
    const eventDate = dates[dayIndex];
    
    const registro = this.srv.registrosClases().find((r: any) => 
      r.horario_detalle?.id === evt.id && r.fecha === eventDate
    );

    const isToday = eventDate === this.todayDateStr();
    const now = new Date();
    const evtTimeStart = new Date(eventDate + 'T' + evt.hora_inicio);
    const evtTimeEnd = new Date(eventDate + 'T' + evt.hora_fin);

    if (!registro) {
      if (now > evtTimeEnd) {
        return { type: 'No-asistio', text: 'No asistió' };
      }
      return { type: 'Pendiente', text: `La clase inicia a las ${evt.hora_inicio.substring(0,5)}` };
    }
    
    if (registro.estado.toLowerCase() === 'finalizada' || (registro.estado.toLowerCase() === 'activa' && now > evtTimeEnd)) return { type: 'Finalizada', text: 'Clase finalizada', registroId: registro.id };
    if (registro.estado.toLowerCase() === 'suspendida') return { type: 'Suspendida', text: 'Clase suspendida', registroId: registro.id };
    if (registro.estado.toLowerCase() === 'activa' && registro.minutos_retraso > 0) return { type: 'Retraso', text: `Retraso: ${registro.minutos_retraso} min`, registroId: registro.id };
    if (registro.estado.toLowerCase() === 'activa') return { type: 'Activa', text: 'Clase en curso', registroId: registro.id };
    return { type: 'Pendiente', text: 'Pendiente' };
  }

  canShowButton(evt: any, badgeType: string): boolean {
    if (badgeType === 'Pendiente' || badgeType === 'Activa' || badgeType === 'Retraso' || badgeType === 'Suspendida') {
      const now = new Date();
      const dates = this.getDatesOfWeek();
      const eventDate = dates[this.days.indexOf(this.currentDayName())];
      const eventEnd = new Date(eventDate + 'T' + evt.hora_fin);
      return now <= eventEnd;
    }
    return false;
  }

  getClassProgress(evt: any, dayName: string): number {
    const dates = this.getDatesOfWeek();
    const dayIndex = this.days.indexOf(dayName);
    if (dayIndex === -1) return 0;
    
    const eventDate = dates[dayIndex];
    const start = new Date(eventDate + 'T' + evt.hora_inicio).getTime();
    const end = new Date(eventDate + 'T' + evt.hora_fin).getTime();
    const now = new Date().getTime();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  isButtonDisabled(evt: any): boolean {
    const now = new Date();
    const evtTimeStart = new Date(this.todayDateStr() + 'T' + evt.hora_inicio);
    return now < evtTimeStart;
  }

  activarClase(evt: any) {
    if (this.isButtonDisabled(evt) || this.isActivating()) return;

    this.isActivating.set(true);
    this.srv.activarClase(evt.id, this.todayDateStr())?.subscribe({
      next: (res) => {
        this.fetchTodayRegistros();
        this.isActivating.set(false);
        if (res.minutos_retraso > 0) {
          this.showToast(`Clase activada con ${res.minutos_retraso} minutos de retraso`);
        } else {
          this.showToast('Clase activada correctamente');
        }
      },
      error: () => {
        this.isActivating.set(false);
        this.showToast('Error al activar la clase');
      }
    });
  }

  finalizarClase(registroId: string) {
    if (confirm('¿Estás seguro de que deseas finalizar esta clase?')) {
      this.srv.finalizarClase(registroId).subscribe({
        next: () => {
          this.fetchTodayRegistros();
          this.showToast('Clase finalizada correctamente');
        },
        error: () => this.showToast('Error al finalizar la clase')
      });
    }
  }

  activeRegistroId = signal<string | null>(null);
  showSuspendModal = signal(false);
  suspendReason = signal('');

  openSuspendModal(registroId: string) {
    this.activeRegistroId.set(registroId);
    this.suspendReason.set('');
    this.showSuspendModal.set(true);
  }

  closeSuspendModal() {
    this.showSuspendModal.set(false);
    this.activeRegistroId.set(null);
  }

  confirmSuspend() {
    const id = this.activeRegistroId();
    const reason = this.suspendReason().trim();
    if (!id || !reason) return;

    this.srv.suspenderClase(id, reason).subscribe({
      next: () => {
        this.fetchTodayRegistros();
        this.closeSuspendModal();
        this.showToast('Clase suspendida. Administración notificada.');
      },
      error: () => this.showToast('Error al suspender la clase')
    });
  }

  reanudarClase(registroId: string) {
    this.srv.reanudarClase(registroId).subscribe({
      next: () => {
        this.fetchTodayRegistros();
        this.showToast('Clase reanudada correctamente');
      },
      error: () => this.showToast('Error al reanudar la clase')
    });
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set('');
      this.cdr.detectChanges();
    }, 4000);
  }

  // Edit Competencia Logic
  showEditModal = signal(false);
  savingCompetencia = signal(false);
  activeEditBlock = signal<any>(null);
  
  editData = {
    competencia: '',
    resultado: '',
    fecha_inicio_competencia: '',
    fecha_fin_competencia: '',
    aplicar_todos: false
  };

  openEditModal(evt: any) {
    this.activeEditBlock.set(evt);
    this.editData = {
      competencia: evt.competencia || '',
      resultado: evt.resultado || '',
      fecha_inicio_competencia: evt.fecha_inicio_competencia || '',
      fecha_fin_competencia: evt.fecha_fin_competencia || '',
      aplicar_todos: false
    };
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.activeEditBlock.set(null);
  }

  saveCompetencia() {
    const evt = this.activeEditBlock();
    if (!evt) return;

    this.savingCompetencia.set(true);
    const payload = {
      competencia: this.editData.competencia,
      resultado: this.editData.resultado,
      fecha_inicio_competencia: this.editData.fecha_inicio_competencia,
      fecha_fin_competencia: this.editData.fecha_fin_competencia,
      aplicar_todos: this.editData.aplicar_todos
    };

    this.srv.updateHorarioDetalle(evt.id, payload).subscribe({
      next: () => {
        this.srv.fetchPersonalSchedule(); // Refresh data
        this.savingCompetencia.set(false);
        this.closeEditModal();
        this.showToast('Información académica guardada correctamente.');
      },
      error: () => {
        this.savingCompetencia.set(false);
        this.showToast('Error al guardar la información.');
      }
    });
  }
}

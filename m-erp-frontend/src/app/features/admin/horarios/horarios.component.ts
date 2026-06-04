import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Clock, DownloadCloud, Plus, Search, X, Pencil, Trash2 } from 'lucide-angular';
import { AdminHorariosService } from '../../../core/services/admin-horarios.service';

@Component({
  selector: 'app-admin-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <!-- Header Area -->
      <div class="page-header">
         <div>
            <h1 class="page-title">Horarios de Instructores</h1>
            <p class="page-subtitle">Vista matricial del estado de clases en tiempo real</p>
         </div>
         <div class="header-actions">
           <button class="btn-success" (click)="openCreateModal()">
             <lucide-icon name="plus" [size]="16"></lucide-icon> Nuevo Horario
           </button>
         </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filter-group" style="flex: 1;">
           <lucide-icon name="search" [size]="16" class="search-icon"></lucide-icon>
           <input type="text" class="form-input with-icon" placeholder="Buscar por instructor, ficha o ambiente..." [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" />
        </div>
        <div class="filter-group">
           <select class="form-select" [(ngModel)]="jornadaFilter" (ngModelChange)="applyFilters()">
              <option value="Todas">Todas las jornadas</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
           </select>
        </div>
        <div class="filter-group">
           <input type="date" class="form-input" [(ngModel)]="selectedDate" (ngModelChange)="onDateChange()" />
        </div>
      </div>

      <!-- Matrix View -->
      <div class="matrix-card">
         @if (srv.isLoadingList() || srv.isLoadingRegistros()) {
            <div class="loading-state">Cargando datos matriciales...</div>
         } @else {
            <div class="table-responsive">
              <table class="matrix-table">
                <thead>
                  <tr>
                    <th class="sticky-col">Instructor</th>
                    @for (day of days; track day) {
                      <th [class.current-day]="isCurrentDay(day)">{{ day }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of filteredMatrix(); track row.instructorId) {
                    <tr>
                      <td class="sticky-col instructor-cell">
                        <div class="instructor-name">{{ row.instructorName }}</div>
                      </td>
                      @for (day of days; track day) {
                        <td [class.empty-cell]="row.days[day].length === 0">
                           <div class="cell-content">
                             @for (clase of row.days[day]; track clase.detalleId) {
                                <div class="class-card group custom-tooltip-container" style="position: relative;">
                                 <!-- Card Actions (Hidden by default, shown on hover via CSS) -->
                                 <div class="card-actions" style="position: absolute; top: 4px; right: 4px; display: none; gap: 4px;">
                                    <button class="action-btn edit-btn" (click)="onEditClass(clase)" title="Editar">
                                      <lucide-icon name="pencil" [size]="14"></lucide-icon>
                                    </button>
                                    <button class="action-btn delete-btn" (click)="onDeleteClass(clase)" title="Borrar">
                                      <lucide-icon name="trash-2" [size]="14"></lucide-icon>
                                    </button>
                                 </div>
                                 <div class="class-time">{{ clase.horaInicio }} - {{ clase.horaFin }}</div>
                                 <div class="class-meta"><strong>Ficha:</strong> {{ clase.ficha }}</div>
                                 <div class="class-meta" style="white-space:normal; font-size:10px;">{{ clase.programa }}</div>
                                 <div class="class-meta"><strong>Ambiente:</strong> {{ clase.ambiente }}</div>
                                 <div class="class-meta"><strong>Jornada:</strong> {{ clase.jornada }}</div>
                                 
                                 <div class="status-badge" [ngClass]="clase.badgeClass">
                                   {{ clase.badgeText }}
                                 </div>
                                 @if (clase.badgeClass === 'badge-activa' || clase.badgeClass === 'badge-retraso') {
                                   <div class="progress-container" style="width: 100%; height: 4px; background: #E5E7EB; border-radius: 2px; overflow: hidden; margin-top: 6px;">
                                     <div class="progress-bar" [style.width.%]="clase.progress" style="height: 100%; background: #1B5C3A; transition: width 1s linear;"></div>
                                   </div>
                                 }

                                 <div class="custom-tooltip">
                                   <div class="tt-header">
                                     {{ row.instructorName }}
                                   </div>
                                   <div class="tt-body">
                                     <div><strong>Ficha:</strong> {{ clase.ficha }}</div>
                                     <div><strong>Día:</strong> {{ day }} ({{ clase.horaInicio }} - {{ clase.horaFin }})</div>
                                     @if (clase.competencia) {
                                       <div style="margin-top: 8px;"><strong>Competencia:</strong><br/>{{ clase.competencia }}</div>
                                       <div style="margin-top: 4px;"><strong>Resultado:</strong><br/>{{ clase.resultado }}</div>
                                       <div style="margin-top: 4px; color: #EAB308;">
                                         <strong>Fecha inicio:</strong> {{ clase.fecha_inicio_competencia }} <br/>
                                         <strong>Fecha fin:</strong> {{ clase.fecha_fin_competencia }}
                                       </div>
                                     }
                                   </div>
                                 </div>
                               </div>
                             }
                           </div>
                        </td>
                      }
                    </tr>
                  }
                  @if (filteredMatrix().length === 0) {
                     <tr>
                        <td colspan="7" style="text-align:center; padding: 40px; color: var(--color-text-muted);">
                           No se encontraron instructores o clases con los filtros actuales.
                        </td>
                     </tr>
                  }
                </tbody>
              </table>
            </div>
         }
      </div>
      <!-- EDIT SCHEDULE MODAL -->
      @if (showEditModal()) {
        <div class="modal-overlay">
          <div class="modal-content animate-slide-up" style="max-width: 500px;">
            <div class="modal-header">
              <h3>Editar Clase</h3>
              <button class="close-btn" (click)="closeEditModal()">
                <lucide-icon name="x" [size]="20"></lucide-icon>
              </button>
            </div>
            <div class="modal-body" style="padding: 20px;">
              <div class="form-group" style="margin-bottom: 15px;">
                <label>Instructor</label>
                <select [(ngModel)]="editPayload.instructor_id" class="form-control" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px;">
                  @for (inst of srv.instructores(); track inst.id) {
                    <option [value]="inst.persona_id || inst.id">{{ inst.nombre }} {{ inst.apellido }}</option>
                  }
                </select>
              </div>
              <div style="display: flex; gap: 10px;">
                <div class="form-group" style="flex: 1;">
                  <label>Hora Inicio</label>
                  <input type="time" [(ngModel)]="editPayload.hora_inicio" class="form-control" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px;">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Hora Fin</label>
                  <input type="time" [(ngModel)]="editPayload.hora_fin" class="form-control" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 4px;">
                </div>
              </div>
            </div>
            <div class="modal-footer" style="padding: 15px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--color-border);">
               <button class="btn-secondary" (click)="closeEditModal()" [disabled]="savingEdit()">Cancelar</button>
               <button class="btn-primary" (click)="saveEditClass()" [disabled]="savingEdit()">
                 @if (savingEdit()) {
                   Guardando...
                 } @else {
                   Guardar Cambios
                 }
               </button>
            </div>
          </div>
        </div>
      }

      <!-- CREATE SCHEDULE MODAL WIZARD -->
      @if (showCreateModal()) {
        <div class="modal-overlay">
          <div class="modal-content animate-slide-up">
            <div class="modal-header">
               <h3 style="margin:0;">Crear Nuevo Horario</h3>
              <button class="close-btn" (click)="closeCreateModal()">
                 <lucide-icon name="x" [size]="20"></lucide-icon>
              </button>
            </div>
            
            <div class="modal-body grid-bg">
              <div class="form-group w-full">
                 <label>Paso 1: Seleccionar Ficha / Curso</label>
                 <select class="form-select w-full" [(ngModel)]="createPayload.curso_id" (change)="onCourseSelect($event)">
                    <option [ngValue]="''">Seleccione un curso sin horario asignado...</option>
                    @for (curso of srv.cursosSinHorario(); track curso.id) {
                      <option [value]="curso.id">{{ curso.id_curso }} - {{ curso.programa?.nombre }} ({{ curso.jornada }})</option>
                    }
                 </select>
              </div>

              @if (createPayload.curso_id) {
                <div class="form-group w-full" style="margin-top:20px;">
                   <label>Ambiente de Formación (Jornada: {{ createPayload.jornada }})</label>
                   <select class="form-select w-full" [(ngModel)]="createPayload.ambiente_id">
                      <option [ngValue]="''">Seleccione un ambiente físico disponible...</option>
                      @for (amb of srv.ambientesDisponibles(); track amb.id) {
                        <option [value]="amb.id">{{ amb.nombre }} - Capacidad: {{ amb.capacidad }}</option>
                      }
                   </select>
                </div>

                <div style="margin-top:24px;">
                  <label>Paso 2: Asignar instructor por día (Lunes a Sábado)</label>
                  
                  <div class="table-responsive" style="margin-top:12px;">
                     <table class="assignment-table">
                        <thead>
                           <tr>
                              <th>Día</th>
                              <th>Instructor</th>
                              <th style="text-align:center;">Transversal</th>
                              <th>Hora Inicio</th>
                              <th>Hora Fin</th>
                           </tr>
                        </thead>
                        <tbody>
                           @for (detalle of createPayload.detalles; track detalle.dia; let idx = $index) {
                             <tr [class.row-alt]="idx % 2 !== 0">
                                <td class="day-col">{{ detalle.dia }}</td>
                                <td>
                                   <select class="form-select w-full" [(ngModel)]="detalle.instructor_id">
                                      <option [ngValue]="''">Seleccione instructor...</option>
                                      @for (inst of srv.instructores(); track inst.id) {
                                        <option [value]="inst.persona_id || inst.id">{{ inst.nombre }} {{ inst.apellido || '' }}</option>
                                      }
                                   </select>
                                </td>
                                <td style="text-align:center;">
                                   <input type="checkbox" [(ngModel)]="detalle.es_transversal" (change)="onTransversalCheck(detalle)" />
                                </td>
                                <td>
                                   <select class="form-select w-full" [(ngModel)]="detalle.hora_inicio" [disabled]="detalle.es_transversal">
                                      @for (opt of timeOptions; track opt) {
                                         <option [value]="opt">{{ opt }}</option>
                                      }
                                   </select>
                                </td>
                                <td>
                                   <select class="form-select w-full" [(ngModel)]="detalle.hora_fin" [disabled]="detalle.es_transversal">
                                      @for (opt of timeOptions; track opt) {
                                         <option [value]="opt">{{ opt }}</option>
                                      }
                                   </select>
                                </td>
                             </tr>
                           }
                        </tbody>
                     </table>
                  </div>
                </div>
              }
            </div>

            <div class="modal-footer">
               <button class="btn-secondary" (click)="closeCreateModal()">Cancelar</button>
               <button class="btn-success" (click)="submitCreateHorario()" [disabled]="!createPayload.curso_id || !createPayload.ambiente_id || creating()">
                 {{ creating() ? 'Guardando...' : 'Guardar Horario' }}
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
      gap: 20px;
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
    .btn-secondary {
      background: var(--color-white);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      padding: 8px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-secondary:hover { background: var(--color-bg); }
    .btn-success {
      background: #2E7D52;
      color: var(--color-white);
      border: none;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-success:hover { background: #1B5C3A; }

    .filters-card {
      display: flex;
      gap: 16px;
      background: var(--color-white);
      padding: 16px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      align-items: center;
    }
    .filter-group {
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted);
    }
    .form-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 13px;
      outline: none;
    }
    .form-input.with-icon {
      padding-left: 36px;
    }
    .form-select {
      padding: 8px 32px 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 13px;
      outline: none;
      background-color: var(--color-white);
    }

    .matrix-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .table-responsive {
      overflow-x: auto;
      max-width: 100%;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1200px;
    }
    .matrix-table th, .matrix-table td {
      border: 1px solid var(--color-border);
      padding: 12px;
      vertical-align: top;
    }
    .matrix-table th {
      background: #1B5C3A;
      color: var(--color-white);
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      text-transform: uppercase;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .matrix-table th.current-day {
      background: #2E7D52;
    }
    .matrix-table th.sticky-col {
      left: 0;
      z-index: 20;
      min-width: 200px;
    }
    .matrix-table td.sticky-col {
      position: sticky;
      left: 0;
      background: #F9FAFB;
      z-index: 5;
      border-right: 2px solid var(--color-border);
    }
    .instructor-cell {
      min-width: 200px;
      display: flex;
      align-items: center;
      height: 100%;
    }
    .instructor-name {
      font-weight: 600;
      font-size: 13px;
      color: var(--color-text);
    }
    .empty-cell {
      background: var(--color-white);
    }
    .cell-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 160px;
    }
    .class-card {
      background: #F9FAFB;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.2s ease;
    }
    
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
    .class-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-color: #D1D5DB;
    }
    .class-card.group:hover .card-actions {
      display: flex !important;
    }
    .action-btn {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 4px;
      cursor: pointer;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .edit-btn:hover { color: #2563eb; border-color: #2563eb; background: #eff6ff; }
    .delete-btn:hover { color: #dc2626; border-color: #dc2626; background: #fef2f2; }
    .class-time {
      font-weight: 600;
      font-size: 12px;
      color: var(--color-text);
    }
    .class-meta {
      font-size: 11px;
      color: var(--color-text-muted);
    }
    .status-badge {
      margin-top: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-align: center;
      display: inline-block;
    }
    .badge-pendiente {
      background: #F4F6F8;
      color: #6B7280;
    }
    .badge-activa {
      background: #E8F5EE;
      color: #1B5C3A;
    }
    .badge-retraso {
      background: #FEE2E2;
      color: #991B1B;
    }
    .badge-no-asistio {
      background: #FEE2E2;
      color: #991B1B;
    }
    .badge-finalizada {
      background: #EFF6FF;
      color: #1E40AF;
    }
    .badge-suspendida {
      background: #FEF08A;
      color: #854D0E;
    }
    .loading-state {
      padding: 60px;
      text-align: center;
      color: var(--color-text-muted);
      font-size: 14px;
    }

    /* Modal Styling */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .modal-content {
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: var(--color-white);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      position: relative;
    }

    .modal-header {
      padding: 24px 28px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--color-white);
      z-index: 10;
    }

    .close-btn { background: transparent; border: none; cursor: pointer; color: var(--color-text-muted); }

    .modal-body.grid-bg {
      background: var(--color-bg);
    }
    
    .modal-body {
       padding: 24px;
       flex: 1;
       overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--color-border);
      background: #F9FAFB;
      width: 100%;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      color: var(--color-text);
      font-weight: 500;
    }

    .flex-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .flex-checkbox label { margin-bottom: 0; cursor: pointer; }

    .w-full { width: 100%; }
    .assignment-table { width: 100%; border-collapse: collapse; background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
    .assignment-table th { background: #F4F6F8; color: #6B7280; font-size: 13px; font-weight: 600; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
    .assignment-table td { padding: 12px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    .assignment-table tr:last-child td { border-bottom: none; }
    .assignment-table tr.row-alt { background: #F9FAFB; }
    .assignment-table .day-col { color: #2E7D52; font-weight: 600; font-size: 13px; }
  `]
})
export class AdminHorariosComponent implements OnInit {
  srv = inject(AdminHorariosService);
  cdr = inject(ChangeDetectorRef);

  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  searchQuery = '';
  jornadaFilter = 'Todas';
  selectedDate = new Date().toISOString().split('T')[0];
  
  rawMatrix = signal<any[]>([]);
  filteredMatrix = signal<any[]>([]);

  showCreateModal = signal(false);
  creating = signal(false);

  timeOptions = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  defaultPayload() {
    return {
      curso_id: '',
      ambiente_id: '',
      jornada: '',
      detalles: [
        { dia: 'Lunes', hora_inicio: '06:00', hora_fin: '10:00', instructor_id: '', es_transversal: false },
        { dia: 'Martes', hora_inicio: '06:00', hora_fin: '10:00', instructor_id: '', es_transversal: false },
        { dia: 'Miércoles', hora_inicio: '06:00', hora_fin: '10:00', instructor_id: '', es_transversal: false },
        { dia: 'Jueves', hora_inicio: '06:00', hora_fin: '10:00', instructor_id: '', es_transversal: false },
        { dia: 'Viernes', hora_inicio: '06:00', hora_fin: '10:00', instructor_id: '', es_transversal: false },
        { dia: 'Sábado', hora_inicio: '06:00', hora_fin: '10:00', instructor_id: '', es_transversal: false }
      ]
    };
  }

  createPayload = this.defaultPayload();

  constructor() {
    effect(() => {
      // Re-calculate matrix when data changes
      const horarios = this.srv.schedulesList();
      const registros = this.srv.registrosDia();
      if (horarios && registros) {
        this.buildMatrix(horarios, registros);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.fetchData();
  }

  onDateChange() {
    this.fetchData();
  }

  fetchData() {
    this.srv.fetchHorarios();
    this.srv.fetchRegistrosClasesSemana(this.selectedDate);
  }

  buildMatrix(horarios: any[], registros: any[]) {
    // 1. Map all instructors that have classes
    const instructorMap = new Map<string, any>();

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    horarios.forEach(h => {
      h.detalles?.forEach((d: any) => {
        if (!d.instructor) return;
        
        const instId = d.instructor.id;
        const instName = d.instructor.nombre + (d.instructor.apellido ? ' ' + d.instructor.apellido : '');
        
        if (!instructorMap.has(instId)) {
          instructorMap.set(instId, {
            instructorId: instId,
            instructorName: instName,
            days: {
              'Lunes': [], 'Martes': [], 'Miércoles': [],
              'Jueves': [], 'Viernes': [], 'Sábado': []
            }
          });
        }

        const instNode = instructorMap.get(instId);
        const dayStr = dayNames[d.dia];
        if (dayStr && instNode.days[dayStr]) {
          // Process Badge
          const claseBadgeInfo = this.calculateBadge(d, registros);
          
          instNode.days[dayStr].push({
            detalleId: d.id,
            horaInicio: d.hora_inicio.substring(0,5),
            horaFin: d.hora_fin.substring(0,5),
            ficha: h.curso?.id_curso || 'N/A',
            programa: h.curso?.programa?.nombre || 'N/A',
            ambiente: h.ambiente?.nombre || 'N/A',
            jornada: h.curso?.jornada || 'N/A',
            badgeText: claseBadgeInfo.text,
            badgeClass: claseBadgeInfo.cssClass,
            progress: claseBadgeInfo.progress,
            competencia: d.competencia,
            resultado: d.resultado,
            fecha_inicio_competencia: d.fecha_inicio_competencia,
            fecha_fin_competencia: d.fecha_fin_competencia,
            // For filtering:
            searchStr: `${h.curso?.id_curso} ${h.ambiente?.nombre} ${h.curso?.jornada}`.toLowerCase()
          });
        }
      });
    });

    const matrixArray = Array.from(instructorMap.values());
    // Sort by instructor name
    matrixArray.sort((a, b) => a.instructorName.localeCompare(b.instructorName));
    
    this.rawMatrix.set(matrixArray);
    this.applyFilters();
  }

  calculateBadge(detalle: any, registros: any[]): { text: string, cssClass: string, progress?: number } {
    const dDate = new Date(this.selectedDate + 'T00:00:00');
    const day = dDate.getDay() || 7;
    const targetDay = detalle.dia || 7;
    const copy = new Date(dDate);
    copy.setDate(dDate.getDate() - day + targetDay);
    const eventDate = copy.toISOString().substring(0, 10);

    const reg = registros.find(r => (r.horario_detalle_id === detalle.id || r.horario_detalle?.id === detalle.id) && r.fecha?.startsWith(eventDate));
    const now = new Date();
    const evtTimeEnd = new Date(eventDate + 'T' + detalle.hora_fin);
    
    const getProg = () => {
       const now = new Date();
       const start = new Date(eventDate + 'T' + detalle.hora_inicio).getTime();
       const end = new Date(eventDate + 'T' + detalle.hora_fin).getTime();
       const nowTime = now.getTime();
       if (nowTime < start) return 0;
       if (nowTime > end) return 100;
       return Math.min(100, Math.max(0, ((nowTime - start) / (end - start)) * 100));
    };

    if (!reg) {
       // Check auto delay (if time has passed)
       const now = new Date();
       const currentToday = new Date().toISOString().split('T')[0];
       
       if (eventDate < currentToday) {
         return { text: 'No asistió', cssClass: 'badge-no-asistio' };
       }
       if (eventDate === currentToday) {
         const currentMinutes = now.getHours() * 60 + now.getMinutes();
         const [hStr, mStr] = detalle.hora_inicio.split(':');
         const startMinutes = parseInt(hStr) * 60 + parseInt(mStr);
         const endMinutes = parseInt(detalle.hora_fin.split(':')[0]) * 60 + parseInt(detalle.hora_fin.split(':')[1]);
         
         if (currentMinutes > endMinutes) {
            return { text: 'No asistió', cssClass: 'badge-no-asistio' };
         } else if (currentMinutes > startMinutes) {
            return { text: 'Retraso Automático', cssClass: 'badge-retraso' };
         }
       }
       return { text: 'Pendiente', cssClass: 'badge-pendiente' };
    }

    if (reg.estado === 'no_asistio') {
       return { text: 'No asistió', cssClass: 'badge-no-asistio' };
    }

    if (reg.estado === 'finalizada' || (reg.estado === 'activa' && now > evtTimeEnd)) {
      return { text: 'Finalizada', cssClass: 'badge-finalizada' };
    }

    if (reg.estado === 'activa') {
      if (reg.minutos_retraso && reg.minutos_retraso > 0) {
         return { text: `Retraso: ${reg.minutos_retraso} min`, cssClass: 'badge-retraso', progress: getProg() };
      }
      return { text: 'Activa', cssClass: 'badge-activa', progress: getProg() };
    }

    if (reg.estado === 'suspendida') {
       return { text: 'Suspendida', cssClass: 'badge-suspendida' };
    }

    return { text: 'Pendiente', cssClass: 'badge-pendiente' };
  }

  getSpanishDay(jsDayIndex: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[jsDayIndex];
  }

  isCurrentDay(dayName: string): boolean {
    const now = new Date();
    // Use selectedDate to determine if we highlight the current day of that date?
    // User requested "El día actual resaltado con fondo #2E7D52". Means today's weekday.
    const todayStr = new Date(this.selectedDate).getDay(); // Note: parsing string is UTC, might be off by timezone. We just check JS getDay for strictly today?
    const realToday = new Date().getDay();
    if (this.selectedDate === new Date().toISOString().split('T')[0]) {
       return this.getSpanishDay(realToday) === dayName;
    }
    return false;
  }

  applyFilters() {
    const query = this.searchQuery.toLowerCase();
    const jornada = this.jornadaFilter;
    
    let filtered = this.rawMatrix().map(row => {
      // deep copy days to filter classes inside
      const newDays: any = {};
      let hasMatch = false;
      let instructorMatches = row.instructorName.toLowerCase().includes(query);
      
      for (const d of this.days) {
        newDays[d] = row.days[d].filter((c: any) => {
           let matchQ = instructorMatches || c.searchStr.includes(query);
           let matchJ = jornada === 'Todas' || c.jornada === jornada;
           return matchQ && matchJ;
        });
        if (newDays[d].length > 0) {
          hasMatch = true;
        }
      }
      return { ...row, days: newDays, hasMatch };
    });

    // Remove rows that have no classes matching after filter (unless instructor name perfectly matched and we show empty)
    filtered = filtered.filter(row => row.hasMatch || (row.instructorName.toLowerCase().includes(query) && query !== ''));
    
    this.filteredMatrix.set(filtered);
    this.cdr.detectChanges();
  }

  openCreateModal() {
    this.createPayload = this.defaultPayload();
    this.srv.fetchCursosSinHorario();
    this.srv.fetchInstructores(); // Ensure we have instructors mapped
    this.showCreateModal.set(true);
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.cdr.detectChanges();
  }

  onCourseSelect(ev: any) {
    const cursoId = ev.target.value;
    const c = this.srv.cursosSinHorario().find(x => x.id === cursoId);
    if (c) {
      this.createPayload.jornada = c.jornada;
      this.srv.fetchAmbientesDisponibles(c.jornada, c.id);
      
      // Preseleccionar el ambiente base del curso si lo tiene
      if (c.ambiente?.id) {
        this.createPayload.ambiente_id = c.ambiente.id;
      } else {
        this.createPayload.ambiente_id = '';
      }
      
      const defaultInicio = c.jornada === 'Tarde' ? '12:30' : '07:00';
      const defaultFin = c.jornada === 'Tarde' ? '17:00' : '12:00';
      
      this.createPayload.detalles.forEach(d => {
         d.hora_inicio = defaultInicio;
         d.hora_fin = defaultFin;
      });
    } else {
       this.createPayload.jornada = '';
       this.createPayload.ambiente_id = '';
    }
  }

  onTransversalCheck(detalle: any) {
    if (detalle.es_transversal) {
       detalle.hora_inicio = '08:00';
       detalle.hora_fin = '12:00';
    }
  }

  submitCreateHorario() {
    // Filter only valid rules (with configurations assigned) and map day to integer
    const daysMap: { [key: string]: number } = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
    
    const solidPayload = {
      curso_id: this.createPayload.curso_id,
      ambiente_id: this.createPayload.ambiente_id,
      jornada: this.createPayload.jornada,
      detalles: this.createPayload.detalles
        .filter(d => d.instructor_id) // solo los asignados
        .map(d => ({ ...d, dia: daysMap[d.dia] })) // parse day string to integer
    };

    if (solidPayload.detalles.length === 0) {
       alert('Debe asignar al menos un bloque diario con un instructor.');
       return;
    }

    this.creating.set(true);
    this.srv.createHorario(solidPayload).subscribe({
      next: () => {
         this.creating.set(false);
         this.closeCreateModal();
         this.fetchData();
      },
      error: (err) => {
         this.creating.set(false);
         alert('Error al crear horario: Verifica que los instructores o ambientes no estén cruzados en esos horarios.');
         console.error(err);
      }
    });
  }

  // --- EDIT & DELETE LOGIC ---
  showEditModal = signal(false);
  selectedEditClass: any = null;
  editPayload = { instructor_id: '', hora_inicio: '', hora_fin: '' };
  savingEdit = signal(false);

  onDeleteClass(clase: any) {
    if (confirm('¿Estás seguro de que deseas quitar a este instructor de esta clase? Los registros de clases pasadas se conservarán.')) {
      this.srv.deleteHorarioDetalle(clase.detalleId).subscribe({
        next: () => {
          this.fetchData();
        },
        error: (err) => {
          console.error(err);
          alert('Error al borrar la clase.');
        }
      });
    }
  }

  onEditClass(clase: any) {
    this.selectedEditClass = clase;
    this.editPayload = {
      instructor_id: clase.instructorId,
      hora_inicio: clase.horaInicio,
      hora_fin: clase.horaFin
    };
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedEditClass = null;
  }

  saveEditClass() {
    if (!this.editPayload.hora_inicio || !this.editPayload.hora_fin) {
      alert('La hora de inicio y fin son obligatorias.');
      return;
    }
    
    this.savingEdit.set(true);
    this.srv.updateHorarioDetalle(this.selectedEditClass.detalleId, this.editPayload).subscribe({
      next: () => {
        this.savingEdit.set(false);
        this.closeEditModal();
        this.fetchData();
      },
      error: (err) => {
        this.savingEdit.set(false);
        alert('Error al actualizar la clase.');
        console.error(err);
      }
    });
  }
}

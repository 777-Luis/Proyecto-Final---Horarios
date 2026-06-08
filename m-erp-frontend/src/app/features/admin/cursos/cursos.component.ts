import {
  Component, OnInit, signal, inject, ChangeDetectorRef,
  ChangeDetectionStrategy, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus, X, Search, Pencil, Trash2, Download, Calendar, AlertCircle, User, Clock, LayoutGrid, List, Copy, Check
} from 'lucide-angular';
import { AdminCursosService } from '../../../core/services/admin-cursos.service';
import { AdminHorariosService } from '../../../core/services/admin-horarios.service';

interface MonthDay {
  date: number;
  fullDate: string;
  isCurrentMonth: boolean;
  events: any[];
}

@Component({
  selector: 'app-admin-cursos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  template: `
    <!-- ─── Page ──────────────────────────────────── -->
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Cursos (Fichas)</h1>
          <p class="page-subtitle">Administre y consolide fichas formativas SENA</p>
        </div>
        <button class="btn-primary" id="btn-crear-curso" (click)="openCreateModal()">
          <lucide-icon name="plus" [size]="16"></lucide-icon> Crear Curso
        </button>
      </div>

      <!-- ─── Toolbar: Buscador ───────────────────── -->
      <div class="toolbar" style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
        <div class="search-wrapper" style="flex: 1; min-width: 250px;">
          <lucide-icon name="search" [size]="16" class="search-icon"></lucide-icon>
          <input
            type="text"
            class="search-input"
            id="input-buscar-curso"
            [(ngModel)]="searchTerm"
            placeholder="Buscar por ficha, programa o área...">
        </div>
        <select [(ngModel)]="jornadaFilter" class="field-input" style="width: auto; max-width: 200px;">
          <option value="Todas">Todas las jornadas</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
        </select>
      </div>

      <!-- ─── Table ───────────────────────────────── -->
      <div class="table-card">
        @if (srv.isLoading()) {
          <div class="loading-state">Cargando cursos...</div>
        } @else {
          <div class="table-responsive">
            <table>
              <thead>
                <tr style="background: #1B5C3A; color: white;">
                  <th style="padding: 12px; text-align: left;">Ficha / Nivel</th>
                  <th style="padding: 12px; text-align: left;">Programa Formativo</th>
                  <th style="padding: 12px; text-align: left;">Área / Líder</th>
                  <th style="padding: 12px; text-align: center;">Jornada</th>
                  <th style="padding: 12px; text-align: center;">Vigencia</th>
                  <th style="padding: 12px; text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (curso of filteredCursos(); track curso.id) {
                  <tr style="border-bottom: 1px solid #E5E7EB; transition: background 0.2s;" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='white'">
                    <td style="padding: 12px;">
                      <div style="color: #2E7D52; font-weight: 600; font-size: 15px;">Ficha {{ curso.id_curso }}</div>
                      <div style="color: #6B7280; font-size: 12px;">{{ curso.programa?.tipo_programa || 'Tecnólogo' }}</div>
                    </td>
                    
                    <td style="padding: 12px;">
                      <div style="font-weight: 500; color: #374151;">{{ curso.programa?.nombre || 'Sin programa' }}</div>
                    </td>
                    
                    <td style="padding: 12px;">
                      <div style="color: #374151; font-weight: 500;">{{ curso.area?.nombre || 'Sin área' }}</div>
                      <div style="color: #6B7280; font-size: 12px;">{{ curso.lider ? (curso.lider.nombre || '') + ' ' + (curso.lider.apellido || '') : 'Sin asignar' }}</div>
                    </td>
                    
                    <td style="padding: 12px; text-align: center;">
                      <span class="badge sm" [class.manana]="curso.jornada === 'Mañana'" [class.tarde]="curso.jornada === 'Tarde'">{{ curso.jornada }}</span>
                    </td>

                    <td style="padding: 12px; text-align: center; color: #4B5563; font-size: 12px;">
                      <div title="Inicio"><span style="color:#2E7D52; font-weight: 500;">I:</span> {{ (curso.fecha_inicio | date:'dd/MM/yy':'UTC') || 'N/A' }}</div>
                      <div title="Fin Lectiva"><span style="color:#F59E0B; font-weight: 500;">L:</span> {{ (curso.fin_lectiva | date:'dd/MM/yy':'UTC') || 'N/A' }}</div>
                      <div title="Fin Total"><span style="color:#DC2626; font-weight: 500;">F:</span> {{ (curso.fecha_fin | date:'dd/MM/yy':'UTC') || 'N/A' }}</div>
                    </td>
                    
                    <td style="padding: 12px; text-align: right;">
                      <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="action-btn" title="Ver Horario" (click)="openCalendarModal(curso)" style="background: #E8F5E9; color: #2E7D52; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                          <lucide-icon name="calendar" [size]="14"></lucide-icon> Ver Horario
                        </button>
                        <button class="action-btn edit" title="Editar" (click)="openEditModal(curso, $event)" style="padding: 6px;">
                          <lucide-icon name="pencil" [size]="14"></lucide-icon>
                        </button>
                        <button class="action-btn delete" title="Eliminar" (click)="openDeleteModal(curso, $event)" style="padding: 6px;">
                          <lucide-icon name="trash-2" [size]="14"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (filteredCursos().length === 0 && !srv.isLoading()) {
                  <tr>
                    <td colspan="6" class="empty-state" style="padding: 20px; text-align: center; color: #6B7280;">No se encontraron cursos con ese criterio de búsqueda.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="pagination-footer">
            <span class="page-info">{{ filteredCursos().length }} resultado(s)</span>
          </div>
        }
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         MODAL 1 — Vista Calendario del Curso
    ══════════════════════════════════════════════ -->
    @if (showCalendarModal()) {
      <div class="modal-overlay" (click)="closeCalendarModal()">
        <div class="modal-container wide-modal" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="modal-header">
            <div class="cal-header-meta">
              <lucide-icon name="calendar" [size]="20"></lucide-icon>
              <div>
                <h2 class="modal-title">Ficha {{ selectedCurso()?.id_curso }}</h2>
                <p class="modal-subtitle">{{ selectedCurso()?.programa?.nombre || selectedCurso()?.area?.nombre }}</p>
              </div>
            </div>
            <div class="header-btns" style="display: flex; gap: 8px; align-items: center;">
              <!-- TOGGLE VISTA -->
              <div class="view-toggle">
                <button [class.active]="calendarViewMode() === 'weekly'" (click)="setCalendarViewMode('weekly')" title="Vista Semanal"><lucide-icon name="list" [size]="16"></lucide-icon> Semanal</button>
                <button [class.active]="calendarViewMode() === 'monthly'" (click)="setCalendarViewMode('monthly')" title="Vista Mensual"><lucide-icon name="layout-grid" [size]="16"></lucide-icon> Mensual</button>
              </div>

              <!-- DATE NAVIGATOR -->
              <div class="date-navigator">
                <button class="nav-arrow" (click)="previousPeriod()"><lucide-icon name="chevron-left" [size]="16"></lucide-icon></button>
                
                <div class="period-display" style="position: relative;">
                  <span class="period-label">{{ displayPeriod() }}</span>
                  <input type="date" [ngModel]="selectedDate()" (ngModelChange)="onDateChange($event)" class="hidden-date-input" title="Elegir fecha">
                </div>

                <button class="nav-arrow" (click)="nextPeriod()"><lucide-icon name="chevron-right" [size]="16"></lucide-icon></button>
              </div>

              @if (srv.horarioDelCurso()) {
                <button class="btn-primary" (click)="openAddBlockModal()">
                  <lucide-icon name="plus" [size]="15"></lucide-icon> Añadir Bloque
                </button>
                <button class="btn-download" (click)="downloadPdf()">
                  <lucide-icon name="download" [size]="15"></lucide-icon> PDF
                </button>
              }
              <button class="modal-close" (click)="closeCalendarModal()">
                <lucide-icon name="x" [size]="18"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Info strip -->
          <div class="info-strip">
            <div class="info-chip"><span class="chip-label">Área</span><span>{{ selectedCurso()?.area?.nombre || 'N/A' }}</span></div>
            <div class="info-chip"><span class="chip-label">Programa</span><span>{{ selectedCurso()?.programa?.nombre || 'N/A' }}</span></div>
            <div class="info-chip"><span class="chip-label">Jornada</span>
              <span class="badge sm" [class.manana]="selectedCurso()?.jornada === 'Mañana'" [class.tarde]="selectedCurso()?.jornada === 'Tarde'">
                {{ selectedCurso()?.jornada }}
              </span>
            </div>
            <div class="info-chip"><span class="chip-label">Nivel</span><span>{{ selectedCurso()?.programa?.tipo_programa || 'N/A' }}</span></div>
            <div class="info-chip"><span class="chip-label">Ambiente</span><span>{{ srv.horarioDelCurso()?.ambiente?.nombre || 'Sin asignar' }}</span></div>
            <div class="info-chip"><span class="chip-label">Lectiva</span><span>{{ selectedCurso()?.fecha_inicio | date:'dd/MM/yy':'UTC' }} - {{ selectedCurso()?.fin_lectiva | date:'dd/MM/yy':'UTC' }}</span></div>
          </div>

          <!-- Calendar body -->
          <div class="cal-body">
            @if (srv.isLoadingHorario()) {
              <div class="loading-state">Cargando horario...</div>
            } @else if (!srv.horarioDelCurso()) {
              <div class="no-schedule">
                <lucide-icon name="alert-circle" [size]="32"></lucide-icon>
                <p>Este curso aún no tiene horario asignado</p>
              </div>
            } @else {
              
              @if (calendarViewMode() === 'weekly') {
                <div class="schedule-wrapper">
                  <!-- Time column -->
                  <div class="time-col">
                    <div class="time-col-header"></div>
                    @for (h of hoursRuler; track h) {
                      <div class="time-cell">{{ formatHour(h) }}</div>
                    }
                  </div>

                  <!-- Day columns -->
                  @for (day of days; track day) {
                    <div class="day-col">
                      <div class="day-header">{{ day }}</div>
                      <div class="day-slots" [style.position]="'relative'" [style.height.px]="hoursRuler.length * 60">
                        @for (evt of getEventsForDay(day); track $index) {
                          <div
                            class="event-block custom-tooltip-container"
                            [class.transversal]="evt.es_transversal"
                            [style.top.px]="evt.topPx"
                            [style.height.px]="evt.heightPx"
                            (click)="openEventDetails(evt)">
                            @if (evt.es_transversal) {
                              <div class="event-tag">Transversal</div>
                            }
                            <div class="event-instructor">{{ getInstructorName(evt) }}</div>
                            <div class="event-time">{{ evt.hora_inicio?.substring(0,5) }} - {{ evt.hora_fin?.substring(0,5) }}</div>
                            @if (getBadge(evt, day); as badge) {
                              <div class="sch-badge" 
                                   [class.pendiente]="badge.type.toLowerCase() === 'pendiente'"
                                   [class.activa]="badge.type.toLowerCase() === 'activa'"
                                   [class.retraso]="badge.type.toLowerCase() === 'retraso'"
                                   [class.finalizada]="badge.type.toLowerCase() === 'finalizada'"
                                   [class.suspendida]="badge.type.toLowerCase() === 'suspendida'"
                                   [class.no-asistio]="badge.type.toLowerCase() === 'no asistio'">
                                {{ badge.text }}
                              </div>
                              @if (badge.type === 'Activa' || badge.type === 'Retraso') {
                                <div class="progress-container">
                                  <div class="progress-bar" [style.width.%]="horariosSrv.getClassProgressForEvent(evt, day)"></div>
                                </div>
                              }
                            }

                            <div class="custom-tooltip">
                              <div class="tt-body" style="font-size: 13px; line-height: 1.5;">
                                <div><strong>Instructor:</strong> {{ getInstructorName(evt) }}</div>
                                <div><strong>Ambiente:</strong> {{ evt?.ambienteNombre || 'Sin asignar' }}</div>
                                <div><strong>Grupo:</strong> {{ selectedCurso()?.programa?.nombre || '' }} - {{ selectedCurso()?.id_curso }}</div>
                                <div style="margin-top: 6px;"><strong>Competencia:</strong><br/>{{ evt.competencia || 'N/A' }}</div>
                                <div style="margin-top: 4px;"><strong>Resultado:</strong><br/>{{ evt.resultado || 'N/A' }}</div>
                                <div style="margin-top: 6px;"><strong>Fecha de inicio:</strong> {{ (evt.fecha_inicio_competencia | date:'dd-MM-yyyy':'UTC') || 'N/A' }}</div>
                                <div><strong>Fecha de fin:</strong> {{ (evt.fecha_fin_competencia | date:'dd-MM-yyyy':'UTC') || 'N/A' }}</div>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <!-- VISTA MENSUAL -->
                <div class="monthly-wrapper">
                  <div class="month-header-grid">
                    @for (dayName of weekDays; track dayName) {
                      <div class="month-day-name">{{ dayName }}</div>
                    }
                  </div>
                  <div class="month-grid">
                    @for (mDay of monthlyGrid(); track mDay.fullDate) {
                      <div class="month-cell" [class.not-current-month]="!mDay.isCurrentMonth" [class.is-today]="mDay.fullDate === selectedDate()">
                        <div class="month-cell-date">{{ mDay.date }}</div>
                        <div class="month-cell-events">
                          @for (evt of mDay.events; track $index) {
                            <div class="month-event custom-tooltip-container" [class.transversal]="evt.es_transversal" (click)="openEventDetails(evt, mDay.fullDate)">
                              <div class="mevt-time">{{ evt.hora_inicio?.substring(0,5) }}</div>
                              <div class="mevt-title">{{ getInstructorName(evt) }}</div>
                              
                              <div class="custom-tooltip monthly-tooltip">
                                <div class="tt-body" style="font-size: 13px; line-height: 1.5;">
                                  <div><strong>Instructor:</strong> {{ getInstructorName(evt) }}</div>
                                  <div><strong>Ambiente:</strong> {{ evt?.ambienteNombre || 'Sin asignar' }}</div>
                                  <div><strong>Grupo:</strong> {{ selectedCurso()?.programa?.nombre || '' }} - {{ selectedCurso()?.id_curso }}</div>
                                  <div style="margin-top: 6px;"><strong>Competencia:</strong><br/>{{ evt.competencia || 'N/A' }}</div>
                                  <div style="margin-top: 4px;"><strong>Resultado:</strong><br/>{{ evt.resultado || 'N/A' }}</div>
                                  <div style="margin-top: 6px;"><strong>Fecha de inicio:</strong> {{ (evt.fecha_inicio_competencia | date:'dd-MM-yyyy':'UTC') || 'N/A' }}</div>
                                  <div><strong>Fecha de fin:</strong> {{ (evt.fecha_fin_competencia | date:'dd-MM-yyyy':'UTC') || 'N/A' }}</div>
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>

        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════════
         MODAL 2 — Crear Curso
    ══════════════════════════════════════════════ -->
    @if (showCreateModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-container form-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title"><lucide-icon name="plus" [size]="18"></lucide-icon> Crear Nuevo Curso</h2>
            <button class="modal-close" (click)="closeModal()"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <div class="modal-body-scroll">
            <ng-container *ngTemplateOutlet="cursoFormTpl; context: { $implicit: 'create' }"></ng-container>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeModal()">Cancelar</button>
            <button class="btn-save" id="btn-guardar-curso" (click)="submitCreate()" [disabled]="cursoForm.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Guardando...' : 'Crear Ficha' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════════
         MODAL 3 — Editar Curso
    ══════════════════════════════════════════════ -->
    @if (showEditModal()) {
      <div class="modal-overlay" (click)="closeEditModal()">
        <div class="modal-container form-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title"><lucide-icon name="pencil" [size]="18"></lucide-icon> Editar Curso</h2>
            <button class="modal-close" (click)="closeEditModal()"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <div class="modal-body-scroll">
            <ng-container *ngTemplateOutlet="cursoFormTpl; context: { $implicit: 'edit' }"></ng-container>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeEditModal()">Cancelar</button>
            <button class="btn-save" id="btn-actualizar-curso" (click)="submitEdit()" [disabled]="cursoForm.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════════
         MODAL 4 — Confirmar Eliminar
    ══════════════════════════════════════════════ -->
    @if (showDeleteModal()) {
      <div class="modal-overlay" (click)="closeDeleteModal()">
        <div class="modal-container confirm-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title danger-title">
              <lucide-icon name="trash-2" [size]="18"></lucide-icon> Eliminar Curso
            </h2>
            <button class="modal-close" (click)="closeDeleteModal()"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <div class="confirm-body">
            <p>¿Estás seguro de que deseas eliminar la ficha <strong>{{ cursoToDelete()?.id_curso }}</strong>?</p>
            <p class="confirm-sub">Esta acción <strong>no se puede deshacer</strong> y eliminará todos los datos asociados.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeDeleteModal()">Cancelar</button>
            <button class="btn-danger" id="btn-confirmar-eliminar" (click)="confirmDelete()" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Eliminando...' : 'Sí, eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════════
         MODAL 5 — Añadir Bloque a Horario Existente
    ══════════════════════════════════════════════ -->
    @if (showAddBlockModal()) {
      <div class="modal-overlay" (click)="closeAddBlockModal()">
        <div class="modal-container form-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title"><lucide-icon name="plus" [size]="18"></lucide-icon> Añadir Bloque de Clase</h2>
            <button class="modal-close" (click)="closeAddBlockModal()"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <div class="modal-body-scroll">
            <div class="advanced-form">
              <div class="field-group">
                <label class="field-label">Día de la semana</label>
                <select [(ngModel)]="addBlockPayload.dia" class="field-input">
                  <option [value]="1">Lunes</option>
                  <option [value]="2">Martes</option>
                  <option [value]="3">Miércoles</option>
                  <option [value]="4">Jueves</option>
                  <option [value]="5">Viernes</option>
                  <option [value]="6">Sábado</option>
                </select>
              </div>
              <div class="form-row">
                <div class="field-group">
                  <label class="field-label">Hora Inicio</label>
                  <input type="time" [(ngModel)]="addBlockPayload.hora_inicio" class="field-input">
                </div>
                <div class="field-group">
                  <label class="field-label">Hora Fin</label>
                  <input type="time" [(ngModel)]="addBlockPayload.hora_fin" class="field-input">
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">Instructor</label>
                <select [(ngModel)]="addBlockPayload.instructor_id" class="field-input">
                  <option value="" disabled>Seleccione Instructor...</option>
                  @for (inst of horariosSrv.instructores(); track inst.id) {
                    <option [value]="inst.persona_id || inst.id">{{ inst.nombre || inst.persona?.nombre }} {{ inst.apellido || inst.persona?.apellido }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeAddBlockModal()">Cancelar</button>
            <button class="btn-save" (click)="saveAddBlock()" [disabled]="savingBlock() || !addBlockPayload.instructor_id">
              {{ savingBlock() ? 'Guardando...' : 'Añadir Bloque' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════════
         TEMPLATE — Formulario compartido Crear/Editar
    ══════════════════════════════════════════════ -->
    <ng-template #cursoFormTpl let-mode>
      <form [formGroup]="cursoForm" class="advanced-form">
        <div class="form-row">
          <div class="field-group">
            <label class="field-label">Código del Curso <span class="req">*</span></label>
            <input type="text" formControlName="id_curso" class="field-input" placeholder="Ej: 3063290">
          </div>
          <div class="field-group">
            <label class="field-label">Estado <span class="req">*</span></label>
            <select formControlName="estado" class="field-input">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="field-group">
            <label class="field-label">Programa <span class="req">*</span></label>
            <select formControlName="programa_id" class="field-input">
              <option [ngValue]="null" disabled>Seleccione Programa...</option>
              @for (prog of srv.programas(); track prog.id) {
                <option [ngValue]="prog.id">{{ prog.nombre }}</option>
              }
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Área <span class="req">*</span></label>
            <select formControlName="area_id" class="field-input">
              <option [ngValue]="null" disabled>Seleccione Área...</option>
              @for (area of srv.areas(); track area.id) {
                <option [ngValue]="area.id">{{ area.nombre }}</option>
              }
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="field-group">
            <label class="field-label">Ambiente Asignado</label>
            <select formControlName="ambiente_sugerido" class="field-input" [attr.disabled]="!cursoForm.value.area_id ? '' : null">
              <option [ngValue]="null">Automático o Ninguno</option>
              @for (amb of srv.ambientesDisponibles(); track amb.id) {
                <option [value]="amb.id">{{ amb.nombre }} - Cap: {{ amb.capacidad }}</option>
              }
            </select>
            @if (!cursoForm.value.area_id) {
              <div style="color: #ca8a04; font-size: 11px; margin-top: 4px;">Selecciona primero el Área para ver los ambientes disponibles</div>
            }
          </div>
          <div class="field-group">
            <label class="field-label">Instructor Líder</label>
            <select formControlName="lider_id" class="field-input">
              <option [ngValue]="null">Seleccione Instructor...</option>
              @for (inst of srv.instructoresFilter(); track inst.id) {
                <option [ngValue]="inst.persona_id">{{ inst.persona?.nombre || inst.nombre }} {{ inst.persona?.apellido || inst.apellido || '' }}</option>
              }
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="field-group">
            <label class="field-label">Fecha Inicio <span class="req">*</span></label>
            <input type="date" formControlName="fecha_inicio" class="field-input">
          </div>
          <div class="field-group">
            <label class="field-label">Fecha Fin <span class="req">*</span></label>
            <input type="date" formControlName="fecha_fin" class="field-input">
          </div>
        </div>

        <div class="form-row">
          <div class="field-group" style="width: 100%;">
            <label class="field-label">Fecha Fin Lectiva</label>
            <input type="date" formControlName="fecha_fin_lectiva" class="field-input">
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Jornada <span class="req">*</span></label>
          <select formControlName="jornada" class="field-input">
            <option [ngValue]="null" disabled>Seleccione...</option>
            <option value="Mañana">Mañana (7:00 AM - 12:00 PM)</option>
            <option value="Tarde">Tarde (12:30 PM - 5:00 PM)</option>
          </select>
        </div>

        @if (checkingAvailability()) {
          <div class="info-alert">Buscando ambientes disponibles...</div>
        }

        @if (submitError()) {
          <div class="error-alert">{{ submitError() }}</div>
        }
      </form>
    </ng-template>

    <!-- ─── Event Details Modal ────────────────── -->
    <ng-template [ngIf]="showEventDetailsModal()">
      <div class="modal-backdrop" (click)="closeEventDetailsModal()"></div>
      <div class="modal-panel" style="max-width: 450px;">
        <div class="modal-header">
          <h2 class="modal-title">Detalles del Bloque</h2>
          <button class="btn-icon" (click)="closeEventDetailsModal()"><lucide-icon name="x" [size]="20"></lucide-icon></button>
        </div>
        <div class="modal-body" style="padding: 24px; font-size: 14px; line-height: 1.6;">
          <div id="event-details-content" style="background: #F9FAFB; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB;">
            <div style="margin-bottom: 8px;"><strong>Instructor:</strong> {{ getInstructorName(selectedEventDetails()?.evt) }}</div>
            <div style="margin-bottom: 8px;"><strong>Ambiente:</strong> {{ selectedEventDetails()?.evt?.ambienteNombre || 'Sin asignar' }}</div>
            <div style="margin-bottom: 8px;"><strong>Grupo:</strong> {{ selectedCurso()?.programa?.nombre || '' }} - {{ selectedCurso()?.id_curso }}</div>
            <div style="margin-bottom: 8px;"><strong>Competencia:</strong> {{ selectedEventDetails()?.evt?.competencia || 'N/A' }}</div>
            <div style="margin-bottom: 8px;"><strong>Resultado:</strong> {{ selectedEventDetails()?.evt?.resultado || 'N/A' }}</div>
            <div style="margin-bottom: 8px;"><strong>Fecha de inicio:</strong> {{ (selectedEventDetails()?.evt?.fecha_inicio_competencia | date:'dd-MM-yyyy':'UTC') || 'N/A' }}</div>
            <div><strong>Fecha de fin:</strong> {{ (selectedEventDetails()?.evt?.fecha_fin_competencia | date:'dd-MM-yyyy':'UTC') || 'N/A' }}</div>
          </div>
          
          <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn-outline" (click)="closeEventDetailsModal()">Cerrar</button>
            <button class="btn-primary" (click)="copyEventDetails()">
              <lucide-icon name="copy" [size]="16" *ngIf="!copied()"></lucide-icon>
              <lucide-icon name="check" [size]="16" *ngIf="copied()"></lucide-icon>
              {{ copied() ? 'Copiado!' : 'Copiar Información' }}
            </button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    /* ─── Page ─────────────────────────────────── */
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; flex-wrap: wrap; gap: 16px;
    }
    .page-title  { font-size: 22px; color: var(--color-text); font-weight: 600; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }

    .btn-primary {
      background: var(--color-primary); color: #fff; border: none;
      padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500;
      cursor: pointer; display: flex; gap: 8px; align-items: center; font-size: 14px;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: var(--color-primary-dark); }

    .btn-outline {
      background: #fff; color: #374151; border: 1px solid #D1D5DB;
      padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500;
      cursor: pointer; display: flex; gap: 8px; align-items: center; font-size: 14px;
      transition: background 0.2s, border-color 0.2s;
    }
    .btn-outline:hover { background: #F3F4F6; border-color: #9CA3AF; }

    /* ─── Toolbar ───────────────────────────────── */
    .toolbar { display: flex; align-items: center; gap: 12px; }

    .search-wrapper {
      position: relative; display: flex; align-items: center; flex: 1; max-width: 420px;
    }
    .search-icon {
      position: absolute; left: 12px; color: var(--color-text-muted); pointer-events: none;
    }
    .search-input {
      width: 100%; padding: 10px 12px 10px 38px;
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      font-size: 14px; outline: none; background: var(--color-white);
      color: var(--color-text); transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }
    .search-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(46, 125, 82, 0.1);
    }
    .search-input::placeholder { color: var(--color-text-muted); }

        /* ─── Table ─────────────────────────────────── */
    .table-card {
      background: var(--color-white); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md); border: 1px solid var(--color-border);
      overflow: hidden; display: flex; flex-direction: column;
    }
    .table-responsive { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    thead th {
      padding: 12px 16px; font-size: 13px; font-weight: 600;
      color: #fff; background: #1B5C3A; text-align: center;
      border: 1px solid var(--color-border); white-space: nowrap;
    }
    .header-ficha { text-align: left !important; }
    tbody tr { background: #fff; border-bottom: 1px solid var(--color-border); }
    td { border: 1px solid var(--color-border); vertical-align: top; padding: 12px; }

    /* Ficha Column */
    .col-ficha { width: 220px; min-width: 220px; background: #F9FAFB; }
    .ficha-content { display: flex; flex-direction: column; gap: 4px; position: relative; }
    .ficha-numero { font-size: 15px; font-weight: 600; color: #2E7D52; }
    .ficha-programa { font-size: 12px; color: #6B7280; line-height: 1.3; }
    .actions-row { display: flex; gap: 6px; margin-top: 8px; }
    
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

    /* Day Column */
    .col-day { min-width: 180px; width: calc((100% - 220px) / 6); background: #fff; }

    /* Schedule Card */
    .schedule-card {
      background: #E8F5EE; border-left: 3px solid #2E7D52; color: #1B5C3A;
      border-radius: 6px; padding: 10px; margin-bottom: 8px; cursor: pointer;
      display: flex; flex-direction: column; gap: 4px; transition: transform 0.15s, box-shadow 0.15s;
    }
    .schedule-card:last-child { margin-bottom: 0; }
    .schedule-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
    .schedule-card.transversal { background: #EFF6FF; border-left-color: #3B82F6; color: #1E40AF; }

    .sch-jornada { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }
    .sch-time { font-size: 13px; font-weight: 600; }
    .sch-ficha { font-size: 12px; font-weight: 600; margin-top: 2px; }
    .sch-prog { font-size: 11px; opacity: 0.9; line-height: 1.2; }
    .sch-amb { font-size: 12px; font-weight: 500; margin-top: 4px; }
    .sch-inst { font-size: 11px; font-style: italic; opacity: 0.8; }
    
    .action-btn {
      background: #fff; border: 1px solid var(--color-border); cursor: pointer;
      padding: 6px; border-radius: 6px; display: flex;
      align-items: center; justify-content: center; transition: background 0.15s, color 0.15s;
    }
    .action-btn.edit { color: var(--color-primary); }
    .action-btn.edit:hover { background: #DCFCE7; border-color: var(--color-primary); }
    .action-btn.delete { color: #DC2626; }
    .action-btn.delete:hover { background: #FEE2E2; border-color: #DC2626; }

    .badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; font-weight: 600; }
    .badge.sm { padding: 2px 8px; font-size: 11px; }
    .badge.manana { background: #FEF3C7; color: #B45309; }
    .badge.tarde { background: #E0E7FF; color: #4338CA; }

    .loading-state, .empty-state {
      padding: 48px; text-align: center; color: var(--color-text-muted); font-size: 14px;
    }
    .pagination-footer {
      padding: 12px 16px; border-top: 1px solid var(--color-border);
      display: flex; align-items: center; justify-content: flex-end; background: #fff;
    }
    .page-info { font-size: 13px; color: var(--color-text-muted); }

    /* ─── Modal Shared ─────────────────────────── */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
      z-index: 1000; display: flex;
      align-items: center; justify-content: center; padding: 24px;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-container {
      background: #fff; border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      display: flex; flex-direction: column;
      width: 100%; max-height: 92vh; overflow: hidden;
      animation: popIn 0.22s ease;
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .wide-modal  { max-width: 900px; }
    .form-modal  { max-width: 600px; }
    .confirm-modal { max-width: 440px; }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 24px; border-bottom: 1px solid var(--color-border, #E5E7EB);
      gap: 12px; flex-shrink: 0;
    }
    .modal-title {
      font-size: 17px; font-weight: 600; color: var(--color-text, #111);
      display: flex; align-items: center; gap: 10px; margin: 0;
    }
    .danger-title { color: #DC2626; }
    .modal-subtitle { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
    .modal-close {
      background: none; border: none; cursor: pointer;
      color: var(--color-text-muted); padding: 4px; border-radius: 6px;
      display: flex; align-items: center; transition: background 0.15s;
      flex-shrink: 0;
    }
    .modal-close:hover { background: #F3F4F6; }

    .modal-body-scroll { padding: 20px 24px; overflow-y: auto; flex: 1; }

    .modal-footer {
      padding: 14px 24px; border-top: 1px solid var(--color-border, #E5E7EB);
      display: flex; justify-content: flex-end; gap: 10px;
      background: #F9FAFB; flex-shrink: 0;
    }

    /* ─── Calendar Modal ───────────────────────── */
    .cal-header-meta { display: flex; align-items: center; gap: 12px; }
    .header-btns { display: flex; align-items: center; gap: 8px; }

    .btn-download {
      background: #F3F4F6; border: 1px solid var(--color-border, #E5E7EB);
      color: var(--color-text); padding: 7px 14px; border-radius: 8px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: background 0.15s;
    }
    .btn-download:hover { background: #E5E7EB; }

    .info-strip {
      display: flex; flex-wrap: wrap; gap: 8px;
      padding: 12px 24px; background: #F9FAFB;
      border-bottom: 1px solid var(--color-border, #E5E7EB);
    }
    .info-chip {
      display: flex; align-items: center; gap: 6px;
      background: #fff; border: 1px solid var(--color-border, #E5E7EB);
      border-radius: 20px; padding: 4px 12px; font-size: 13px;
    }
    .chip-label { font-weight: 600; color: var(--color-text-muted); font-size: 11px; text-transform: uppercase; }

    /* ─── Schedule Grid ────────────────────────── */
    .cal-body { overflow: auto; flex: 1; }

    .no-schedule {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 48px; color: var(--color-text-muted); font-size: 15px;
    }

    .schedule-wrapper {
      display: flex; min-width: 700px;
      border-top: 1px solid var(--color-border, #E5E7EB);
    }

    /* Time col */
    .time-col { width: 72px; flex-shrink: 0; background: #F4F6F8; border-right: 1px solid var(--color-border, #E5E7EB); }
    .time-col-header { height: 44px; border-bottom: 1px solid var(--color-border, #E5E7EB); }
    .time-cell {
      height: 60px; display: flex; align-items: flex-start; justify-content: center;
      padding-top: 6px; font-size: 12px; color: #6B7280; font-weight: 500;
      border-bottom: 1px dashed var(--color-border, #E5E7EB);
    }

    /* Day cols */
    .day-col { flex: 1; border-right: 1px solid var(--color-border, #E5E7EB); min-width: 0; }
    .day-col:last-child { border-right: none; }
    .day-header {
      height: 44px; display: flex; align-items: center; justify-content: center;
      background: #1B5C3A; color: #fff; font-size: 13px; font-weight: 600;
      text-transform: uppercase; border-bottom: 1px solid var(--color-border, #E5E7EB);
    }
    .day-slots { background: #fff; }

    /* Event blocks */
    .event-block {
      position: absolute; left: 3px; right: 3px;
      border-radius: 6px; padding: 6px 8px;
      background: #E8F5EE; border-left: 3px solid #2E7D52;
      overflow: hidden; display: flex; flex-direction: column; gap: 2px;
      box-sizing: border-box;
    }
    .sch-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-align: center; margin-top: 4px; width: fit-content; }
    .sch-badge.pendiente { background: #F4F6F8; color: #6B7280; }
    .sch-badge.activa { background: #E8F5EE; color: #1B5C3A; }
    .sch-badge.retraso { background: #FEE2E2; color: #991B1B; }
    .sch-badge.suspendida { background: #FEF08A; color: #854D0E; }
    .sch-badge.finalizada { background: #EFF6FF; color: #1E40AF; }
    .sch-badge.no-asistio { background: #FEE2E2; color: #991B1B; }
    .progress-container { width: 100%; height: 4px; background: #E5E7EB; border-radius: 2px; overflow: hidden; margin-top: 6px; }
    .progress-bar { height: 100%; background: #1B5C3A; transition: width 1s linear; }

    .event-block.transversal {
      background: #EFF6FF; border-left-color: #3B82F6;
    }
    .event-tag  { font-size: 10px; font-weight: 700; color: #3B82F6; text-transform: uppercase; }
    .event-instructor { font-size: 12px; font-weight: 600; color: var(--color-text, #111); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .event-time { font-size: 11px; color: var(--color-text-muted); margin-top: auto; }

    /* ─── Form inside modals ───────────────────── */
    .advanced-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 16px; }
    .form-row .field-group { flex: 1; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 500; color: var(--color-text, #111); }
    .req { color: #DC2626; }
    .field-input {
      padding: 10px 12px; border: 1px solid var(--color-border, #E5E7EB);
      border-radius: 8px; font-size: 14px; outline: none;
      background: #fff; color: var(--color-text, #111);
      width: 100%; box-sizing: border-box; transition: border-color 0.18s, box-shadow 0.18s;
    }
    .field-input:focus { border-color: #2E7D52; box-shadow: 0 0 0 3px rgba(46,125,82,0.1); }
    .field-input:disabled { background: #F3F4F6; opacity: 0.7; }

    .info-alert  { background: #EFF6FF; color: #1E3A8A; padding: 10px 14px; border-radius: 8px; font-size: 13px; border: 1px solid #BFDBFE; }
    .error-alert { background: #FEF2F2; color: #991B1B; padding: 10px 14px; border-radius: 8px; font-size: 13px; border: 1px solid #FCA5A5; }

    /* ─── Footer Buttons ───────────────────────── */
    .btn-cancel {
      background: #F3F4F6; color: #374151; border: none;
      padding: 10px 20px; border-radius: 8px; font-size: 14px;
      font-weight: 500; cursor: pointer; transition: background 0.15s;
    }
    .btn-cancel:hover { background: #E5E7EB; }

    .btn-save {
      background: #2E7D52; color: #fff; border: none;
      padding: 10px 22px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .btn-save:hover:not(:disabled) { background: #1f5c3b; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-danger {
      background: #DC2626; color: #fff; border: none;
      padding: 10px 22px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .btn-danger:hover:not(:disabled) { background: #B91C1C; }
    .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

    .confirm-body { padding: 20px 24px; }
    .confirm-body p { margin: 0 0 10px; font-size: 15px; color: var(--color-text, #111); }
    .confirm-sub { font-size: 13px; color: var(--color-text-muted); }

    /* ─── Monthly Calendar View ────────────────── */
    .date-navigator {
      display: flex; align-items: center; background: #fff; border: 1px solid #E5E7EB;
      border-radius: 8px; overflow: hidden; height: 32px;
    }
    .nav-arrow {
      background: transparent; border: none; padding: 0 8px; height: 100%;
      cursor: pointer; color: #6B7280; transition: background 0.15s, color 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    .nav-arrow:hover { background: #F3F4F6; color: #111; }
    
    .period-display {
      padding: 0 12px; font-size: 13px; font-weight: 600; color: #374151;
      display: flex; align-items: center; justify-content: center; min-width: 130px;
      border-left: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB;
      cursor: pointer; position: relative; height: 100%;
    }
    .period-display:hover { background: #F9FAFB; }
    
    .hidden-date-input {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0; cursor: pointer;
    }

    .view-toggle {
      display: flex; background: #F3F4F6; border-radius: 8px; padding: 4px; border: 1px solid #E5E7EB;
    }
    .view-toggle button {
      background: transparent; border: none; padding: 6px 12px; border-radius: 6px;
      font-size: 13px; font-weight: 500; color: #6B7280; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all 0.2s;
    }
    .view-toggle button:hover { color: #374151; }
    .view-toggle button.active {
      background: #fff; color: #1B5C3A; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600;
    }

    .monthly-wrapper {
      display: flex; flex-direction: column; height: 100%; min-height: 500px;
      border-top: 1px solid var(--color-border, #E5E7EB);
    }
    .month-header-grid {
      display: grid; grid-template-columns: repeat(7, 1fr);
      background: #1B5C3A; color: #fff; text-align: center; font-size: 13px; font-weight: 600;
      text-transform: uppercase; border-bottom: 1px solid var(--color-border, #E5E7EB);
    }
    .month-day-name { padding: 12px 0; }
    .month-grid {
      display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(120px, auto);
      flex: 1; background: #E5E7EB; gap: 1px;
    }
    .month-cell {
      background: #fff; padding: 8px; display: flex; flex-direction: column; gap: 4px;
      transition: background 0.15s; position: relative; z-index: 1;
    }
    .month-cell:hover { background: #F9FAFB; z-index: 10; }
    .month-cell.not-current-month { background: #F9FAFB; }
    .month-cell.not-current-month .month-cell-date { color: #D1D5DB; }
    .month-cell.is-today .month-cell-date {
      background: #2E7D52; color: #fff; border-radius: 50%; width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .month-cell-date { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; align-self: flex-end; }
    
    .month-cell-events { display: flex; flex-direction: column; gap: 4px; }
    .month-event {
      background: #E8F5EE; border-left: 3px solid #2E7D52; border-radius: 4px;
      padding: 6px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 6px;
      transition: transform 0.1s; position: relative;
    }
    .month-event:hover { transform: scale(1.02); box-shadow: 0 2px 4px rgba(0,0,0,0.05); z-index: 20; }
    .month-event.transversal { background: #EFF6FF; border-left-color: #3B82F6; }
    .mevt-time { font-weight: 700; color: #1B5C3A; font-size: 11px; }
    .month-event.transversal .mevt-time { color: #1E40AF; }
    .mevt-title { color: #374151; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
    
    .monthly-tooltip { 
      left: 50%; transform: translateX(-50%) translateY(10px); top: 100%; margin-top: 6px; 
      z-index: 9999; width: 250px; white-space: normal; position: absolute;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .monthly-tooltip::before { top: -7px; left: 50%; transform: translateX(-50%); border-width: 0 7px 7px 7px; border-color: transparent transparent #111827 transparent; }
    .custom-tooltip-container:hover .monthly-tooltip { transform: translateX(-50%) translateY(0); }
  `]
})
export class AdminCursosComponent implements OnInit {
  srv = inject(AdminCursosService);
  horariosSrv = inject(AdminHorariosService);
  private fb = inject(FormBuilder);

  // ─── Search ───────────────────────────────────
  searchTerm = '';
  jornadaFilter = signal('Todas');
  selectedDate = signal(new Date().toISOString().substring(0, 10));
  cdr = inject(ChangeDetectorRef);

  // ─── Modal Flags ──────────────────────────────
  showCalendarModal = signal(false);
  showCreateModal   = signal(false);
  showEditModal     = signal(false);
  showDeleteModal   = signal(false);
  showAddBlockModal = signal(false);
  showEventDetailsModal = signal(false);
  selectedEventDetails = signal<any>(null);
  copied = signal(false);

  // ─── Event Details Modal Methods ──────────────────
  openEventDetails(evt: any, dateStr?: string) {
    this.selectedEventDetails.set({ evt, dateStr });
    this.showEventDetailsModal.set(true);
    this.copied.set(false);
  }
  closeEventDetailsModal() {
    this.showEventDetailsModal.set(false);
    this.selectedEventDetails.set(null);
  }
  copyEventDetails() {
    const el = document.getElementById('event-details-content');
    if (el) {
      const text = el.innerText;
      navigator.clipboard.writeText(text).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }

  // ─── Calendar View Mode ───────────────────────
  calendarViewMode = signal<'weekly' | 'monthly'>('monthly');
  
  displayPeriod = computed(() => {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    if (this.calendarViewMode() === 'monthly') {
      const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    } else {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - (d.getDay() || 7) + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 5);
      return `Semana: ${weekStart.getDate()}/${weekStart.getMonth()+1} - ${weekEnd.getDate()}/${weekEnd.getMonth()+1}`;
    }
  });

  previousPeriod() {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    if (this.calendarViewMode() === 'monthly') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    this.onDateChange(d.toISOString().substring(0, 10));
  }

  nextPeriod() {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    if (this.calendarViewMode() === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    this.onDateChange(d.toISOString().substring(0, 10));
  }
  
  monthlyGrid = computed(() => {
    const dateStr = this.selectedDate();
    const horario = this.srv.horarioDelCurso(); // Creates dependency

    const baseDate = new Date(dateStr + 'T00:00:00');
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    
    // Total days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid: MonthDay[] = [];
    
    // Previous month padding
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
      const pDay = daysInPrevMonth - startingDayOfWeek + i + 1;
      const prevDate = new Date(year, month - 1, pDay);
      grid.push({
        date: pDay,
        fullDate: prevDate.toISOString().substring(0, 10),
        isCurrentMonth: false,
        events: this.getEventsForSpecificDate(prevDate, horario)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(year, month, i);
      grid.push({
        date: i,
        fullDate: curDate.toISOString().substring(0, 10),
        isCurrentMonth: true,
        events: this.getEventsForSpecificDate(curDate, horario)
      });
    }
    
    // Next month padding
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      grid.push({
        date: i,
        fullDate: nextDate.toISOString().substring(0, 10),
        isCurrentMonth: false,
        events: this.getEventsForSpecificDate(nextDate, horario)
      });
    }
    
    return grid;
  });

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // ─── State ────────────────────────────────────
  selectedCurso   = signal<any>(null);
  editingCursoId  = signal<string | null>(null);
  cursoToDelete   = signal<any>(null);
  isSubmitting    = signal(false);
  submitError     = signal('');
  checkingAvailability = signal(false);
  
  addBlockPayload = { dia: 1, hora_inicio: '08:00', hora_fin: '10:00', instructor_id: '' };
  savingBlock = signal(false);

  // Schedule grid
  readonly days       = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  readonly hoursRuler = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];

  cursoForm = this.fb.group({
    id_curso:        ['', Validators.required],
    estado:          ['Activo', Validators.required],
    area_id:         [null as string | null, Validators.required],
    programa_id:     [{ value: null as string | null, disabled: true }, Validators.required],
    fecha_inicio:    ['', Validators.required],
    fecha_fin:       ['', Validators.required],
    fecha_fin_lectiva: [null as string | null],
    jornada:         [null as string | null, Validators.required],
    ambiente_sugerido: [null as string | null],
    lider_id:        [null as string | null]
  });

  // ─── Filtered list ────────────────────────────
  filteredCursos = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    let list = this.srv.cursosList();
    if (this.jornadaFilter() !== 'Todas') {
      list = list.filter(c => c.jornada === this.jornadaFilter());
    }
    if (!term) return list;
    return list.filter(c => {
      const ficha   = String(c.id_curso ?? '').toLowerCase();
      const prog    = (c.programa?.nombre ?? '').toLowerCase();
      const area    = (c.area?.nombre ?? '').toLowerCase();
      const jornada = (c.jornada ?? '').toLowerCase();
      return ficha.includes(term) || prog.includes(term) || area.includes(term) || jornada.includes(term);
    });
  });

  ngOnInit() {
    this.srv.fetchCursos();
    this.srv.fetchAllHorarios();
    this.fetchRegistrosForWeek(this.selectedDate());
    this._setupCascades();
  }

  onDateChange(dateStr: string) {
    this.selectedDate.set(dateStr);
    this.fetchRegistrosForWeek(dateStr);
    
    if (this.calendarViewMode() === 'weekly') {
      this.horariosSrv.fetchRegistrosClasesSemana(dateStr);
    }
    
    this.cdr.detectChanges();
  }

  fetchRegistrosForWeek(dateStr: string) {
    const dates = this.getWeekDates(dateStr);
    this.srv.fetchRegistroClases(dates);
  }

  getWeekDates(dateStr: string): string[] {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay() || 7; 
    const result: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const copy = new Date(d);
      copy.setDate(d.getDate() - day + i);
      result.push(copy.toISOString().substring(0, 10));
    }
    return result;
  }

  getDayName(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return this.days[(d.getDay() || 7) - 1] || '';
  }

  getCursoTooltip(curso: any): string {
    const lider = curso.lider ? `${curso.lider.nombre || ''} ${curso.lider.apellido || ''}`.trim() : 'Sin asignar';
    const inicio = curso.fecha_inicio ? curso.fecha_inicio.substring(0,10) : 'N/A';
    const finLectiva = curso.fin_lectiva ? curso.fin_lectiva.substring(0,10) : 'N/A';
    const finTotal = curso.fecha_fin ? curso.fecha_fin.substring(0,10) : 'N/A';
    return `Ficha: ${curso.id_curso}
Programa: ${curso.programa?.nombre || 'Sin programa'}
Área: ${curso.area?.nombre || 'Sin área'}
Ambiente: ${curso.ambiente?.nombre || 'Sin ambiente'}
Líder: ${lider}
Fechas: ${inicio} (I) -> ${finLectiva} (L) -> ${finTotal} (F)
Jornada: ${curso.jornada}`;
  }

  getInstructorName(evt: any): string {
    if (!evt.instructor) return 'Sin instructor';
    const p = evt.instructor;
    return `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin instructor';
  }

  getBadge(evt: any, dayName: string) {
    const dates = this.getWeekDates(this.selectedDate());
    const dayIndex = this.days.indexOf(dayName);
    const eventDate = dates[dayIndex];
    
    const registro = this.srv.registrosClases().find((r: any) => 
      (r.horario_detalle?.id === evt.id || r.horario_detalle_id === evt.id) && r.fecha?.startsWith(eventDate)
    );

    const now = new Date();
    const currentToday = now.toISOString().split('T')[0];

    if (!registro) {
      if (eventDate < currentToday) {
        return { type: 'No asistio', text: 'No asistió' };
      }
      if (eventDate === currentToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [hStart, mStart] = evt.hora_inicio.split(':');
        const [hEnd, mEnd] = evt.hora_fin.split(':');
        const startMinutes = parseInt(hStart) * 60 + parseInt(mStart);
        const endMinutes = parseInt(hEnd) * 60 + parseInt(mEnd);
        
        if (currentMinutes > endMinutes) {
          return { type: 'No asistio', text: 'No asistió' };
        } else if (currentMinutes > startMinutes) {
          return { type: 'Retraso', text: 'Retraso automático' };
        }
      }
      return { type: 'Pendiente', text: 'Pendiente' };
    }
    
    const evtTimeEnd = new Date(eventDate + 'T' + evt.hora_fin);
    const estadoLower = registro.estado.toLowerCase();
    
    if (estadoLower === 'finalizada' || (estadoLower === 'activa' && now > evtTimeEnd)) {
      return { type: 'Finalizada', text: 'Finalizada' };
    }
    if (estadoLower === 'suspendida') return { type: 'Suspendida', text: 'Suspendida' };
    if (estadoLower === 'no_asistio') return { type: 'No asistio', text: 'No asistió' };
    if (estadoLower === 'activa') {
      if (registro.minutos_retraso && registro.minutos_retraso > 0) {
        return { type: 'Retraso', text: 'Retraso: ' + registro.minutos_retraso + ' min' };
      }
      return { type: 'Activa', text: 'Activa' };
    }
    return { type: 'Pendiente', text: 'Pendiente' };
  }

  private _setupCascades() {
    this.cursoForm.get('area_id')?.valueChanges.subscribe(areaId => {
      if (areaId) {
        this.cursoForm.get('programa_id')?.enable();
        this.srv.fetchProgramas(areaId);
        this.srv.fetchInstructores(areaId);
        this.srv.fetchAmbientesDisponibles({
          area_id: String(areaId),
          jornada:  String(this.cursoForm.value.jornada || ''),
          inicio:   String(this.cursoForm.value.fecha_inicio || ''),
          fin:      String(this.cursoForm.value.fecha_fin_lectiva || '')
        });
      } else {
        this.cursoForm.get('programa_id')?.disable();
        this.srv.ambientesDisponibles.set([]);
      }
    });

    const checkEngine = () => {
      const v = this.cursoForm.value;
      if (v.area_id && v.fecha_inicio && v.fecha_fin_lectiva && v.jornada) {
        this.checkingAvailability.set(true);
        this.srv.fetchAmbientesDisponibles({
          area_id: String(v.area_id),
          jornada:  String(v.jornada),
          inicio:   String(v.fecha_inicio),
          fin:      String(v.fecha_fin_lectiva)
        });
        setTimeout(() => this.checkingAvailability.set(false), 800);
      }
    };
    this.cursoForm.get('fecha_inicio')?.valueChanges.subscribe(checkEngine);
    this.cursoForm.get('fecha_fin_lectiva')?.valueChanges.subscribe(checkEngine);
    this.cursoForm.get('jornada')?.valueChanges.subscribe(checkEngine);
  }

  // ─── Calendar Modal ───────────────────────────
  openCalendarModal(curso: any) {
    this.selectedCurso.set(curso);
    this.showCalendarModal.set(true);
    this.srv.fetchHorarioByCurso(curso.id);
    this.horariosSrv.fetchRegistrosClasesSemana(this.selectedDate());
  }
  closeCalendarModal() { this.showCalendarModal.set(false); }

  setCalendarViewMode(mode: 'weekly' | 'monthly') {
    this.calendarViewMode.set(mode);
  }

  getEventsForSpecificDate(dateObj: Date, horario: any = null): any[] {
    const dayOfWeek = dateObj.getDay(); // 0=Domingo, 1=Lunes, ...
    const detalles = horario?.detalles ?? [];
    const curso = this.selectedCurso();
    
    return detalles
      .filter((d: any) => d.dia === dayOfWeek)
      .filter((d: any) => {
        // Obtenemos las fechas del bloque o usamos las del curso como respaldo
        let startStr = d.fecha_inicio_competencia;
        let endStr = d.fecha_fin_competencia;
        
        if (!startStr && curso?.fecha_inicio) startStr = curso.fecha_inicio;
        if (!endStr && curso?.fin_lectiva) endStr = curso.fin_lectiva;
        else if (!endStr && curso?.fecha_fin) endStr = curso.fecha_fin;

        if (startStr && endStr) {
          const start = new Date(startStr.substring(0, 10) + 'T00:00:00');
          const end = new Date(endStr.substring(0, 10) + 'T23:59:59');
          if (dateObj < start || dateObj > end) return false;
        }
        return true;
      })
      .map((d: any) => ({
        ...d,
        ambienteNombre: horario?.ambiente?.nombre || 'Sin asignar'
      }))
      .sort((a: any, b: any) => a.hora_inicio.localeCompare(b.hora_inicio));
  }
  // ─── Add Block Modal ──────────────────────────
  openAddBlockModal() {
    this.horariosSrv.fetchInstructores();
    this.addBlockPayload = { dia: 1, hora_inicio: '08:00', hora_fin: '10:00', instructor_id: '' };
    this.showAddBlockModal.set(true);
  }
  closeAddBlockModal() {
    this.showAddBlockModal.set(false);
  }
  saveAddBlock() {
    if (!this.addBlockPayload.instructor_id) return;
    const horario = this.srv.horarioDelCurso();
    if (!horario) return;

    this.savingBlock.set(true);
    this.horariosSrv.addHorarioDetalle(horario.id, this.addBlockPayload).subscribe({
      next: () => {
        this.savingBlock.set(false);
        this.closeAddBlockModal();
        // Refresh calendar view
        this.srv.fetchHorarioByCurso(this.selectedCurso().id);
        this.horariosSrv.fetchRegistrosClasesSemana(this.selectedDate());
      },
      error: (e: any) => {
        this.savingBlock.set(false);
        alert(e.error?.message || 'Error al añadir bloque. Revise posibles cruces de horario.');
      }
    });
  }

  getEventsForCursoAndDay(cursoId: string, day: string): any[] {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const horario = this.srv.horariosList().find((h: any) => h.curso?.id === cursoId);
    if (!horario || !horario.detalles) return [];
    
    return horario.detalles
      .filter((d: any) => dayNames[d.dia] === day)
      .map((d: any) => ({
        ...d,
        ambienteNombre: horario.ambiente?.nombre || 'Sin asignar'
      }));
  }

  getEventsForDay(day: string): any[] {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const detalles = this.srv.horarioDelCurso()?.detalles ?? [];
    return detalles
      .filter((d: any) => dayNames[d.dia] === day)
      .map((d: any) => ({
        ...d,
        topPx:    this._hourToTop(d.hora_inicio),
        heightPx: this._hourSpan(d.hora_inicio, d.hora_fin),
      }));
  }

  private _hourToTop(hora: string): number {
    const h = parseInt(hora?.substring(0, 2) ?? '6');
    const m = parseInt(hora?.substring(3, 5) ?? '0');
    return (h - 6) * 60 + m;
  }
  private _hourSpan(inicio: string, fin: string): number {
    return this._hourToTop(fin) - this._hourToTop(inicio);
  }

  formatHour(h: number) { return `${h.toString().padStart(2, '0')}:00`; }

  downloadPdf() {
    const id = this.srv.horarioDelCurso()?.id;
    if (id) this.srv.downloadHorarioPdf(id);
  }

  // ─── Create Modal ─────────────────────────────
  openCreateModal() {
    this.srv.fetchAreas();
    this.srv.fetchInstructores(); // Fetch all initially
    this.cursoForm.reset({ estado: 'Activo' });
    this.cursoForm.get('programa_id')?.disable();
    this.submitError.set('');
    this.showCreateModal.set(true);
  }
  closeModal() { this.showCreateModal.set(false); }

  submitCreate() {
    if (this.cursoForm.invalid) return;
    this.isSubmitting.set(true);
    this.submitError.set('');
    const payload = { ...this.cursoForm.getRawValue(), id_curso: Number(this.cursoForm.value.id_curso) };
    this.srv.crearCurso(payload).subscribe({
      next: () => { this.isSubmitting.set(false); this.closeModal(); this.srv.fetchCursos(); },
      error: (e: any) => {
        this.isSubmitting.set(false);
        this.submitError.set(e.error?.message || 'Error al crear el curso.');
      }
    });
  }

  // ─── Edit Modal ───────────────────────────────
  openEditModal(curso: any, event?: Event) {
    event?.stopPropagation();
    this.srv.fetchAreas();
    this.editingCursoId.set(curso.id);
    this.submitError.set('');

    // Enable programa_id before patching
    this.cursoForm.get('programa_id')?.enable();

    // Load programas and instructores for the area
    if (curso.area?.id) {
      this.srv.fetchProgramas(curso.area.id);
      this.srv.fetchInstructores(curso.area.id);
    } else {
      this.srv.fetchInstructores();
    }

    // Patch form with current values
    this.cursoForm.patchValue({
      id_curso:         String(curso.id_curso),
      estado:           curso.estado || 'Activo',
      area_id:          curso.area?.id ?? null,
      programa_id:      curso.programa?.id ?? null,
      fecha_inicio:     curso.fecha_inicio?.substring(0, 10) ?? '',
      fecha_fin:        curso.fecha_fin?.substring(0, 10) ?? '',
      fecha_fin_lectiva: curso.fin_lectiva?.substring(0, 10) ?? '',
      jornada:          curso.jornada,
      ambiente_sugerido: curso.ambiente?.id ?? null,
      lider_id:         curso.lider?.id ?? null
    });

    this.showEditModal.set(true);
  }
  closeEditModal() { this.showEditModal.set(false); }

  submitEdit() {
    if (this.cursoForm.invalid || !this.editingCursoId()) return;
    this.isSubmitting.set(true);
    this.submitError.set('');
    const payload = { ...this.cursoForm.getRawValue(), id_curso: Number(this.cursoForm.value.id_curso) };
    this.srv.updateCurso(this.editingCursoId()!, payload).subscribe({
      next: () => { this.isSubmitting.set(false); this.closeEditModal(); this.srv.fetchCursos(); },
      error: (e: any) => {
        this.isSubmitting.set(false);
        this.submitError.set(e.error?.message || 'Error al actualizar el curso.');
      }
    });
  }

  // ─── Delete Modal ─────────────────────────────
  openDeleteModal(curso: any, event?: Event) {
    event?.stopPropagation();
    this.cursoToDelete.set(curso);
    this.showDeleteModal.set(true);
  }
  closeDeleteModal() { this.showDeleteModal.set(false); }

  confirmDelete() {
    const curso = this.cursoToDelete();
    if (!curso) return;
    this.isSubmitting.set(true);
    this.srv.deleteCurso(curso.id).subscribe({
      next: () => { this.isSubmitting.set(false); this.closeDeleteModal(); this.srv.fetchCursos(); },
      error: (e: any) => {
        this.isSubmitting.set(false);
        this.closeDeleteModal();
        console.error('Error eliminando curso:', e);
      }
    });
  }
}

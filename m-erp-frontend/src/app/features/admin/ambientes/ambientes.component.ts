import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Building, MapPin, Users, Sun, Moon, Plus, X, Check, AlertCircle, Search, Clock, Download, Calendar, User, CheckCircle, Pencil, Trash2 } from 'lucide-angular';
import { AdminAmbientesService } from '../../../core/services/admin-ambientes.service';

@Component({
  selector: 'app-admin-ambientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <!-- ─── Success Toast ─────────────────────────────────────── -->
    @if (srv.successMessage()) {
      <div class="toast">
        <lucide-icon name="check" [size]="16"></lucide-icon>
        {{ srv.successMessage() }}
      </div>
    }

    <!-- ─── Page ──────────────────────────────────────────────── -->
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Horarios de Ambientes</h1>
          <p class="page-subtitle">Estado de la infraestructura en tiempo real</p>
        </div>
        <button class="btn-primary" id="btn-add-ambiente" (click)="openModal()">
          <lucide-icon name="plus" [size]="16"></lucide-icon> Añadir Ambiente
        </button>
      </div>

      <!-- ─── Toolbar: Filtros ────────────────────────────── -->
      <div class="toolbar" style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
        <div class="search-wrapper" style="flex: 1; min-width: 250px;">
          <lucide-icon name="search" [size]="16" class="search-icon"></lucide-icon>
          <input
            type="text"
            class="search-input"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Buscar por ambiente o área...">
        </div>
        
        <select [ngModel]="jornadaFilter()" (ngModelChange)="jornadaFilter.set($event)" class="field-input" style="width: auto; max-width: 200px;">
          <option value="Todas">Todas las jornadas</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
        </select>
        
        <input type="date" [ngModel]="selectedDate()" (ngModelChange)="onDateChange($event)" class="field-input" style="width: auto;">

        <button class="btn-outline-green" [class.active]="verificandoDisponibilidad()" (click)="toggleVerificar()">
          <lucide-icon name="check-circle" [size]="16"></lucide-icon> Verificar Disponibilidad
        </button>
      </div>

      <!-- ─── Table ───────────────────────────────────────── -->
      <div class="table-card">
        @if (srv.isLoading()) {
          <div class="loading-state">Cargando ambientes...</div>
        } @else {
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th class="header-ambiente" style="min-width: 220px;">Ambiente / Área</th>
                  @for (day of days; track day) {
                    <th [style.background]="day === getDayName(selectedDate()) ? '#2E7D52' : '#1B5C3A'" style="color: white; text-align: center;">
                      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2; gap: 2px;">
                        <span>{{ day }}</span>
                        <span style="font-weight: 400; opacity: 0.9; font-size: 11px; text-transform: none;">{{ getFormattedDateForDay(day) }}</span>
                      </div>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (amb of filteredAmbientes(); track amb.id) {
                  <tr>
                    <!-- Columna 1: Ambiente + Info -->
                    <td class="col-ambiente" style="vertical-align: top; padding: 0;">
                      <div class="ambiente-content">
                        <div class="amb-nombre" style="color: #1B5C3A; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">{{ amb.nombre }}</div>
                        <div class="amb-area" style="color: #6B7280; font-size: 13px; margin-top: 2px;">{{ getAreaName(amb.area) }}</div>
                        <div class="amb-capa" style="color: #9CA3AF; font-size: 12px; margin-top: 4px;">Capacidad: {{ amb.capacidad }} personas</div>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                           <button class="action-btn" title="Editar Ambiente" (click)="openEditModal(amb)" style="padding: 4px; background: none; border: none; color: #2E7D52; cursor: pointer;">
                             <lucide-icon name="pencil" [size]="14"></lucide-icon>
                           </button>
                           <button class="action-btn" title="Eliminar Ambiente" (click)="openDeleteModal(amb)" style="padding: 4px; background: none; border: none; color: #DC2626; cursor: pointer;">
                             <lucide-icon name="trash-2" [size]="14"></lucide-icon>
                           </button>
                        </div>
                      </div>
                    </td>
                    
                    <!-- Columnas 2-7: Días -->
                    @for (day of days; track day) {
                      <td class="col-day" style="vertical-align: top; padding: 0;">
                        @if (getEventsForAmbienteAndDay(amb.id, day).length > 0) {
                          <div style="padding: 8px; display: flex; flex-direction: column; gap: 8px;">
                            @for (evt of getEventsForAmbienteAndDay(amb.id, day); track $index) {
                              <div class="schedule-card custom-tooltip-container" style="background: white; border: 1px solid #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); position: relative;">
                                <div class="sch-time" style="font-weight: 600; font-size: 12px; color: #111;">{{ evt.hora_inicio?.substring(0,5) }} — {{ evt.hora_fin?.substring(0,5) }}</div>
                                <div class="sch-jornada" style="font-size: 11px; color: #6B7280; font-weight: bold; text-transform: uppercase;">{{ evt.curso?.jornada }}</div>
                                <div class="sch-ficha" style="font-size: 11px; font-weight: 500; color: #2E7D52; margin-top: 2px;">Ficha {{ evt.curso?.id_curso }}</div>
                                <div class="sch-prog" style="font-size: 11px; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ evt.curso?.programa?.nombre || 'Sin programa' }}</div>
                                <div class="sch-inst" style="font-size: 11px; color: #6B7280; display: flex; align-items: center; gap: 4px; margin-top: 2px;"><lucide-icon name="user" [size]="10"></lucide-icon> {{ getInstructorName(evt) }}</div>
                                
                                <!-- BADGE DE ESTADO -->
                                @if (getBadge(evt, day); as badge) {
                                  <div class="sch-badge" 
                                       [class.pendiente]="badge.type.toLowerCase() === 'pendiente'"
                                       [class.activa]="badge.type.toLowerCase() === 'activa'"
                                       [class.retraso]="badge.type.toLowerCase() === 'retraso'"
                                       [class.suspendida]="badge.type.toLowerCase() === 'suspendida'"
                                       [class.finalizada]="badge.type.toLowerCase() === 'finalizada'"
                                       [class.no-asistio]="badge.type.toLowerCase() === 'no-asistio'"
                                       style="margin-top: 6px; padding: 4px; border-radius: 4px; font-size: 11px; font-weight: 600; text-align: center;">
                                    {{ badge.text }}
                                  </div>
                                  @if (badge.type.toLowerCase() === 'activa' || badge.type.toLowerCase() === 'retraso') {
                                    <div class="progress-container" style="width: 100%; height: 4px; background: #E5E7EB; border-radius: 2px; overflow: hidden; margin-top: 6px;">
                                      <div class="progress-bar" [style.width.%]="getClassProgress(evt, day)" style="height: 100%; background: #1B5C3A; transition: width 1s linear;"></div>
                                    </div>
                                  }
                                }

                                <div class="custom-tooltip">
                                  <div class="tt-header">
                                    {{ getInstructorName(evt) }}
                                  </div>
                                    <div class="tt-body">
                                      <div><strong>Ficha:</strong> {{ evt.curso?.id_curso }}</div>
                                      <div><strong>Día:</strong> {{ day }} ({{ evt.hora_inicio?.substring(0,5) }} - {{ evt.hora_fin?.substring(0,5) }})</div>
                                      @if (evt.competencia) {
                                        <div style="margin-top: 8px;"><strong>Competencia:</strong><br/>{{ evt.competencia }}</div>
                                        <div style="margin-top: 4px;"><strong>Resultado:</strong><br/>{{ evt.resultado }}</div>
                                        <div style="margin-top: 4px; color: #EAB308;">
                                          <strong>Fecha inicio:</strong> {{ evt.fecha_inicio_competencia }} <br/>
                                          <strong>Fecha fin:</strong> {{ evt.fecha_fin_competencia }}
                                        </div>
                                      }
                                    </div>
                                  </div>
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="empty-cell" style="background: #F0FDF4; height: 100%; min-height: 100px; display: flex; align-items: center; justify-content: center; color: #86EFAC; font-weight: 600; font-size: 13px;">
                            Disponible
                          </div>
                        }
                      </td>
                    }
                  </tr>
                }
                @if (filteredAmbientes().length === 0 && !srv.isLoading()) {
                  <tr>
                    <td colspan="7" class="empty-state">No se encontraron ambientes.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- ─── Modal Confirmar Eliminación ──────────────────────── -->
    @if (showDeleteModal()) {
      <div class="modal-overlay" (click)="closeDeleteModal()">
        <div class="modal-container" style="max-width: 400px; text-align: center; padding: 30px 24px;" (click)="$event.stopPropagation()">
          <div style="background: #FEE2E2; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #DC2626;">
            <lucide-icon name="trash-2" [size]="28"></lucide-icon>
          </div>
          <h2 style="margin: 0 0 10px; font-size: 18px; color: #111;">Eliminar Ambiente</h2>
          <p style="margin: 0 0 24px; color: #6B7280; font-size: 14px; line-height: 1.5;">
            ¿Está seguro de que desea eliminar <strong>{{ ambienteToDelete()?.nombre }}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn-cancel" (click)="closeDeleteModal()" [disabled]="srv.isSaving()" style="flex: 1;">Cancelar</button>
            <button class="btn-save" (click)="confirmDelete()" [disabled]="srv.isSaving()" style="flex: 1; background: #DC2626;">
              @if (srv.isSaving()) { <span class="spinner"></span> } @else { Eliminar }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ─── Modal Crear Ambiente ──────────────────────────────── -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-container" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-header">
            <h2 id="modal-title" class="modal-title">
              <lucide-icon name="building" [size]="20"></lucide-icon>
              {{ isEditMode() ? 'Editar Ambiente' : 'Nuevo Ambiente' }}
            </h2>
            <button class="modal-close" (click)="closeModal()" aria-label="Cerrar modal">
              <lucide-icon name="x" [size]="18"></lucide-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label class="field-label" for="amb-nombre">Nombre del ambiente <span class="required">*</span></label>
              <input id="amb-nombre" type="text" class="field-input" [(ngModel)]="form.nombre" placeholder="Ej. Aula 301" [class.input-error]="formTouched && !form.nombre.trim()">
              @if (formTouched && !form.nombre.trim()) { <span class="field-error"><lucide-icon name="alert-circle" [size]="13"></lucide-icon> Obligatorio</span> }
            </div>
            <div class="field-group">
              <label class="field-label" for="amb-area">Área <span class="required">*</span></label>
              <select id="amb-area" class="field-input" [(ngModel)]="form.area_id" [class.input-error]="formTouched && !form.area_id">
                <option value="">Seleccionar área...</option>
                @for (area of srv.areas(); track area.id) { <option [value]="area.id">{{ area.nombre }}</option> }
              </select>
              @if (formTouched && !form.area_id) { <span class="field-error"><lucide-icon name="alert-circle" [size]="13"></lucide-icon> Selecciona un área</span> }
            </div>
            <div class="field-group">
              <label class="field-label" for="amb-capacidad">Capacidad <span class="required">*</span></label>
              <input id="amb-capacidad" type="number" class="field-input" [(ngModel)]="form.capacidad" placeholder="Ej. 30" min="1" [class.input-error]="formTouched && !(form.capacidad > 0)">
              @if (formTouched && !(form.capacidad > 0)) { <span class="field-error"><lucide-icon name="alert-circle" [size]="13"></lucide-icon> Mayor a 0</span> }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeModal()" [disabled]="srv.isSaving()">Cancelar</button>
            <button class="btn-save" (click)="guardarAmbiente()" [disabled]="srv.isSaving()">
              @if (srv.isSaving()) { <span class="spinner"></span> } @else { <lucide-icon name="check" [size]="16"></lucide-icon> Guardar Ambiente }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; position: relative; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
    .page-title { font-size: 22px; color: var(--color-text); font-weight: 600; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }

    .btn-primary { background: var(--color-primary); color: #fff; border: none; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; font-size: 14px; transition: background 0.2s, transform 0.15s; }
    .btn-primary:hover { background: var(--color-primary-dark); transform: translateY(-1px); }

    .btn-outline { background: #fff; color: #374151; border: 1px solid #D1D5DB; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; font-size: 14px; transition: background 0.2s, border-color 0.2s; }
    .btn-outline:hover { background: #F3F4F6; border-color: #9CA3AF; }

    .btn-outline-green { background: #fff; color: #166534; border: 1px solid #BBF7D0; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; font-size: 14px; transition: all 0.2s; }
    .btn-outline-green:hover { background: #F0FDF4; border-color: #86EFAC; }
    .btn-outline-green.active { background: #DCFCE7; border-color: #22C55E; color: #15803D; }

    .search-wrapper { position: relative; display: flex; align-items: center; flex: 1; max-width: 420px; }
    .search-icon { position: absolute; left: 12px; color: var(--color-text-muted); pointer-events: none; }
    .search-input { width: 100%; padding: 10px 12px 10px 38px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 14px; outline: none; background: var(--color-white); color: var(--color-text); transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
    .search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(46, 125, 82, 0.1); }
    .search-input::placeholder { color: var(--color-text-muted); }

    .field-input { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 8px; font-size: 14px; color: var(--color-text); background: #fff; transition: border-color 0.18s; outline: none; }
    .field-input:focus { border-color: #2E7D52; }

    .table-card { background: var(--color-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); border: 1px solid var(--color-border); overflow: hidden; display: flex; flex-direction: column; }
    .table-responsive { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    thead th { padding: 12px 16px; font-size: 13px; font-weight: 600; color: #fff; background: #1B5C3A; text-align: center; border: 1px solid var(--color-border); white-space: nowrap; }
    .header-ambiente { text-align: left !important; }
    tbody tr { background: #fff; border-bottom: 1px solid var(--color-border); }
    td { border: 1px solid var(--color-border); vertical-align: top; }
    .col-ambiente { position: sticky; left: 0; background: #F9FAFB; z-index: 5; border-right: 2px solid var(--color-border); width: 220px; min-width: 220px; }
    .ambiente-content { 
      display: flex; 
      flex-direction: column; 
      gap: 2px; 
      height: 100%;
      min-height: 80px;
      padding: 12px 16px;
      border-left: 4px solid #1B5C3A;
      background: linear-gradient(90deg, #F0FDF4 0%, #FFFFFF 100%);
    }
    .col-day { min-width: 180px; width: calc((100% - 220px) / 6); background: #fff; }

    .schedule-card { background: #E8F5EE; border-left: 3px solid #2E7D52; color: #1B5C3A; transition: transform 0.15s, box-shadow 0.15s; }
    .schedule-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }

    /* CUSTOM TOOLTIP */
    .custom-tooltip-container { position: relative; }
    .custom-tooltip {
      visibility: hidden;
      opacity: 0;
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      width: 250px;
      z-index: 9999;
      background: #111827;
      color: #F9FAFB;
      padding: 14px;
      border-radius: 8px;
      border: 1px solid #374151;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
      transform: translateX(-50%) translateY(-10px);
      pointer-events: none;
    }
    .custom-tooltip-container:hover .custom-tooltip {
      visibility: visible;
      opacity: 1;
      transform: translateX(-50%) translateY(0);
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

    .sch-badge.pendiente { background: #F4F6F8; color: #6B7280; }
    .sch-badge.activa { background: #E8F5EE; color: #1B5C3A; }
    .sch-badge.retraso { background: #FEE2E2; color: #991B1B; }
    .sch-badge.no-asistio { background: #FEE2E2; color: #991B1B; }
    .sch-badge.suspendida { background: #FEF08A; color: #854D0E; }
    .sch-badge.finalizada { background: #EFF6FF; color: #1E40AF; }

    .loading-state, .empty-state { padding: 48px; text-align: center; color: var(--color-text-muted); font-size: 14px; }

    .toast { position: fixed; top: 24px; right: 24px; background: #2E7D52; color: #fff; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; z-index: 9999; animation: slideIn 0.25s ease; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeOverlay 0.2s ease; }
    @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
    .modal-container { background: #fff; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18); overflow: hidden; animation: popIn 0.22s ease; }
    @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
    .modal-title { font-size: 18px; font-weight: 600; color: #111; display: flex; align-items: center; gap: 10px; margin: 0; }
    .modal-close { background: none; border: none; cursor: pointer; color: #6B7280; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: background 0.15s; }
    .modal-close:hover { background: #F3F4F6; color: #111; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 500; color: #111; }
    .required { color: #DC2626; }
    .input-error { border-color: #DC2626 !important; }
    .field-error { font-size: 12px; color: #DC2626; display: flex; align-items: center; gap: 4px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 0 24px 20px; }
    .btn-cancel { background: #F3F4F6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
    .btn-cancel:hover:not(:disabled) { background: #E5E7EB; }
    .btn-save { background: #2E7D52; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .btn-save:hover:not(:disabled) { background: #1f5c3b; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminAmbientesComponent implements OnInit {
  srv = inject(AdminAmbientesService);
  cdr = inject(ChangeDetectorRef);
  
  searchTerm = signal('');
  jornadaFilter = signal('Todas');
  selectedDate = signal((() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })());
  verificandoDisponibilidad = signal(false);

  showModal = signal(false);
  isEditMode = signal(false);
  editingId = signal<string | null>(null);

  showDeleteModal = signal(false);
  ambienteToDelete = signal<any>(null);

  formTouched = false;
  form = { nombre: '', area_id: '', capacidad: 0 };

  readonly icons = { Building, MapPin, Users, Sun, Moon, Plus, X, Check, AlertCircle, Search, Clock, Download, Calendar, User, CheckCircle, Pencil, Trash2 };
  readonly days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  filteredAmbientes = computed(() => {
    let list = this.srv.ambientesList();
    const term = this.searchTerm().toLowerCase().trim();
    const jornada = this.jornadaFilter();
    const verificar = this.verificandoDisponibilidad();
    
    if (verificar) {
      const currentDayName = this.getDayName(this.selectedDate());
      list = list.filter(amb => {
         const events = this.getEventsForAmbienteAndDay(amb.id, currentDayName);
         return events.length === 0; // Si no hay eventos que pasen el filtro de jornada, está disponible
      });
    }

    if (term) {
      list = list.filter(a => 
        a.nombre.toLowerCase().includes(term) || 
        (typeof a.area === 'object' ? a.area?.nombre : a.area)?.toLowerCase().includes(term)
      );
    }
    
    return list;
  });

  ngOnInit() {
    this.srv.fetchAreas();
    this.srv.fetchAmbientes(null);
    this.srv.fetchAllHorarios();
    this.fetchRegistrosForWeek(this.selectedDate());
  }

  onDateChange(dateStr: string) {
    this.selectedDate.set(dateStr);
    this.fetchRegistrosForWeek(dateStr);
    this.cdr.detectChanges();
  }

  toggleVerificar() {
    this.verificandoDisponibilidad.set(!this.verificandoDisponibilidad());
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
      result.push(`${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, '0')}-${String(copy.getDate()).padStart(2, '0')}`);
    }
    return result;
  }

  getDayName(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return this.days[(d.getDay() || 7) - 1] || '';
  }

  getFormattedDateForDay(day: string): string {
    const dates = this.getWeekDates(this.selectedDate());
    const idx = this.days.indexOf(day);
    if (idx < 0) return '';
    const parts = dates[idx].split('-');
    return `${parts[2]}/${parts[1]}`;
  }

  getEventsForAmbienteAndDay(ambienteId: string, day: string): any[] {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const horarios = this.srv.horariosList().filter((h: any) => h.ambiente?.id === ambienteId);
    
    const dates = this.getWeekDates(this.selectedDate());
    const dayIndex = dayNames.indexOf(day);
    const eventDateStr = dates[dayIndex];
    if (!eventDateStr) return [];
    const eventDate = new Date(eventDateStr + 'T00:00:00');

    let events: any[] = [];
    for (const h of horarios) {
      if (!h.detalles) continue;
      
      const curso = h.curso;
      if (curso?.fecha_inicio && curso?.fecha_fin_lectiva) {
         const cStart = new Date(curso.fecha_inicio + 'T00:00:00');
         const cEnd = new Date(curso.fecha_fin_lectiva + 'T23:59:59');
         if (eventDate < cStart || eventDate > cEnd) continue;
      }

      const dayDetalles = h.detalles.filter((d: any) => dayNames[d.dia] === day);
      for (const d of dayDetalles) {
        events.push({
          ...d,
          curso: h.curso
        });
      }
    }
    
    if (this.jornadaFilter() !== 'Todas') {
      events = events.filter(e => e.curso?.jornada === this.jornadaFilter());
    }

    return events;
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
    const [yyyyStr, mmStr, ddStr] = eventDate.split('-');
    const [hEnd, mEnd, sEnd] = (evt.hora_fin || '00:00:00').split(':');
    const evtTimeEnd = new Date(Number(yyyyStr), Number(mmStr) - 1, Number(ddStr), Number(hEnd), Number(mEnd), Number(sEnd || 0));

    if (!registro) {
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const currentToday = `${yyyy}-${mm}-${dd}`;
      const [hStart, mStart, sStart] = (evt.hora_inicio || '00:00:00').split(':');
      const evtTimeStart = new Date(Number(yyyyStr), Number(mmStr) - 1, Number(ddStr), Number(hStart), Number(mStart), Number(sStart || 0));

      if (eventDate < currentToday) {
         return { type: 'No-asistio', text: 'No asistió' };
      }
      if (eventDate === currentToday) {
         if (now > evtTimeEnd) return { type: 'No-asistio', text: 'No asistió' };
         if (now > evtTimeStart) return { type: 'Retraso', text: 'Retraso automático' };
      }
      return { type: 'Pendiente', text: 'Pendiente' };
    }
    
    if (registro.estado.toLowerCase() === 'no_asistio') return { type: 'No-asistio', text: 'No asistió' };
    
    if (registro.estado.toLowerCase() === 'finalizada' || (registro.estado.toLowerCase() === 'activa' && now > evtTimeEnd)) return { type: 'Finalizada', text: 'Clase finalizada' };
    if (registro.estado.toLowerCase() === 'suspendida') return { type: 'Suspendida', text: 'Clase suspendida' };
    if (registro.estado.toLowerCase() === 'activa' && registro.minutos_retraso > 0) return { type: 'Retraso', text: `Retraso: ${registro.minutos_retraso} min` };
    if (registro.estado.toLowerCase() === 'activa') return { type: 'Activa', text: 'Activa' };
    return { type: 'Pendiente', text: 'Pendiente' };
  }

  getClassProgress(evt: any, dayName: string): number {
    const dates = this.getWeekDates(this.selectedDate());
    const dayIndex = this.days.indexOf(dayName);
    if (dayIndex === -1) return 0;
    
    const eventDate = dates[dayIndex];
    const [yyyyStr, mmStr, ddStr] = eventDate.split('-');
    const [hStart, mStart, sStart] = (evt.hora_inicio || '00:00:00').split(':');
    const [hEnd, mEnd, sEnd] = (evt.hora_fin || '00:00:00').split(':');
    
    const start = new Date(Number(yyyyStr), Number(mmStr) - 1, Number(ddStr), Number(hStart), Number(mStart), Number(sStart || 0)).getTime();
    const end = new Date(Number(yyyyStr), Number(mmStr) - 1, Number(ddStr), Number(hEnd), Number(mEnd), Number(sEnd || 0)).getTime();
    const now = new Date().getTime();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  openModal() {
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.form = { nombre: '', area_id: '', capacidad: 0 };
    this.formTouched = false;
    this.showModal.set(true);
  }

  openEditModal(amb: any) {
    this.isEditMode.set(true);
    this.editingId.set(amb.id);
    const areaId = typeof amb.area === 'object' ? (amb.area?.id || '') : '';
    this.form = { 
      nombre: amb.nombre, 
      area_id: areaId, 
      capacidad: amb.capacidad 
    };
    this.formTouched = false;
    this.showModal.set(true);
  }

  openDeleteModal(amb: any) {
    this.ambienteToDelete.set(amb);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    if (this.srv.isSaving()) return;
    this.showDeleteModal.set(false);
    this.ambienteToDelete.set(null);
  }

  confirmDelete() {
    const amb = this.ambienteToDelete();
    if (!amb) return;
    this.srv.deleteAmbiente(amb.id).subscribe({
      next: () => {
        this.srv.isSaving.set(false);
        this.closeDeleteModal();
        this.srv.showSuccess('Ambiente eliminado exitosamente');
        this.srv.fetchAmbientes(null);
      },
      error: () => {
        this.srv.isSaving.set(false);
      }
    });
  }

  closeModal() {
    if (this.srv.isSaving()) return;
    this.showModal.set(false);
  }

  guardarAmbiente() {
    this.formTouched = true;

    const { nombre, area_id, capacidad } = this.form;
    if (!nombre.trim() || !area_id || !(capacidad > 0)) return;

    const payload = {
      nombre: nombre.trim(),
      area_id,
      capacidad: Number(capacidad)
    };

    if (this.isEditMode() && this.editingId()) {
      this.srv.updateAmbiente(this.editingId()!, payload).subscribe({
        next: () => {
          this.srv.isSaving.set(false);
          this.showModal.set(false);
          this.srv.showSuccess('Ambiente actualizado exitosamente');
          this.srv.fetchAmbientes(null);
        },
        error: () => {
          this.srv.isSaving.set(false);
        }
      });
    } else {
      this.srv.createAmbiente(payload).subscribe({
        next: () => {
          this.srv.isSaving.set(false);
          this.showModal.set(false);
          this.srv.showSuccess('Ambiente creado exitosamente');
          this.srv.fetchAmbientes(null);
        },
        error: () => {
          this.srv.isSaving.set(false);
        }
      });
    }
  }

  getAreaName(area: any): string {
    if (!area) return 'Toda la Sede';
    if (typeof area === 'string') return area;
    return area.nombre ?? 'Toda la Sede';
  }
}

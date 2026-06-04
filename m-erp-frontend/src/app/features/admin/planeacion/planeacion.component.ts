import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, GanttChartSquare, CalendarOff, Filter, User, Clock, CheckCircle, FileText, BookOpen, Search } from 'lucide-angular';
import { AdminHorariosService } from '../../../core/services/admin-horarios.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-planeacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Planeación Pedagógica Anual</h1>
          <p class="page-subtitle">Seguimiento 360: Fichas e Instructores</p>
        </div>
      </div>

      <!-- TABS -->
      <div class="tabs-container">
        <button [class.active]="activeTab() === 'Fichas'" (click)="activeTab.set('Fichas')">
          <lucide-icon name="calendar-days" [size]="16"></lucide-icon> Vista por Fichas
        </button>
        <button [class.active]="activeTab() === 'Instructores'" (click)="activeTab.set('Instructores')">
          <lucide-icon name="user" [size]="16"></lucide-icon> Vista por Instructores
        </button>
      </div>

      <!-- TAB: FICHAS -->
      @if (activeTab() === 'Fichas') {
        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group">
              <label>Área Funcional</label>
              <select class="field-input" [ngModel]="filterArea()" (ngModelChange)="filterArea.set($event); onAreaChange()">
                <option value="">Todas las áreas</option>
                @for (area of areas(); track area) {
                  <option [value]="area">{{ area }}</option>
                }
              </select>
            </div>
            
            <div class="filter-group">
              <label>Programa</label>
              <select class="field-input" [ngModel]="filterPrograma()" (ngModelChange)="filterPrograma.set($event); onProgramaChange()" [disabled]="!filterArea()">
                <option value="">Todos los programas</option>
                @for (prog of programas(); track prog) {
                  <option [value]="prog">{{ prog }}</option>
                }
              </select>
            </div>

            <div class="filter-group">
              <label>Ficha / Curso</label>
              <select class="field-input" [ngModel]="filterFicha()" (ngModelChange)="filterFicha.set($event)" [disabled]="!filterPrograma()">
                <option value="">Todas las fichas</option>
                @for (f of fichas(); track f) {
                  <option [value]="f">Ficha {{ f }}</option>
                }
              </select>
            </div>

            <div class="filter-group">
              <label>Año</label>
              <select class="field-input" [ngModel]="filterYear()" (ngModelChange)="filterYear.set($event)">
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <div class="filter-group" style="justify-content: flex-end; padding-bottom: 2px;">
              <button class="btn-primary" (click)="aplicarFiltros()">Aplicar Filtros</button>
            </div>
          </div>
        </div>

        <div class="gantt-card">
          @if (ganttRows().length === 0) {
            <div class="empty-state">
              <lucide-icon name="calendar-off" [size]="48" color="#9CA3AF"></lucide-icon>
              <h3 class="empty-title">No hay competencias registradas</h3>
              <p class="empty-sub">Los instructores deben agregar competencias desde su módulo Mi Horario</p>
            </div>
          } @else {
            <div class="gantt-wrapper">
              <div class="gantt-header">
                <div class="g-cell fixed-col">Ficha / Programa</div>
                <div class="g-months">
                  @for (m of months; track m) {
                    <div class="m-header">{{ m }}</div>
                  }
                </div>
              </div>
              
              <div class="gantt-body">
                @for (row of ganttRows(); track row.id; let i = $index) {
                  <div class="gantt-row" [class.alt-bg]="i % 2 !== 0">
                    <div class="g-cell fixed-col">
                      <div class="f-name">Ficha {{ row.ficha }}</div>
                      <div class="p-name">{{ row.programa }}</div>
                    </div>
                    
                    <div class="g-months-grid">
                      @for (m of months; track m) {
                        <div class="m-col"></div>
                      }
                      
                      <div class="g-bar"
                           (click)="openModal(row)"
                           [style.grid-column]="row.colStart + ' / span ' + row.colSpan"
                           [style.background-color]="row.color">
                        <span class="bar-text">{{ row.competencia }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB: INSTRUCTORES -->
      @if (activeTab() === 'Instructores') {
        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group" style="flex: 2;">
              <label>Seleccionar Instructor</label>
              <select class="field-input" [ngModel]="selectedInstructorId()" (ngModelChange)="selectedInstructorId.set($event)">
                <option value="">Seleccione un instructor...</option>
                @for (inst of srv.instructores(); track inst.id) {
                  <option [value]="inst.persona_id || inst.id">{{ inst.nombre }} {{ inst.apellido }}</option>
                }
              </select>
            </div>
            <div class="filter-group">
              <label>Período de Análisis</label>
              <select class="field-input" [ngModel]="timeFilter()" (ngModelChange)="timeFilter.set($event)">
                <option value="month">Este Mes</option>
                <option value="semester">Este Semestre</option>
                <option value="year">Todo el Año</option>
              </select>
            </div>
            <div class="filter-group" style="flex: 0; justify-content: flex-end; padding-bottom: 2px;">
              <button class="btn-primary" (click)="onInstructorChange()" [disabled]="!selectedInstructorId()">
                <lucide-icon name="search" [size]="16" style="margin-right: 6px; vertical-align: text-bottom;"></lucide-icon>Aplicar
              </button>
            </div>
          </div>
        </div>

        @if (dataLoadedFor() === selectedInstructorId() && selectedInstructorId() !== '') {
          <div class="dashboard-grid">
            <div class="dash-card primary">
              <div class="dash-icon"><lucide-icon name="clock" [size]="24"></lucide-icon></div>
              <div class="dash-info">
                <h3>{{ instructorMetrics().horasEjecutadas.toFixed(1) }} hrs</h3>
                <p>Horas Ejecutadas ({{ timeFilterLabel() }})</p>
              </div>
            </div>

            <div class="dash-card success">
              <div class="dash-icon"><lucide-icon name="check-circle" [size]="24"></lucide-icon></div>
              <div class="dash-info">
                <h3>{{ instructorMetrics().tasaAsistencia.toFixed(1) }}%</h3>
                <p>Tasa de Asistencia ({{ instructorMetrics().clasesRealizadas }}/{{ instructorMetrics().clasesProgramadas }} clases)</p>
              </div>
            </div>

            <div class="dash-card warning">
              <div class="dash-icon"><lucide-icon name="file-text" [size]="24"></lucide-icon></div>
              <div class="dash-info">
                <h3>{{ instructorMetrics().solicitudes }}</h3>
                <p>Solicitudes de Cambio</p>
              </div>
            </div>

            <div class="dash-card info">
              <div class="dash-icon"><lucide-icon name="book-open" [size]="24"></lucide-icon></div>
              <div class="dash-info">
                <h3>{{ instructorMetrics().programas.length }}</h3>
                <p>Programas Activos</p>
              </div>
            </div>
          </div>

          <div class="gantt-card" style="padding: 24px; min-height: unset;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #111;">Programas Técnicos / Tecnológicos</h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              @for (prog of instructorMetrics().programas; track prog) {
                <span style="background: #E0F2FE; color: #0369A1; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">
                  {{ prog }}
                </span>
              }
              @if (instructorMetrics().programas.length === 0) {
                <span style="color: #6B7280; font-size: 13px;">No hay programas activos.</span>
              }
            </div>
          </div>

          <div class="gantt-card">
            <div class="gantt-header" style="padding: 16px;">
              <span style="font-weight: 600; color: #111; text-transform: none; font-size: 16px;">Competencias Asignadas</span>
            </div>
            <div style="width: 100%; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                <thead>
                  <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB; text-align: left; font-size: 12px; color: #6B7280;">
                    <th style="padding: 12px 16px;">Ficha</th>
                    <th style="padding: 12px 16px;">Líder de Ficha</th>
                    <th style="padding: 12px 16px;">Competencia</th>
                    <th style="padding: 12px 16px;">Fecha Inicio</th>
                    <th style="padding: 12px 16px;">Fecha Fin</th>
                    <th style="padding: 12px 16px;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (comp of instructorMetrics().competencias; track comp.competencia + comp.ficha) {
                    <tr style="border-bottom: 1px solid #F3F4F6; font-size: 13px;">
                      <td style="padding: 12px 16px; font-weight: 600; color: #111;">{{ comp.ficha }}</td>
                      <td style="padding: 12px 16px; color: #374151;">{{ comp.lider }}</td>
                      <td style="padding: 12px 16px; color: #374151;">{{ comp.competencia }}</td>
                      <td style="padding: 12px 16px; color: #4B5563;">{{ comp.fecha_inicio }}</td>
                      <td style="padding: 12px 16px; color: #4B5563;">{{ comp.fecha_fin }}</td>
                      <td style="padding: 12px 16px;">
                        <span [style.background]="getCompStatus(comp.fecha_fin) === 'Activa' ? '#DCFCE7' : '#F1F5F9'"
                              [style.color]="getCompStatus(comp.fecha_fin) === 'Activa' ? '#166534' : '#475569'"
                              style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                          {{ getCompStatus(comp.fecha_fin) }}
                        </span>
                      </td>
                    </tr>
                  }
                  @if (instructorMetrics().competencias.length === 0) {
                    <tr>
                      <td colspan="6" style="padding: 24px; text-align: center; color: #6B7280;">No hay competencias asignadas en el período.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      <!-- DETAILS MODAL -->
      @if (selectedRow()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Detalle de Competencia</h2>
              <button class="btn-close" (click)="closeModal()">
                <lucide-icon name="x" [size]="20"></lucide-icon>
              </button>
            </div>
            <div class="modal-body">
              <div class="info-group">
                <span class="info-label">Área Funcional</span>
                <span class="tt-badge" [style.background-color]="selectedRow().color">{{ selectedRow().area }}</span>
              </div>
              
              <div class="info-group">
                <span class="info-label">Competencia</span>
                <span class="info-value"><strong>{{ selectedRow().competencia }}</strong></span>
              </div>
              
              <div class="info-group">
                <span class="info-label">Resultado de Aprendizaje</span>
                <span class="info-value">{{ selectedRow().resultado }}</span>
              </div>
              
              <div class="info-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px;">
                <div class="info-group">
                  <span class="info-label">Instructor</span>
                  <span class="info-value">{{ selectedRow().instructor }}</span>
                </div>
                <div class="info-group">
                  <span class="info-label">Fechas</span>
                  <span class="info-value">{{ selectedRow().fecha_inicio }} <br>al {{ selectedRow().fecha_fin }}</span>
                </div>
              </div>
              <div class="info-group" style="margin-top: 8px;">
                <span class="info-label">Instructor Líder de Ficha</span>
                <span class="info-value">{{ selectedRow().lider }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px; background: #F4F6F8; min-height: 100vh; }
    .page-header { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .page-title { font-size: 22px; color: #111; font-weight: 600; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 14px; color: #6B7280; margin: 0; }

    .tabs-container { display: flex; gap: 8px; border-bottom: 1px solid #E5E7EB; margin-bottom: 8px; }
    .tabs-container button { background: transparent; border: none; padding: 12px 16px; font-weight: 600; color: #6B7280; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    .tabs-container button:hover { color: #2E7D52; }
    .tabs-container button.active { color: #2E7D52; border-bottom-color: #2E7D52; }

    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .dash-card { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; gap: 16px; align-items: center; border-left: 4px solid transparent; }
    .dash-card.primary { border-left-color: #3B82F6; }
    .dash-card.primary .dash-icon { background: #EFF6FF; color: #3B82F6; }
    .dash-card.success { border-left-color: #10B981; }
    .dash-card.success .dash-icon { background: #ECFDF5; color: #10B981; }
    .dash-card.warning { border-left-color: #F59E0B; }
    .dash-card.warning .dash-icon { background: #FFFBEB; color: #F59E0B; }
    .dash-card.info { border-left-color: #6366F1; }
    .dash-card.info .dash-icon { background: #EEF2FF; color: #6366F1; }
    .dash-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .dash-info h3 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #111; }
    .dash-info p { margin: 0; font-size: 12px; color: #6B7280; font-weight: 500; }

    .filters-card { background: #fff; padding: 20px 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .filters-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end; }
    .filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; }
    .filter-group label { font-size: 12px; font-weight: 600; color: #374151; }
    .field-input { padding: 10px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 13px; color: #111; background: #fff; outline: none; width: 100%; box-sizing: border-box; }
    .field-input:focus { border-color: #2E7D52; }
    .field-input:disabled { background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; }
    
    .btn-primary { background: #2E7D52; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; height: 40px; display: flex; align-items: center; justify-content: center; }
    .btn-primary:hover { background: #1B5C3A; }
    .btn-primary:disabled { background: #9CA3AF; cursor: not-allowed; }

    .gantt-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden; min-height: 400px; }
    
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
    .empty-title { font-size: 18px; font-weight: 600; color: #374151; margin: 16px 0 8px; }
    .empty-sub { font-size: 14px; color: #6B7280; margin: 0; max-width: 400px; }

    .gantt-wrapper { width: 100%; overflow-x: auto; display: flex; flex-direction: column; }
    .gantt-header { display: flex; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; font-weight: 600; font-size: 12px; color: #4B5563; text-transform: uppercase; }
    .g-cell.fixed-col { width: 220px; min-width: 220px; padding: 16px; border-right: 1px solid #E5E7EB; display: flex; flex-direction: column; justify-content: center; }
    .g-months { flex: 1; display: grid; grid-template-columns: repeat(12, 1fr); min-width: 800px; }
    .m-header { padding: 16px 8px; text-align: center; border-right: 1px solid #E5E7EB; }
    .m-header:last-child { border-right: none; }

    .gantt-body { display: flex; flex-direction: column; }
    .gantt-row { display: flex; border-bottom: 1px solid #F3F4F6; }
    .gantt-row.alt-bg { background: #F8FAFC; }
    .gantt-row:hover { background: #F1F5F9; }
    
    .f-name { font-size: 13px; font-weight: 600; color: #111; }
    .p-name { font-size: 11px; color: #6B7280; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .g-months-grid { flex: 1; display: grid; grid-template-columns: repeat(12, 1fr); min-width: 800px; position: relative; }
    .m-col { border-right: 1px dashed #E5E7EB; }
    .m-col:last-child { border-right: none; }

    .g-bar { 
      position: absolute; 
      top: 12px; 
      height: 32px; 
      border-radius: 6px; 
      display: flex; 
      align-items: center; 
      padding: 0 10px; 
      color: white; 
      font-size: 12px; 
      font-weight: 500; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
      cursor: pointer; 
      z-index: 10;
      width: calc(100% - 8px);
      margin: 0 4px;
      transition: transform 0.2s, filter 0.2s;
    }
    .g-bar:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
    .bar-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; display: block; }

    /* MODAL STYLES */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(2px); }
    .modal-card { background: #fff; width: 100%; max-width: 500px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-header h2 { margin: 0; font-size: 18px; color: #111; font-weight: 600; line-height: 1.3; }
    .btn-close { background: transparent; border: none; cursor: pointer; color: #6B7280; padding: 4px; border-radius: 4px; transition: background 0.2s; display: flex; }
    .btn-close:hover { background: #F3F4F6; color: #111; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .info-group { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 14px; color: #111; line-height: 1.5; }
    .tt-badge { padding: 6px 10px; border-radius: 6px; color: white; font-size: 12px; font-weight: 600; display: inline-block; width: fit-content; }
  `]
})
export class AdminPlaneacionComponent implements OnInit {
  srv = inject(AdminHorariosService);
  cdr = inject(ChangeDetectorRef);
  http = inject(HttpClient);

  selectedRow = signal<any>(null);

  months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Tab state
  activeTab = signal<'Fichas' | 'Instructores'>('Fichas');

  // Instructor 360 state
  selectedInstructorId = signal<string>('');
  timeFilter = signal<'month' | 'semester' | 'year'>('month');
  instructorRegistros = signal<any[]>([]);
  instructorSolicitudes = signal<number>(0);
  dataLoadedFor = signal<string>('');

  filterArea = signal<string>('');
  filterPrograma = signal<string>('');
  filterFicha = signal<string>('');
  filterYear = signal<string>(new Date().getFullYear().toString());

  appliedFilters = signal<any>({ area: '', programa: '', ficha: '', year: new Date().getFullYear().toString() });

  ngOnInit() {
    this.srv.fetchHorarios();
    this.srv.fetchInstructores(); // Ensure we have the instructors list
  }

  // Cascading logic for Fichas
  areas = computed(() => {
    const list = this.srv.schedulesList();
    const unique = new Set<string>();
    list.forEach(h => {
      if (h.curso?.area?.nombre) unique.add(h.curso.area.nombre);
    });
    return Array.from(unique).sort();
  });

  programas = computed(() => {
    const list = this.srv.schedulesList();
    const area = this.filterArea();
    if (!area) return [];
    const unique = new Set<string>();
    list.forEach(h => {
      if (h.curso?.area?.nombre === area && h.curso?.programa?.nombre) {
        unique.add(h.curso.programa.nombre);
      }
    });
    return Array.from(unique).sort();
  });

  fichas = computed(() => {
    const list = this.srv.schedulesList();
    const prog = this.filterPrograma();
    if (!prog) return [];
    const unique = new Set<string>();
    list.forEach(h => {
      if (h.curso?.programa?.nombre === prog && h.curso?.id_curso) {
        unique.add(h.curso.id_curso.toString());
      }
    });
    return Array.from(unique).sort();
  });

  onAreaChange() {
    this.filterPrograma.set('');
    this.filterFicha.set('');
  }

  onProgramaChange() {
    this.filterFicha.set('');
  }

  openModal(row: any) {
    this.selectedRow.set(row);
  }

  closeModal() {
    this.selectedRow.set(null);
  }

  aplicarFiltros() {
    this.appliedFilters.set({
      area: this.filterArea(),
      programa: this.filterPrograma(),
      ficha: this.filterFicha(),
      year: this.filterYear()
    });
    this.cdr.detectChanges();
  }

  getAreaColor(area: string): string {
    const a = area?.toLowerCase() || '';
    if (a.includes('tic') || a.includes('sistemas') || a.includes('software')) return '#2E7D52';
    if (a.includes('agropecuario') || a.includes('agrícola')) return '#D97706';
    if (a.includes('turismo') || a.includes('hotel')) return '#0369A1';
    if (a.includes('ambiental') || a.includes('ambiente')) return '#059669';
    if (a.includes('construcción') || a.includes('obras')) return '#7C3AED';
    return '#6B7280';
  }

  ganttRows = computed(() => {
    const list = this.srv.schedulesList();
    const f = this.appliedFilters();
    const year = f.year;
    
    let rows: any[] = [];

    list.forEach(h => {
      if (f.area && h.curso?.area?.nombre !== f.area) return;
      if (f.programa && h.curso?.programa?.nombre !== f.programa) return;
      if (f.ficha && h.curso?.id_curso?.toString() !== f.ficha) return;
      if (!h.detalles) return;

      const compMap = new Map<string, any>();

      h.detalles.forEach((det: any) => {
        if (!det.competencia || !det.fecha_inicio_competencia || !det.fecha_fin_competencia) return;
        
        if (!det.fecha_inicio_competencia.startsWith(year) && !det.fecha_fin_competencia.startsWith(year)) return;

        const key = det.competencia;
        if (!compMap.has(key)) {
          let sMonth = parseInt(det.fecha_inicio_competencia.split('-')[1], 10);
          let eMonth = parseInt(det.fecha_fin_competencia.split('-')[1], 10);
          
          if (det.fecha_inicio_competencia.split('-')[0] < year) sMonth = 1;
          if (det.fecha_fin_competencia.split('-')[0] > year) eMonth = 12;

          const colStart = sMonth;
          const colSpan = (eMonth - sMonth) + 1;

          compMap.set(key, {
            id: det.id,
            ficha: h.curso?.id_curso,
            programa: h.curso?.programa?.nombre || 'Sin programa',
            area: h.curso?.area?.nombre || 'General',
            lider: h.curso?.lider ? `${h.curso.lider.nombre} ${h.curso.lider.apellido || ''}` : 'No asignado',
            competencia: det.competencia,
            resultado: det.resultado,
            instructor: det.instructor ? `${det.instructor.nombre} ${det.instructor.apellido || ''}` : 'Pendiente',
            fecha_inicio: det.fecha_inicio_competencia,
            fecha_fin: det.fecha_fin_competencia,
            colStart: colStart > 0 ? colStart : 1,
            colSpan: colSpan > 0 ? colSpan : 1,
            color: this.getAreaColor(h.curso?.area?.nombre)
          });
        }
      });

      compMap.forEach(val => rows.push(val));
    });

    return rows.sort((a, b) => a.colStart - b.colStart);
  });

  // --- Instructor 360 Logic ---

  timeFilterLabel = computed(() => {
    const f = this.timeFilter();
    if (f === 'month') return 'Este Mes';
    if (f === 'semester') return 'Este Semestre';
    return 'Este Año';
  });

  onInstructorChange() {
    if (!this.selectedInstructorId()) return;
    
    const now = new Date();
    let start = '';
    let end = '';
    
    if (this.timeFilter() === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().substring(0, 10);
    } else if (this.timeFilter() === 'semester') {
      const sem = now.getMonth() < 6 ? 0 : 1;
      start = new Date(now.getFullYear(), sem * 6, 1).toISOString().substring(0, 10);
      end = new Date(now.getFullYear(), sem * 6 + 6, 0).toISOString().substring(0, 10);
    } else {
      start = new Date(now.getFullYear(), 0, 1).toISOString().substring(0, 10);
      end = new Date(now.getFullYear(), 11, 31).toISOString().substring(0, 10);
    }

    this.http.get<any[]>(`http://localhost:3000/api/erp/v1/horarios/registro-clases/instructor/${this.selectedInstructorId()}?fechaInicio=${start}&fechaFin=${end}`)
      .subscribe(res => {
         this.instructorRegistros.set(res || []);
      });

    this.http.get<any[]>(`http://localhost:3000/api/erp/v1/solicitudes`)
      .subscribe(res => {
         const mySols = (res || []).filter(s => s.instructor?.id === this.selectedInstructorId() && s.fecha_solicitud >= start && s.fecha_solicitud <= end);
         this.instructorSolicitudes.set(mySols.length);
      });

    this.dataLoadedFor.set(this.selectedInstructorId());
  }

  getCompStatus(fechaFin: string): string {
    const end = new Date(fechaFin + 'T23:59:59');
    return end < new Date() ? 'Finalizada' : 'Activa';
  }

  instructorMetrics = computed(() => {
    const registros = this.instructorRegistros();
    
    let horasEjecutadas = 0;
    let clasesProgramadas = registros.length;
    let clasesRealizadas = 0;

    registros.forEach(r => {
       if (r.estado === 'finalizada' || r.estado === 'finalizado') {
          clasesRealizadas++;
          if (r.horario_detalle) {
            const tStart = new Date(`1970-01-01T${r.horario_detalle.hora_inicio}`);
            const tEnd = new Date(`1970-01-01T${r.horario_detalle.hora_fin}`);
            let diff = (tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60);
            if (diff > 0) horasEjecutadas += diff;
          }
       }
    });

    const tasaAsistencia = clasesProgramadas > 0 ? (clasesRealizadas / clasesProgramadas) * 100 : 0;

    // Gather programs and competencies from Schedules (since registro_clase might not have program info directly)
    // Actually, we can get this from this.srv.schedulesList() by filtering by instructor
    const allSchedules = this.srv.schedulesList();
    const instId = this.selectedInstructorId();
    
    const progSet = new Set<string>();
    const compMap = new Map<string, any>();

    const now = new Date();
    let yStart = now.getFullYear();
    let mStart = this.timeFilter() === 'month' ? now.getMonth() + 1 : this.timeFilter() === 'semester' ? (now.getMonth() < 6 ? 1 : 7) : 1;
    let mEnd = this.timeFilter() === 'month' ? now.getMonth() + 1 : this.timeFilter() === 'semester' ? (now.getMonth() < 6 ? 6 : 12) : 12;
    
    const strStart = `${yStart}-${mStart.toString().padStart(2, '0')}-01`;
    const strEnd = `${yStart}-${mEnd.toString().padStart(2, '0')}-31`;

    allSchedules.forEach(h => {
       if (!h.detalles) return;
       h.detalles.forEach((det: any) => {
          if (det.instructor?.id?.toString() === instId?.toString()) {
             // Date overlap logic
             if (det.fecha_fin_competencia >= strStart && det.fecha_inicio_competencia <= strEnd) {
                if (h.curso?.programa?.nombre) progSet.add(h.curso.programa.nombre);
                if (det.competencia) {
                    const key = `${h.curso?.id_curso}-${det.competencia}`;
                    if (!compMap.has(key)) {
                       compMap.set(key, {
                          ficha: h.curso.id_curso,
                          lider: h.curso?.lider ? `${h.curso.lider.nombre} ${h.curso.lider.apellido || ''}` : 'No asignado',
                          competencia: det.competencia,
                          fecha_inicio: det.fecha_inicio_competencia,
                          fecha_fin: det.fecha_fin_competencia
                       });
                    }
                 }
             }
          }
       });
    });

    return {
      horasEjecutadas,
      tasaAsistencia,
      clasesProgramadas,
      clasesRealizadas,
      solicitudes: this.instructorSolicitudes(),
      programas: Array.from(progSet).sort(),
      competencias: Array.from(compMap.values()).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
    };
  });
}

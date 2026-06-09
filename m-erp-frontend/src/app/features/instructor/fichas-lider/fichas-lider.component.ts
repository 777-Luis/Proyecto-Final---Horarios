import {
  Component, OnInit, signal, inject, ChangeDetectorRef,
  ChangeDetectionStrategy, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus, X, Search, Calendar, AlertCircle, LayoutGrid, List, Copy, Check
} from 'lucide-angular';
import { InstructorService } from '../../../core/services/instructor.service';
import { AdminHorariosService } from '../../../core/services/admin-horarios.service';

interface MonthDay {
  date: number;
  fullDate: string;
  isCurrentMonth: boolean;
  events: any[];
}

@Component({
  selector: 'app-fichas-lider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './fichas-lider.component.html',
  styleUrls: ['./fichas-lider.component.css']
})
export class FichasLiderComponent implements OnInit {
  srv = inject(InstructorService);
  horariosSrv = inject(AdminHorariosService); // We reuse this just for the instructor list or registers
  cdr = inject(ChangeDetectorRef);

  // ─── Search ───────────────────────────────────
  searchTerm = '';
  getLocalIsoStr(d: Date = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  selectedDate = signal(this.getLocalIsoStr());

  // ─── Modal Flags ──────────────────────────────
  showCalendarModal = signal(false);
  showAddBlockModal = signal(false);
  showEventDetailsModal = signal(false);
  selectedEventDetails = signal<any>(null);
  copied = signal(false);

  // ─── State ────────────────────────────────────
  selectedCurso   = signal<any>(null);
  horarioDelCurso = signal<any>(null);
  isLoadingHorario = signal(false);
  
  addBlockPayload = { dia: 1, hora_inicio: '08:00', hora_fin: '10:00', instructor_id: '' };
  savingBlock = signal(false);

  // Schedule grid
  readonly days       = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  readonly hoursRuler = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];

  // ─── Filtered list ────────────────────────────
  filteredCursos = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    let list = this.srv.fichasLideradas();
    if (!term) return list;
    return list.filter(c => {
      const ficha   = String(c.id_curso ?? '').toLowerCase();
      const prog    = (c.programa?.nombre ?? '').toLowerCase();
      const area    = (c.area?.nombre ?? '').toLowerCase();
      return ficha.includes(term) || prog.includes(term) || area.includes(term);
    });
  });

  ngOnInit() {
    this.srv.fetchFichasLideradas();
    this.horariosSrv.fetchInstructores(); // Ensure we have instructors for blocks
  }

  // ─── Calendar View Mode ───────────────────────
  calendarViewMode = signal<'weekly' | 'monthly'>('monthly');

  openCalendarModal(curso: any) {
    this.selectedCurso.set(curso);
    this.showCalendarModal.set(true);
    this.loadHorario(curso.id);
  }
  closeCalendarModal() { this.showCalendarModal.set(false); }
  
  loadHorario(cursoId: string) {
    this.isLoadingHorario.set(true);
    
    this.srv.fetchHorarioByCurso(cursoId).subscribe({
      next: (horarios: any[]) => {
        const horario = horarios.find((h: any) => h.curso?.id === cursoId);
        if (horario) {
          // If schedule exists, fetch the full details for the schedule.
          this.srv.fetchHorarioCompleto(horario.id).subscribe({
            next: (data) => {
              this.horarioDelCurso.set(data);
              this.isLoadingHorario.set(false);
              this.cdr.detectChanges();
            },
            error: () => this.isLoadingHorario.set(false)
          });
        } else {
          // Course has no schedule
          this.horarioDelCurso.set(null);
          this.isLoadingHorario.set(false);
        }
      },
      error: () => {
        this.horarioDelCurso.set(null);
        this.isLoadingHorario.set(false);
      }
    });
  }

  createBaseHorario() {
    const curso = this.selectedCurso();
    if (!curso) return;
    this.isLoadingHorario.set(true);
    this.srv.createHorarioBase({
      curso_id: curso.id,
      ambiente_id: curso.ambiente?.id,
      jornada: curso.jornada || 'Mañana',
      detalles: []
    }).subscribe({
      next: (h) => {
        // Refresh fichas to get the horario id
        this.srv.fetchFichasLideradas();
        this.loadHorario(curso.id);
      },
      error: (e) => {
        this.isLoadingHorario.set(false);
        alert(e.error?.message || 'Error creando horario base.');
      }
    });
  }

  setCalendarViewMode(mode: 'weekly' | 'monthly') {
    this.calendarViewMode.set(mode);
  }

  onDateChange(dateStr: string) {
    this.selectedDate.set(dateStr);
  }

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
    this.onDateChange(this.getLocalIsoStr(d));
  }

  nextPeriod() {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    if (this.calendarViewMode() === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    this.onDateChange(this.getLocalIsoStr(d));
  }
  
  monthlyGrid = computed(() => {
    const dateStr = this.selectedDate();
    const horario = this.horarioDelCurso();

    const baseDate = new Date(dateStr + 'T00:00:00');
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: MonthDay[] = [];
    
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
      const pDay = daysInPrevMonth - startingDayOfWeek + i + 1;
      const prevDate = new Date(year, month - 1, pDay);
      grid.push({
        date: pDay,
        fullDate: this.getLocalIsoStr(prevDate),
        isCurrentMonth: false,
        events: this.getEventsForSpecificDate(prevDate, horario)
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(year, month, i);
      grid.push({
        date: i,
        fullDate: this.getLocalIsoStr(curDate),
        isCurrentMonth: true,
        events: this.getEventsForSpecificDate(curDate, horario)
      });
    }
    
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      grid.push({
        date: i,
        fullDate: this.getLocalIsoStr(nextDate),
        isCurrentMonth: false,
        events: this.getEventsForSpecificDate(nextDate, horario)
      });
    }
    
    return grid;
  });

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  getEventsForSpecificDate(dateObj: Date, horario: any = null): any[] {
    const dayOfWeek = dateObj.getDay(); 
    const detalles = horario?.detalles ?? [];
    const curso = this.selectedCurso();
    
    return detalles
      .filter((d: any) => d.dia === dayOfWeek)
      .filter((d: any) => {
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
    this.addBlockPayload = { dia: 1, hora_inicio: '08:00', hora_fin: '10:00', instructor_id: '' };
    this.showAddBlockModal.set(true);
  }
  closeAddBlockModal() {
    this.showAddBlockModal.set(false);
  }
  saveAddBlock() {
    if (!this.addBlockPayload.instructor_id) return;
    const horario = this.horarioDelCurso();
    if (!horario) return;

    this.savingBlock.set(true);
    this.srv.addHorarioDetalle(horario.id, this.addBlockPayload).subscribe({
      next: () => {
        this.savingBlock.set(false);
        this.closeAddBlockModal();
        this.loadHorario(this.selectedCurso().id);
      },
      error: (e: any) => {
        this.savingBlock.set(false);
        alert(e.error?.message || 'Error al añadir bloque. Revise posibles cruces de horario.');
      }
    });
  }

  deleteBlock(evt: any, event: Event) {
    event.stopPropagation();
    if(confirm('¿Eliminar bloque?')) {
      this.srv.deleteHorarioDetalle(evt.id).subscribe({
        next: () => this.loadHorario(this.selectedCurso().id),
        error: (e: any) => alert(e.error?.message || 'Error al eliminar')
      });
    }
  }

  getInstructorName(evt: any): string {
    if (!evt.instructor) return 'Sin instructor';
    const p = evt.instructor;
    return `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin instructor';
  }

  getDatesOfWeek(): string[] {
    const todayStr = this.selectedDate() || this.getLocalIsoStr();
    const d = new Date(todayStr + 'T00:00:00');
    const day = d.getDay() || 7; 
    const result: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const copy = new Date(d);
      copy.setDate(d.getDate() - day + i);
      result.push(this.getLocalIsoStr(copy));
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

  getEventsForDay(day: string): any[] {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const detalles = this.horarioDelCurso()?.detalles ?? [];
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
}

import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminHorariosService {
  private http = inject(HttpClient);
  // Uso de API Principal para obtener la lista de cursos si es necesario
  private apiUrl = 'http://localhost:3000/api/erp/v1';
  private schedulesApiUrl = 'http://localhost:3000/api/erp/v1/horarios';

  // State
  schedulesList = signal<any[]>([]);
  isLoadingList = signal(false);

  selectedScheduleInfo = signal<any>(null);
  selectedScheduleGrid = signal<any[]>([]);
  isLoadingGrid = signal(false);

  // Registro de Clases
  registrosDia = signal<any[]>([]);
  isLoadingRegistros = signal(false);
  currentDateStr = signal<string>(new Date().toISOString().substring(0, 10));

  // Lista todos los horarios existentes
  // Cache for creation Modal
  cursosSinHorario = signal<any[]>([]);
  ambientesDisponibles = signal<any[]>([]);
  instructores = signal<any[]>([]);

  fetchInstructores() {
    this.http.get<any>(`${this.apiUrl}/users?limit=1000`).subscribe({
      next: (res: any) => {
        const arr = res.data || res;
        const mapped = arr.filter((u: any) => u.rol === 'Instructor' || u.rol_nombre === 'Instructor');
        this.instructores.set(mapped);
      },
      error: (err) => console.error('Error fetching instructores', err)
    });
  }

  fetchCursosSinHorario() {
    this.http.get<any[]>(`${this.apiUrl}/horarios/cursos-sin-horario`).subscribe({
      next: (data) => this.cursosSinHorario.set(data),
      error: (err) => console.error('Error fetching cursos sin horario', err)
    });
  }

  fetchAmbientesDisponibles(jornada: string, ignoreCursoId?: string) {
    const url = ignoreCursoId
      ? `${this.apiUrl}/horarios/ambientes-disponibles?jornada=${jornada}&ignore_curso_id=${ignoreCursoId}`
      : `${this.apiUrl}/horarios/ambientes-disponibles?jornada=${jornada}`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => this.ambientesDisponibles.set(data),
      error: (err) => console.error('Error fetching ambientes disponibles', err)
    });
  }

  fetchHorarios() {
    this.isLoadingList.set(true);
    // En el backend creamos GET /horarios en el módulo chronogest-schedules
    this.http.get<any[]>(`${this.apiUrl}/horarios`).subscribe({
      next: (data) => {
        this.schedulesList.set(data);
        this.isLoadingList.set(false);
      },
      error: () => this.isLoadingList.set(false)
    });
  }

  fetchRegistrosClases(fecha: string) {
    this.isLoadingRegistros.set(true);
    this.http.get<any[]>(`${this.schedulesApiUrl}/registro-clases?fecha=${fecha}`).subscribe({
      next: (data) => {
        this.registrosDia.set(data);
        this.isLoadingRegistros.set(false);
      },
      error: () => this.isLoadingRegistros.set(false)
    });
  }

  fetchRegistrosClasesSemana(dateStr?: string) {
    this.isLoadingRegistros.set(true);
    if (dateStr) this.currentDateStr.set(dateStr);
    const dates = this.getDatesOfWeek(dateStr);
    const fechaInicio = dates[0];
    const fechaFin = dates[6];
    this.http.get<any[]>(`${this.schedulesApiUrl}/registro-clases?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`).subscribe({
      next: (data) => {
        this.registrosDia.set(data);
        this.isLoadingRegistros.set(false);
      },
      error: () => this.isLoadingRegistros.set(false)
    });
  }

  // Carga el grid de un horario específico
  fetchHorarioDetalle(id: string) {
    this.isLoadingGrid.set(true);
    // GET /horarios/:id resuelve el maestro y sus detalles
    this.http.get<any>(`${this.apiUrl}/horarios/${id}`).subscribe({
      next: (data) => {
        this.selectedScheduleInfo.set(data);
        this.selectedScheduleGrid.set(data.detalles || []);
        this.isLoadingGrid.set(false);
      },
      error: () => this.isLoadingGrid.set(false)
    });
  }

  downloadPdf(id: string) {
    window.open(`${this.apiUrl}/horarios/${id}/pdf`, '_blank');
  }

  createHorario(payload: any) {
    return this.http.post(`${this.apiUrl}/horarios`, payload);
  }

  addHorarioDetalle(horarioId: string, payload: any) {
    return this.http.post(`${this.apiUrl}/horarios/${horarioId}/detalles`, payload);
  }

  deleteHorarioDetalle(id: string) {
    return this.http.delete(`${this.apiUrl}/horarios/detalles/${id}`);
  }

  updateHorarioDetalle(id: string, payload: any) {
    return this.http.patch(`${this.apiUrl}/horarios/detalles/${id}`, payload);
  }

  getDatesOfWeek(dateStr?: string): string[] {
    const today = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - currentDay + i);
      result.push(d.toISOString().substring(0, 10));
    }
    return result;
  }

  getBadgeForEvent(evt: any, dayName: string): any {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayIndex = dayNames.indexOf(dayName);
    const eventDate = this.getDatesOfWeek(this.currentDateStr())[dayIndex];

    const todayStr = new Date().toISOString().substring(0, 10);

    const registro = this.registrosDia().find((r: any) => 
      (r.horario_detalle?.id === evt.id || r.horario_detalle_id === evt.id) && r.fecha?.startsWith(eventDate)
    );

    const now = new Date();
    const [yyyyStr, mmStr, ddStr] = eventDate.split('-');
    const [hEnd, mEnd, sEnd] = (evt.hora_fin || '00:00:00').split(':');
    const evtTimeEnd = new Date(Number(yyyyStr), Number(mmStr) - 1, Number(ddStr), Number(hEnd), Number(mEnd), Number(sEnd || 0));

    if (!registro) {
      if (now > evtTimeEnd) return { type: 'No-asistio', text: 'No asistió' };
      return { type: 'Pendiente', text: 'Pendiente' };
    }
    
    if (registro.estado.toLowerCase() === 'finalizada' || (registro.estado.toLowerCase() === 'activa' && now > evtTimeEnd)) return { type: 'Finalizada', text: 'Clase finalizada' };
    if (registro.estado.toLowerCase() === 'suspendida') return { type: 'Suspendida', text: 'Clase suspendida' };
    if (registro.estado.toLowerCase() === 'activa' && registro.minutos_retraso > 0) return { type: 'Retraso', text: `Retraso: ${registro.minutos_retraso} min` };
    if (registro.estado.toLowerCase() === 'activa') return { type: 'Activa', text: 'Clase en curso' };
    return { type: 'Pendiente', text: 'Pendiente' };
  }

  getClassProgressForEvent(evt: any, dayName: string): number {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayIndex = dayNames.indexOf(dayName);
    if (dayIndex === -1) return 0;
    
    const eventDate = this.getDatesOfWeek(this.currentDateStr())[dayIndex];
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
}

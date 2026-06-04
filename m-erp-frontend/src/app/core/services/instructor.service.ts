import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiHorariosUrl = 'http://localhost:3000/api/erp/v1';
  private apiUrl = 'http://localhost:3000/api/erp/v1';

  personalSchedule = signal<any[]>([]);
  scheduleMaster = signal<any>(null);
  isLoadingSchedule = signal(false);
  registrosClases = signal<any[]>([]);

  solicitudesEnviadas = signal<any[]>([]);
  solicitudesArea = signal<any[]>([]);
  isLoadingRequests = signal(false);

  profileData = signal<any>(null);

  fetchPersonalSchedule() {
    this.isLoadingSchedule.set(true);
    const userId = this.authService.userContextSignal()?.personaId;
    if (!userId) {
       this.isLoadingSchedule.set(false);
       return;
    }
    
    this.http.get<any[]>(`${this.apiHorariosUrl}/horarios/instructor/${userId}`).subscribe({
      next: (data) => {
        // data es un array de horario_detalle con relations 'horario', etc.
        this.personalSchedule.set(data);
        if (data.length > 0) {
          this.scheduleMaster.set(data[0].horario);
        }
        this.isLoadingSchedule.set(false);
      },
      error: () => this.isLoadingSchedule.set(false)
    });
  }

  fetchInstructorSchedule(personaId: string) {
    return this.http.get<any[]>(`${this.apiHorariosUrl}/horarios/instructor/${personaId}`);
  }

  fetchAmbientes(jornada: string) {
    return this.http.get<any[]>(`${this.apiHorariosUrl}/ambientes/disponibles?jornada=${jornada}`);
  }

  fetchRegistroClases() {
    const userId = this.authService.userContextSignal()?.personaId;
    if (!userId) return;

    // Obtener las fechas de la semana actual para la vista del horario
    const dates = this.getDatesOfWeek();
    const fechaInicio = dates[0];
    const fechaFin = dates[6];

    this.http.get<any[]>(`${this.apiHorariosUrl}/horarios/registro-clases/instructor/${userId}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`).subscribe({
      next: (data) => {
        this.registrosClases.set(data);
      },
      error: (e) => console.error('Error fetching registros', e)
    });
  }

  getDatesOfWeek(): string[] {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - currentDay + i);
      result.push(d.toISOString().substring(0, 10));
    }
    return result;
  }

  activarClase(horario_detalle_id: string, fecha: string) {
    const userId = this.authService.userContextSignal()?.personaId;
    if (!userId) return;

    return this.http.post<any>(`${this.apiHorariosUrl}/horarios/registro-clases/activar`, {
      horario_detalle_id,
      instructor_id: userId,
      fecha
    });
  }

  finalizarClase(registroId: string) {
    return this.http.patch<any>(`${this.apiHorariosUrl}/horarios/registro-clases/${registroId}/finalizar`, {});
  }

  suspenderClase(registroId: string, motivo: string) {
    return this.http.patch<any>(`${this.apiHorariosUrl}/horarios/registro-clases/${registroId}/suspender`, { motivo });
  }

  reanudarClase(registroId: string) {
    return this.http.patch<any>(`${this.apiHorariosUrl}/horarios/registro-clases/${registroId}/reanudar`, {});
  }

  updateHorarioDetalle(detalleId: string, payload: any) {
    return this.http.patch<any>(`${this.apiHorariosUrl}/horarios/detalles/${detalleId}`, payload);
  }

  fetchSolicitudesEnviadas() {
    this.isLoadingRequests.set(true);
    this.http.get<any[]>(`${this.apiUrl}/solicitudes`).subscribe({
      next: (data) => {
        this.solicitudesEnviadas.set(data);
        this.isLoadingRequests.set(false);
      },
      error: () => this.isLoadingRequests.set(false)
    });
  }

  fetchSolicitudesLider() {
    this.http.get<any[]>(`${this.apiUrl}/solicitudes`).subscribe(
      data => this.solicitudesArea.set(data)
    );
  }

  instructoresArea = signal<any[]>([]);

  fetchInstructoresArea() {
    // Para simplificar listaremos todos los instructores. (En backend podríamos filtrar por area).
    this.http.get<any>(`${this.apiUrl}/users?role=Instructor&limit=100`).subscribe({
       next: (res) => this.instructoresArea.set(res.data)
    });
  }

  createSolicitudLider(payload: { instructor_id: string, tipo_solicitud: string, descripcion: string, detalles_propuestos?: Record<string, any> }) {
    return this.http.post(`${this.apiUrl}/solicitudes`, payload);
  }

  downloadPdf() {
     const id = this.scheduleMaster()?.id;
     if(!id) return;
     this.http.get(`${this.apiHorariosUrl}/horarios/${id}/pdf`, { responseType: 'blob' })
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mi_horario.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }
}

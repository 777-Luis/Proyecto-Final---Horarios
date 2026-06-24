import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AdminCursosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/erp/v1';

  cursosList    = signal<any[]>([]);
  isLoading     = signal(false);

  // Form dependencies (Cascada)
  areas                = signal<any[]>([]);
  programas            = signal<any[]>([]);
  instructoresFilter   = signal<any[]>([]);
  ambientesDisponibles = signal<any[]>([]);

  // For schedule view
  horariosList        = signal<any[]>([]);
  horarioDelCurso     = signal<any | null>(null);
  isLoadingHorario    = signal(false);
  registrosClases     = signal<any[]>([]);

  fetchCursos() {
    this.isLoading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/cursos`).subscribe({
      next: (data) => { this.cursosList.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  fetchAllHorarios() {
    this.http.get<any[]>(`${this.apiUrl}/horarios`).subscribe({
      next: (data) => { this.horariosList.set(data); },
      error: (e) => { console.error('Error fetching horarios:', e); }
    });
  }

  fetchRegistroClases(fechas: string[]) {
    this.registrosClases.set([]);
    for (const fecha of fechas) {
      this.http.get<any[]>(`${this.apiUrl}/horarios/registro-clases?fecha=${fecha}`).subscribe({
        next: (data) => { this.registrosClases.update(prev => [...prev, ...data]); },
        error: (e) => { console.error('Error fetching registro clases for ' + fecha, e); }
      });
    }
  }

  fetchAreas() {
    this.http.get<any[]>(`${this.apiUrl}/areas`).subscribe(data => this.areas.set(data));
  }

  fetchProgramas(areaId: string) {
    this.http.get<any[]>(`${this.apiUrl}/areas/${areaId}/programas`).subscribe(data => this.programas.set(data));
  }

  fetchInstructores(areaId?: string) {
    // Obtenemos todos los usuarios y filtramos localmente para garantizar que la lista nunca esté vacía
    // por culpa de un filtro estricto de area_id en el backend.
    this.http.get<any>(`${this.apiUrl}/users?limit=1000`).subscribe(res => {
      const data = res.data || res || [];
      const arr = Array.isArray(data) ? data : [];
      const mapped = arr.filter((u: any) => u.rol === 'Instructor' || u.rol_nombre === 'Instructor');
      this.instructoresFilter.set(mapped);
    });
  }

  fetchAmbientesDisponibles(payload: { area_id: string, jornada: string, inicio: string, fin: string }) {
    let url = `${this.apiUrl}/ambientes`;
    if (payload.area_id) {
      url += `?area_id=${payload.area_id}`;
    }
    this.http.get<any>(url)
      .subscribe(res => {
        const data = res.data || res;
        this.ambientesDisponibles.set(data);
      });
  }

  /**
   * Fetches all schedules and finds the one matching the given curso id.
   * Uses GET /horarios which returns full relations.
   */
  fetchHorarioByCurso(cursoId: string) {
    this.isLoadingHorario.set(true);
    this.horarioDelCurso.set(null);
    this.http.get<any[]>(`${this.apiUrl}/horarios`).subscribe({
      next: (horarios) => {
        const found = horarios.find(h => h.curso?.id === cursoId) ?? null;
        this.horarioDelCurso.set(found);
        this.isLoadingHorario.set(false);
      },
      error: () => this.isLoadingHorario.set(false)
    });
  }

  downloadHorarioPdf(horarioId: string) {
    this.http.get(`${this.apiUrl}/horarios/${horarioId}/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `horario_${horarioId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (e) => {
        console.error('Error downloading PDF:', e);
      }
    });
  }

  crearCurso(payload: any) {
    return this.http.post(`${this.apiUrl}/cursos`, payload);
  }

  updateCurso(id: string, payload: any) {
    return this.http.patch(`${this.apiUrl}/cursos/${id}`, payload);
  }

  deleteCurso(id: string) {
    return this.http.delete(`${this.apiUrl}/cursos/${id}`);
  }
}

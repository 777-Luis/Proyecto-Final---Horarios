import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AmbienteEstado {
  id: string;
  nombre: string;
  area: string | { id?: string; nombre: string } | null;
  capacidad: number;
  estadoManana: 'Disponible' | 'Ocupado';
  estadoTarde: 'Disponible' | 'Ocupado';
}

export interface Area {
  id: string;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAmbientesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/erp/v1';

  ambientesList = signal<AmbienteEstado[]>([]);
  areas = signal<Area[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal<string | null>(null);

  fetchAmbientes(filterAreaId?: string | null) {
    this.isLoading.set(true);
    const url = `${this.apiUrl}/ambientes/estado`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        // Normalize the backend payload:
        // backend returns { estado_manana: { disponible: bool }, estado_tarde: { disponible: bool } }
        // area is a string (nombre) coming from getEstadoGlobal
        let normalized = data.map(amb => ({
          ...amb,
          estadoManana: amb.estado_manana?.disponible === false ? 'Ocupado' : 'Disponible',
          estadoTarde:  amb.estado_tarde?.disponible  === false ? 'Ocupado' : 'Disponible',
        } as AmbienteEstado));

        // Apply frontend area filter
        if (filterAreaId) {
          normalized = normalized.filter(a => {
            const areaId = typeof a.area === 'object' ? a.area?.id : null;
            return areaId === filterAreaId;
          });
        }

        this.ambientesList.set(normalized);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  fetchAreas() {
    this.http.get<Area[]>(`${this.apiUrl}/areas`).subscribe(d => this.areas.set(d));
  }

  horariosList = signal<any[]>([]);
  registrosClases = signal<any[]>([]);

  fetchAllHorarios() {
    this.http.get<any[]>(`http://localhost:3000/api/erp/v1/horarios`).subscribe({
      next: (data) => { this.horariosList.set(data); },
      error: (e) => { console.error('Error fetching horarios:', e); }
    });
  }

  fetchRegistroClases(fechas: string[]) {
    this.registrosClases.set([]);
    for (const fecha of fechas) {
      this.http.get<any[]>(`http://localhost:3000/api/erp/v1/horarios/registro-clases?fecha=${fecha}`).subscribe({
        next: (data) => { this.registrosClases.update(prev => [...prev, ...data]); },
        error: (e) => { console.error('Error fetching registro clases for ' + fecha, e); }
      });
    }
  }

  createAmbiente(payload: { nombre: string; area_id: string; capacidad: number }) {
    this.isSaving.set(true);
    return this.http.post<any>(`${this.apiUrl}/ambientes`, payload);
  }

  showSuccess(msg: string, durationMs = 3500) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), durationMs);
  }
}

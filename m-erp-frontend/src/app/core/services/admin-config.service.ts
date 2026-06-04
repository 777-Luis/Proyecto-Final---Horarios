import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AdminConfigService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/erp/v1';

  // --- SIGNALS FOR LISTS ---
  departamentos = signal<any[]>([]);
  municipios = signal<any[]>([]);
  centros = signal<any[]>([]);
  sedes = signal<any[]>([]);
  areas = signal<any[]>([]);
  programas = signal<any[]>([]);
  aplicativos = signal<any[]>([]);
  accesos = signal<any>({ data: [], meta: { total: 0, page: 1, totalPages: 1 } });
  
  // Instructores para el listado de líderes
  instructores = signal<any[]>([]);

  // --- FETCHERS ---
  fetchDepartamentos() {
    return this.http.get<any[]>(`${this.apiUrl}/departamentos`).subscribe(data => this.departamentos.set(data));
  }

  fetchMunicipios(departamento_id?: string) {
    let params = new HttpParams();
    if (departamento_id) params = params.set('departamento_id', departamento_id);
    return this.http.get<any[]>(`${this.apiUrl}/municipios`, { params }).subscribe(data => this.municipios.set(data));
  }

  fetchCentros() {
    return this.http.get<any[]>(`${this.apiUrl}/centros`).subscribe(data => this.centros.set(data));
  }

  fetchSedes(centro_id?: string) {
    let params = new HttpParams();
    if (centro_id) params = params.set('centro_id', centro_id);
    return this.http.get<any[]>(`${this.apiUrl}/sedes`, { params }).subscribe(data => this.sedes.set(data));
  }

  fetchAreas(sede_id?: string) { // Backend originally doesn't filter area by sede, let's just get all or filter in frontend
    return this.http.get<any[]>(`${this.apiUrl}/areas`).subscribe(data => {
      // Backend didn't implement sede_id filter in areas, so we filter it here for cascada
      if (sede_id) {
        this.areas.set(data.filter(a => a.sede?.id === sede_id));
      } else {
        this.areas.set(data);
      }
    });
  }

  fetchProgramas(area_id?: string) {
    let params = new HttpParams();
    if (area_id) params = params.set('area_id', area_id);
    return this.http.get<any[]>(`${this.apiUrl}/programas`, { params }).subscribe(data => this.programas.set(data));
  }

  fetchAplicativos() {
    return this.http.get<any[]>(`${this.apiUrl}/aplicativos`).subscribe(data => this.aplicativos.set(data));
  }

  fetchAccesos(filters: any) {
    let params = new HttpParams()
      .set('page', filters.page || '1')
      .set('limit', filters.limit || '20');
      
    if (filters.search) params = params.set('search', filters.search);
    if (filters.aplicativo_id) params = params.set('aplicativo_id', filters.aplicativo_id);
    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);

    return this.http.get<any>(`${this.apiUrl}/accesos`, { params }).subscribe(data => this.accesos.set(data));
  }

  fetchInstructores() {
    let params = new HttpParams().set('role', 'Instructor');
    return this.http.get<any>(`${this.apiUrl}/users`, { params }).subscribe(res => {
      this.instructores.set(res.data ? res.data : res);
    });
  }

  // --- CRUD GENERIC ---
  createEntity(endpoint: string, payload: any) {
    return this.http.post(`${this.apiUrl}/${endpoint}`, payload);
  }

  updateEntity(endpoint: string, id: string, payload: any) {
    return this.http.patch(`${this.apiUrl}/${endpoint}/${id}`, payload);
  }

  deleteEntity(endpoint: string, id: string) {
    return this.http.delete(`${this.apiUrl}/${endpoint}/${id}`);
  }
}

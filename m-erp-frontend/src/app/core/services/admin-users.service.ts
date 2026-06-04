import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/erp/v1';

  // Signals para Filtros
  roles = ['Instructores', 'Aprendices', 'Administradores'];
  currentTab = signal('Instructores');
  municipios = signal<any[]>([]);

  // Listas de Cascada
  areas = signal<any[]>([]);
  programas = signal<any[]>([]);
  cursos = signal<any[]>([]);
  allCursos = signal<any[]>([]);

  // Selected Cascada IDs
  selectedAreaId = signal<string | null>(null);
  selectedProgramaId = signal<string | null>(null);
  selectedCursoId = signal<string | null>(null);

  // Users Data
  users = signal<any[]>([]);
  isLoading = signal(false);

  fetchAreas() {
    this.http.get<any[]>(`${this.apiUrl}/areas`).subscribe(data => this.areas.set(data));
  }

  fetchAllCursos() {
    this.http.get<any[]>(`${this.apiUrl}/cursos`).subscribe(data => this.allCursos.set(data));
  }

  fetchMunicipios() {
    this.http.get<any[]>(`${this.apiUrl}/municipios`).subscribe(data => this.municipios.set(data));
  }

  fetchProgramas(areaId: string | null) {
    if (!areaId) {
      this.programas.set([]);
      this.selectedProgramaId.set(null);
      this.cursos.set([]);
      this.selectedCursoId.set(null);
      return;
    }
    this.http.get<any[]>(`${this.apiUrl}/areas/${areaId}/programas`).subscribe(data => this.programas.set(data));
  }

  fetchCursos(programaId: string | null) {
    if (!programaId) {
      this.cursos.set([]);
      this.selectedCursoId.set(null);
      return;
    }
    // Suponiendo que el backend tiene un filtro por programa para cursos
    this.http.get<any[]>(`${this.apiUrl}/cursos?programa=${programaId}`).subscribe(data => this.cursos.set(data));
  }

  fetchUsers() {
    this.isLoading.set(true);
    let params = new HttpParams();

    // Mapping tab strings to Backend Roles
    const roleMapping: any = {
      'Instructores': 'Instructor',
      'Aprendices': 'Aprendiz',
      'Administradores': 'Administrador'
    };
    params = params.set('role', roleMapping[this.currentTab()]);

    if (this.selectedAreaId()) params = params.set('area_id', this.selectedAreaId()!);
    if (this.selectedProgramaId()) params = params.set('programa_id', this.selectedProgramaId()!);
    if (this.selectedCursoId()) params = params.set('curso_id', this.selectedCursoId()!);

    this.http.get<any>(`${this.apiUrl}/users`, { params }).subscribe({
      next: (res) => {
        // Puede retornar { data: [...], total: ... }
        this.users.set(res.data ? res.data : res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  downloadTemplate() {
    import('xlsx').then(XLSX => {
      const data = [{
        nombre_completo: 'Juan Perez',
        tipo_documento: 'CC',
        numero_documento: '100100100',
        correo_electronico: 'juan@sena.edu.co',
        contrasena: '123456',
        direccion: 'Calle 1',
        municipio: 'Pitalito',
        genero: 'Masculino',
        ficha_curso: '2550010'
      }];
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Aprendices');
      XLSX.writeFile(wb, 'plantilla_aprendices.xlsx');
    });
  }

  uploadMassive(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/users/mass-upload`, formData);
  }

  createUser(payload: any) {
    return this.http.post(`${this.apiUrl}/users`, payload);
  }

  matricularAprendiz(usuario_id: string, curso_id: string) {
    return this.http.post(`${this.apiUrl}/matriculas`, { usuario_id, curso_id });
  }

  getMatricula(usuario_id: string) {
    return this.http.get(`${this.apiUrl}/matriculas/aprendiz/${usuario_id}`);
  }

  getUser(id: string) {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  getCursoById(id: string) {
    return this.http.get<any>(`${this.apiUrl}/cursos/${id}`);
  }

  updateUser(id: string, payload: any) {
    return this.http.patch(`${this.apiUrl}/users/${id}`, payload);
  }

  deleteUser(id: string) {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }
}

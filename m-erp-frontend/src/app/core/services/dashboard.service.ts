import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, timer, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export interface DashboardStats {
  instructores: number;
  aprendices: number;
  cursos: number;
  ambientesDisponibles: number;
  ambientesOcupados: number;
  ambientesMantenimiento: number;
  horariosCreados: number;
  solicitudesPendientes: number;
  areasActivas: number;
  clasesActivas: number;
  clasesRetraso: number;
  poblacionChartData: any;
  doughnutChartData: any;
  ultimasSolicitudes: any[];
  ambientesList: any[];
  clasesSuspendidas: any[];
  clasesTiempoReal: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/erp/v1';

  readonly stats = signal<DashboardStats | null>(null);
  readonly isLoading = signal<boolean>(false);
  private pollingSub?: Subscription;

  // Start polling every 30 seconds
  startPolling() {
    if (this.pollingSub) return;
    this.isLoading.set(true); // only show spinner on first load
    this.pollingSub = timer(0, 30000).subscribe(() => {
      this.fetchStats(false); // background fetch
    });
  }

  stopPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = undefined;
    }
  }

  fetchStats(showSpinner: boolean = true) {
    if (showSpinner) this.isLoading.set(true);

    const todayDate = new Date().toISOString().substring(0, 10);
    forkJoin({
      instructores: this.http.get<any[]>(`${this.apiUrl}/users?role=Instructor`).pipe(catchError(() => of([]))),
      aprendices: this.http.get<any[]>(`${this.apiUrl}/users?role=Aprendiz`).pipe(catchError(() => of([]))),
      cursos: this.http.get<any[]>(`${this.apiUrl}/cursos`).pipe(catchError(() => of([]))),
      ambientesEstado: this.http.get<any[]>(`${this.apiUrl}/ambientes/estado`).pipe(catchError(() => of([]))),
      horarios: this.http.get<any[]>(`${this.apiUrl}/horarios`).pipe(catchError(() => of([]))),
      solicitudes: this.http.get<any[]>(`${this.apiUrl}/solicitudes`).pipe(catchError(() => of([]))),
      areas: this.http.get<any[]>(`${this.apiUrl}/areas`).pipe(catchError(() => of([]))),
      registroClases: this.http.get<any[]>(`${this.apiUrl}/horarios/registro-clases?fecha=${todayDate}`).pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        const extractCount = (res: any) => res.total !== undefined ? res.total : (Array.isArray(res) ? res.length : 0);

        let ambientesDisponiblesCount = 0;
        let ambientesOcupadosCount = 0;
        let ambientesMantenimientoCount = 0;
        let ambientesList: any[] = [];
        
        if (Array.isArray(results.ambientesEstado)) {
          ambientesList = results.ambientesEstado;
          ambientesDisponiblesCount = ambientesList.filter(a => a.estadoMañana === 'Disponible' || a.estadoTarde === 'Disponible').length;
          ambientesOcupadosCount = ambientesList.filter(a => a.estadoMañana === 'Ocupado' || a.estadoTarde === 'Ocupado').length;
          ambientesMantenimientoCount = ambientesList.filter(a => a.estadoMañana === 'Mantenimiento' || a.estadoTarde === 'Mantenimiento').length;
          
          if (ambientesDisponiblesCount === 0 && ambientesOcupadosCount === 0) {
            // Default mock if no data for the day
            ambientesDisponiblesCount = ambientesList.length;
          }
        }

        const solicitudesArr = Array.isArray(results.solicitudes) ? results.solicitudes : [];
        const solicitudesPendientes = solicitudesArr.filter(s => s.estado === 'PENDIENTE' || s.estado === 'ENVIADO_ADMIN').length;
        const ultimasSolicitudes = solicitudesArr.filter(s => s.estado === 'PENDIENTE' || s.estado === 'ENVIADO_ADMIN').slice(0, 5);

        const registroClasesArr = Array.isArray(results.registroClases) ? results.registroClases : [];
        const clasesSuspendidas = registroClasesArr.filter((r: any) => r.estado === 'suspendida');
        const clasesActivas = registroClasesArr.filter((r: any) => r.estado === 'ejecucion' || r.estado === 'activa');
        const clasesRetraso = registroClasesArr.filter((r: any) => r.estado === 'retraso');

        // Chart Data (Mocked distribution across real areas)
        const areasArr = Array.isArray(results.areas) && results.areas.length > 0 ? results.areas.map(a => a.nombre) : ['Software', 'Agro', 'Bilingüismo'];
        const totalInst = extractCount(results.instructores);
        const totalApr = extractCount(results.aprendices);
        
        const insPerArea = areasArr.map((_, i) => i === 0 ? totalInst : Math.floor(totalInst / areasArr.length));
        insPerArea[0] = totalInst - insPerArea.slice(1).reduce((a, b) => a + b, 0); // ensure sum matches
        
        const aprPerArea = areasArr.map((_, i) => i === 0 ? totalApr : Math.floor(totalApr / areasArr.length));
        aprPerArea[0] = totalApr - aprPerArea.slice(1).reduce((a, b) => a + b, 0);

        const poblacionChartData = {
           labels: areasArr,
           datasets: [
             { label: 'Instructores', data: insPerArea, backgroundColor: '#2E7D52', borderRadius: 4 },
             { label: 'Aprendices', data: aprPerArea, backgroundColor: '#3B82F6', borderRadius: 4 }
           ]
        };

        const doughnutChartData = {
          labels: ['Disponibles', 'Ocupados', 'Mantenimiento'],
          datasets: [
            {
              data: [
                ambientesDisponiblesCount || 1, 
                ambientesOcupadosCount || 0, 
                ambientesMantenimientoCount || 0
              ],
              backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
              borderWidth: 0,
              hoverOffset: 4
            }
          ]
        };

        this.stats.set({
          instructores: totalInst,
          aprendices: totalApr,
          cursos: extractCount(results.cursos),
          ambientesDisponibles: ambientesDisponiblesCount,
          ambientesOcupados: ambientesOcupadosCount,
          ambientesMantenimiento: ambientesMantenimientoCount,
          horariosCreados: extractCount(results.horarios),
          solicitudesPendientes,
          areasActivas: extractCount(results.areas),
          clasesActivas: clasesActivas.length,
          clasesRetraso: clasesRetraso.length,
          poblacionChartData,
          doughnutChartData,
          ultimasSolicitudes: solicitudesArr.filter(s => s.estado === 'PENDIENTE' || s.estado === 'ENVIADO_ADMIN').slice(0, 5),
          ambientesList: ambientesList.slice(0, 6),
          clasesSuspendidas,
          clasesTiempoReal: registroClasesArr.slice(0, 6)
        });
        
        if (showSpinner) this.isLoading.set(false);
      },
      error: () => {
        if (showSpinner) this.isLoading.set(false);
      }
    });
  }

  aprobarSuspension(registroId: string) {
    return this.http.patch<any>(`${this.apiUrl}/horarios/registro-clases/${registroId}/aprobar-suspension`, {});
  }
}

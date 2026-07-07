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
      poblacionStats: this.http.get<any[]>(`${this.apiUrl}/users/stats/poblacion`).pipe(catchError(() => of([]))),
      ambientesEstado: this.http.get<any[]>(`${this.apiUrl}/ambientes/estado`).pipe(catchError(() => of([]))),
      ambientes: this.http.get<any[]>(`${this.apiUrl}/ambientes`).pipe(catchError(() => of([]))),
      horarios: this.http.get<any[]>(`${this.apiUrl}/horarios`).pipe(catchError(() => of([]))),
      solicitudes: this.http.get<any[]>(`${this.apiUrl}/solicitudes`).pipe(catchError(() => of([]))),
      areas: this.http.get<any[]>(`${this.apiUrl}/areas`).pipe(catchError(() => of([]))),
      registroClases: this.http.get<any[]>(`${this.apiUrl}/horarios/registro-clases?fecha=${todayDate}`).pipe(catchError(() => of([])))
    }).subscribe({
      next: (results: any) => {
        const extractCount = (res: any) => {
          if (!res) return 0;
          if (res.meta && res.meta.total !== undefined) return res.meta.total;
          if (res.total !== undefined) return res.total;
          if (Array.isArray(res)) return res.length;
          if (Array.isArray(res.data)) return res.data.length;
          return 0;
        };

        const extractData = (res: any): any[] => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

        let ambientesDisponiblesCount = 0;
        let ambientesOcupadosCount = 0;
        let ambientesMantenimientoCount = 0;
        let ambientesList: any[] = extractData(results.ambientesEstado);
        
        if (ambientesList.length > 0 && ambientesList[0].estado_manana !== undefined) {
          ambientesDisponiblesCount = ambientesList.filter((a: any) => a.estado_manana?.disponible && a.estado_tarde?.disponible).length;
          ambientesOcupadosCount = ambientesList.filter((a: any) => !a.estado_manana?.disponible || !a.estado_tarde?.disponible).length;
          ambientesMantenimientoCount = 0;
        } else {
          // Si no hay datos, contamos la lista general
          ambientesList = extractData(results.ambientes);
          ambientesDisponiblesCount = ambientesList.length;
        }

        const solicitudesArr = extractData(results.solicitudes);
        const registroClasesArr = extractData(results.registroClases);

        const solicitudesPendientes = solicitudesArr.filter((s: any) => s.estado === 'PENDIENTE' || s.estado === 'ENVIADO_ADMIN').length;
        
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const clasesActivas = registroClasesArr.filter((c: any) => 
          c.hora_inicio <= currentTime && 
          c.hora_fin >= currentTime &&
          c.estado !== 'FINALIZADA' && c.estado !== 'SUSPENDIDA'
        );

        const clasesRetraso = registroClasesArr.filter((c: any) => 
          c.estado === 'RETRASO' || 
          (c.hora_inicio < currentTime && c.estado === 'PENDIENTE')
        );

        const clasesSuspendidas = registroClasesArr.filter((c: any) => c.estado === 'SUSPENDIDA');

        const totalInst = extractCount(results.instructores);
        const totalApr = extractCount(results.aprendices);
        
        const poblacionData = results.poblacionStats || [];
        const areasArr = poblacionData.map((p: any) => p.area);
        const insPerArea = poblacionData.map((p: any) => p.instructores);
        const aprPerArea = poblacionData.map((p: any) => p.aprendices);

        const poblacionChartData = {
           labels: areasArr.length > 0 ? areasArr : ['Sin Datos'],
           datasets: [
             { label: 'Instructores', data: insPerArea.length > 0 ? insPerArea : [0], backgroundColor: '#2E7D52', borderRadius: 4 },
             { label: 'Aprendices', data: aprPerArea.length > 0 ? aprPerArea : [0], backgroundColor: '#3B82F6', borderRadius: 4 }
           ]
        };

        const doughnutChartData = {
          labels: ['Disponibles', 'Ocupados'],
          datasets: [
            {
              data: [
                ambientesDisponiblesCount, 
                ambientesOcupadosCount
              ],
              backgroundColor: ['#10B981', '#EF4444'],
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
          ultimasSolicitudes: solicitudesArr.filter((s: any) => s.estado === 'PENDIENTE' || s.estado === 'ENVIADO_ADMIN').slice(0, 5),
          ambientesList: ambientesList.slice(0, 6),
          clasesSuspendidas,
          clasesTiempoReal: clasesActivas.slice(0, 6)
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

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, BaseChartDirective],
  template: `
    <div class="dashboard-container">
      <div class="header-section">
        <div>
          <h1 class="page-title">Panel de Control General</h1>
          <p class="page-subtitle">Monitoreo en tiempo real de la Sede Yamboro <span class="live-dot"></span></p>
        </div>
      </div>

      @if (dashboard.isLoading() && !dashboard.stats()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando métricas en tiempo real...</p>
        </div>
      } @else if (dashboard.stats()) {
        
        <!-- FILA 1: MÉTRICAS PRINCIPALES -->
        <div class="stats-grid top-metrics">
          <div class="glass-card stat-card fade-in" style="animation-delay: 0.1s">
            <div class="icon-circle icon-green">
              <lucide-icon name="users" [size]="24"></lucide-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dashboard.stats()?.instructores }}</span>
              <span class="stat-desc">Instructores</span>
            </div>
          </div>

          <div class="glass-card stat-card fade-in" style="animation-delay: 0.15s">
            <div class="icon-circle icon-blue">
              <lucide-icon name="graduation-cap" [size]="24"></lucide-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dashboard.stats()?.aprendices }}</span>
              <span class="stat-desc">Aprendices</span>
            </div>
          </div>

          <div class="glass-card stat-card fade-in" style="animation-delay: 0.2s">
            <div class="icon-circle icon-green">
              <lucide-icon name="building-2" [size]="24"></lucide-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dashboard.stats()?.ambientesDisponibles }}</span>
              <span class="stat-desc">Ambientes Libres</span>
            </div>
          </div>

          <div class="glass-card stat-card fade-in" style="animation-delay: 0.25s">
            <div class="icon-circle" [ngClass]="(dashboard.stats()?.solicitudesPendientes ?? 0) > 0 ? 'icon-yellow' : 'icon-gray'">
              <lucide-icon name="clipboard-list" [size]="24"></lucide-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dashboard.stats()?.solicitudesPendientes }}</span>
              <span class="stat-desc">Solicitudes Pend.</span>
            </div>
          </div>

          <div class="glass-card stat-card fade-in" style="animation-delay: 0.3s">
            <div class="icon-circle icon-green">
              <lucide-icon name="play-circle" [size]="24"></lucide-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dashboard.stats()?.clasesActivas }}</span>
              <span class="stat-desc">Clases Activas</span>
            </div>
          </div>

          <div class="glass-card stat-card fade-in" style="animation-delay: 0.35s">
            <div class="icon-circle icon-red">
              <lucide-icon name="alert-circle" [size]="24"></lucide-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value" [class.text-red]="(dashboard.stats()?.clasesRetraso ?? 0) > 0">
                {{ dashboard.stats()?.clasesRetraso }}
              </span>
              <span class="stat-desc">Clases con Retraso</span>
            </div>
          </div>
        </div>

        <!-- FILA 2: GRÁFICOS -->
        <div class="charts-grid fade-in" style="animation-delay: 0.4s">
          <div class="glass-card chart-container">
            <h3 class="card-title">Ocupación de Ambientes</h3>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="dashboard.stats()?.doughnutChartData"
                [options]="doughnutChartOptions"
                [type]="'doughnut'">
              </canvas>
            </div>
          </div>

          <div class="glass-card chart-container">
            <h3 class="card-title">Población por Área</h3>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="dashboard.stats()?.poblacionChartData"
                [options]="barChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </div>
        </div>

        <!-- FILA 3: TABLAS -->
        <div class="tables-grid fade-in" style="animation-delay: 0.5s">
          
          <div class="glass-card table-card">
            <div class="card-header">
              <h3 class="card-title">Solicitudes Pendientes</h3>
              <button class="btn-outline-green" routerLink="/admin/solicitudes">Ver todas</button>
            </div>
            <div class="table-responsive">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sol of dashboard.stats()?.ultimasSolicitudes; track sol.id) {
                    <tr>
                      <td class="primary-col">
                        {{ (sol.instructor?.persona?.nombre ? sol.instructor?.persona?.nombre + ' ' + sol.instructor?.persona?.apellido : 'Sin Asignar') }}
                      </td>
                      <td class="type-col">{{ formatTipo(sol.tipo_solicitud) }}</td>
                      <td>
                        <span class="status-badge" [ngClass]="getBadgeClass(sol.estado)">
                          {{ formatEstado(sol.estado) }}
                        </span>
                      </td>
                      <td class="date-col">{{ sol.fecha_solicitud | date:'shortDate' }}</td>
                    </tr>
                  }
                  @if (!dashboard.stats()?.ultimasSolicitudes?.length) {
                    <tr>
                      <td colspan="4" class="empty-state">No hay solicitudes pendientes.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="glass-card table-card">
            <div class="card-header">
              <h3 class="card-title">Clases en Tiempo Real</h3>
              <lucide-icon name="activity" [size]="20" style="color: #2E7D52;"></lucide-icon>
            </div>
            <div class="table-responsive">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Ambiente</th>
                    <th>Instructor</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (clase of dashboard.stats()?.clasesTiempoReal; track clase.id) {
                    <tr>
                      <td class="primary-col">{{ clase.horario_detalle?.ambiente?.nombre || 'N/A' }}</td>
                      <td>{{ (clase.instructor?.nombre ? clase.instructor?.nombre + ' ' + clase.instructor?.apellido : 'Sin Asignar') }}</td>
                      <td>
                        <span class="status-badge" [ngClass]="getBadgeClass(clase.estado)">
                          {{ formatEstado(clase.estado) }}
                        </span>
                      </td>
                    </tr>
                  }
                  @if (!dashboard.stats()?.clasesTiempoReal?.length) {
                    <tr>
                      <td colspan="3" class="empty-state">No hay clases registradas en este momento.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      font-family: 'Inter', system-ui, sans-serif;
      padding-bottom: 40px;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 8px;
    }

    .page-title {
      font-size: 28px;
      color: #111827;
      font-weight: 800;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .page-subtitle {
      font-size: 15px;
      color: #6B7280;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background-color: #10B981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Glassmorphism & Cards */
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .glass-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      transform: translateY(-2px);
    }

    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
    }

    /* Grid Layouts */
    .stats-grid {
      display: grid;
      gap: 20px;
    }
    .top-metrics {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 24px;
    }

    .tables-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .charts-grid, .tables-grid { grid-template-columns: 1fr; }
    }

    /* Stat Cards */
    .stat-card {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    }

    .icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-green { background: #DCFCE7; color: #16A34A; }
    .icon-blue { background: #DBEAFE; color: #2563EB; }
    .icon-yellow { background: #FEF9C3; color: #CA8A04; }
    .icon-red { background: #FEE2E2; color: #DC2626; }
    .icon-gray { background: #F3F4F6; color: #6B7280; }

    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 28px; font-weight: 800; color: #111827; line-height: 1.2; }
    .stat-desc { font-size: 13px; color: #6B7280; font-weight: 500; }
    .text-red { color: #DC2626; }

    /* Chart Containers */
    .chart-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .chart-wrapper {
      position: relative;
      height: 250px;
      width: 100%;
    }

    /* Table Cards */
    .table-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-outline-green {
      background: transparent;
      border: 1px solid #16A34A;
      color: #16A34A;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline-green:hover { background: #16A34A; color: white; }

    .table-responsive { overflow-x: auto; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table th {
      padding: 12px 16px;
      border-bottom: 2px solid #E5E7EB;
      font-size: 12px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .modern-table td {
      padding: 16px;
      border-bottom: 1px solid #F3F4F6;
      font-size: 14px;
      color: #374151;
    }
    .modern-table tr:last-child td { border-bottom: none; }
    .primary-col { font-weight: 600; color: #111827 !important; }
    .type-col { color: #4B5563; }
    .date-col { color: #9CA3AF; font-size: 13px; }

    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-yellow { background: #FEF9C3; color: #854D0E; }
    .badge-blue { background: #DBEAFE; color: #1E40AF; }
    .badge-green { background: #DCFCE7; color: #166534; }
    .badge-red { background: #FEE2E2; color: #991B1B; }
    .badge-gray { background: #F3F4F6; color: #374151; }

    .empty-state { text-align: center; color: #9CA3AF; font-style: italic; padding: 24px; }

    /* Animations */
    .fade-in {
      animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
      transform: translateY(10px);
    }
    @keyframes fadeIn {
      to { opacity: 1; transform: translateY(0); }
    }
    
    .loading-state {
      padding: 60px;
      text-align: center;
      color: #6B7280;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #E5E7EB;
      border-radius: 50%;
      border-top-color: #2E7D52;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  dashboard = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 12 } } }
    }
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 12 } } }
    },
    scales: {
      y: { beginAtZero: true, suggestedMax: 10, grid: { color: '#F3F4F6' }, border: { dash: [4, 4] } },
      x: { grid: { display: false } }
    }
  };

  ngOnInit() {
    this.dashboard.startPolling();
    // Use interval locally to ensure change detection runs when signals update in background
    setInterval(() => {
      this.cdr.markForCheck();
    }, 5000);
  }

  ngOnDestroy() {
    this.dashboard.stopPolling();
  }

  formatTipo(tipo: string): string {
    if (!tipo) return 'Desconocido';
    return tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatEstado(estado: string): string {
    if (!estado) return '';
    return estado.replace(/_/g, ' ').toUpperCase();
  }

  getBadgeClass(estado: string): string {
    if (!estado) return 'badge-gray';
    const est = estado.toLowerCase();
    if (est.includes('pendiente') || est.includes('retraso')) return 'badge-yellow';
    if (est.includes('enviado')) return 'badge-blue';
    if (est.includes('aprobado') || est.includes('ejecucion') || est.includes('activa') || est.includes('finalizada')) return 'badge-green';
    if (est.includes('rechazado') || est.includes('suspendida')) return 'badge-red';
    return 'badge-gray';
  }
}

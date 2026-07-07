import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="dashboard-container">
      <div class="page-header">
        <h1>Dashboard Nacional</h1>
        <p>Visión consolidada de todas las sedes del sistema</p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;">
            <lucide-icon name="building-2"></lucide-icon>
          </div>
          <div class="metric-content">
            <p>Total Sedes</p>
            <h3>{{ stats()?.totalSedes || 0 }}</h3>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(59, 130, 246, 0.1); color: #3B82F6;">
            <lucide-icon name="users"></lucide-icon>
          </div>
          <div class="metric-content">
            <p>Usuarios Totales</p>
            <h3>{{ stats()?.totalUsuarios || 0 }}</h3>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(139, 92, 246, 0.1); color: #8B5CF6;">
            <lucide-icon name="book-open"></lucide-icon>
          </div>
          <div class="metric-content">
            <p>Fichas Activas</p>
            <h3>{{ stats()?.totalFichas || 0 }}</h3>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon" style="background: rgba(245, 158, 11, 0.1); color: #F59E0B;">
            <lucide-icon name="calendar-check"></lucide-icon>
          </div>
          <div class="metric-content">
            <p>Clases Hoy</p>
            <h3>{{ stats()?.totalClasesHoy || 0 }}</h3>
          </div>
        </div>
      </div>
      
      <div class="panel mt-6">
        <div class="panel-header">
          <h3>Comparativa por Sede</h3>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sede</th>
                <th>Código</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (sede of sedes(); track sede.id) {
                <tr>
                  <td class="font-medium">{{ sede.nombre }}</td>
                  <td><span class="badge gray">{{ sede.codigo }}</span></td>
                  <td>
                    <span class="badge" [class.success]="sede.activo" [class.danger]="!sede.activo">
                      {{ sede.activo ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .page-header p {
      color: #6B7280;
      margin: 0;
      font-size: 14px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .metric-card {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid #F3F4F6;
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-content p {
      margin: 0;
      font-size: 13px;
      font-weight: 500;
      color: #6B7280;
    }

    .metric-content h3 {
      margin: 4px 0 0 0;
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }

    .mt-6 { margin-top: 24px; }

    .panel {
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid #F3F4F6;
      overflow: hidden;
    }

    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #F3F4F6;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      background: #F9FAFB;
      padding: 12px 20px;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #E5E7EB;
    }

    .data-table td {
      padding: 16px 20px;
      font-size: 14px;
      color: #374151;
      border-bottom: 1px solid #F3F4F6;
    }

    .font-medium { font-weight: 500; color: #111827 !important; }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge.success { background: #D1FAE5; color: #065F46; }
    .badge.danger { background: #FEE2E2; color: #991B1B; }
    .badge.gray { background: #F3F4F6; color: #374151; }
  `]
})
export class SuperadminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  
  stats = signal<any>(null);
  sedes = signal<any[]>([]);

  ngOnInit() {
    this.http.get('http://localhost:3000/api/erp/v1/superadmin/dashboard').subscribe((res) => {
      this.stats.set(res);
    });
    this.http.get<any[]>('http://localhost:3000/api/erp/v1/superadmin/sedes').subscribe((res) => {
      this.sedes.set(res);
    });
  }
}

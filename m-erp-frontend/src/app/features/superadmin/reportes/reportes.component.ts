import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-superadmin-reportes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Reportes Nacionales</h1>
        <p>Estadísticas y consolidación de datos por sede</p>
      </div>

      <div class="panel">
        <div class="empty-state">
          <lucide-icon name="bar-chart-3" [size]="48" color="#9CA3AF"></lucide-icon>
          <h3>Módulo en construcción</h3>
          <p>Pronto podrás visualizar reportes detallados y descargar información en formato Excel/PDF consolidando los datos de todas las sedes del país.</p>
          <p class="api-msg">Mensaje de API: {{ reporte()?.mensaje || 'Cargando...' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #111827; }
    .page-header p { margin: 0; color: #6B7280; font-size: 14px; }
    
    .panel { background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #F3F4F6; padding: 40px; }
    
    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 400px; margin: 0 auto; }
    .empty-state h3 { margin: 16px 0 8px 0; font-size: 18px; font-weight: 600; color: #111827; }
    .empty-state p { margin: 0; color: #6B7280; font-size: 14px; line-height: 1.5; }
    
    .api-msg { margin-top: 16px !important; font-family: monospace; color: #0D3321 !important; background: #F3F4F6; padding: 8px 12px; border-radius: 6px; }
  `]
})
export class SuperadminReportesComponent implements OnInit {
  private http = inject(HttpClient);
  reporte = signal<any>(null);

  ngOnInit() {
    this.http.get('http://localhost:3000/api/erp/v1/superadmin/reportes').subscribe(data => {
      this.reporte.set(data);
    });
  }
}

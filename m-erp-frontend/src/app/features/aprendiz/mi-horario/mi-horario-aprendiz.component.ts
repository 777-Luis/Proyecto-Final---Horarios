import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, DownloadCloud } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-aprendiz-horario',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="page-container">
       <div class="page-header">
         <div>
           <h1 class="page-title">Horario Formativo Ficha SENA</h1>
           <p class="page-subtitle">Ruta de formación activa generada desde Administración</p>
         </div>
         <div class="header-actions">
            <!-- Simulated download for consistency -->
            <button class="btn-primary" (click)="downloadPdf()">
              <lucide-icon name="download-cloud" [size]="16"></lucide-icon> Generar PDF
            </button>
         </div>
       </div>

       <div class="schedule-wrapper">
         <div class="time-rulers">
           @for (hour of hoursRuler; track hour) {
             <div class="time-label" [style.grid-row]="hour - 4">{{ formatHour(hour) }}</div>
           }
         </div>
         
         <div class="schedule-grid">
            @for (day of days; track day; let i = $index) {
              <div class="grid-header" [style.grid-column]="i + 1" [style.grid-row]="1">
                {{ day }}
              </div>
            }

            @for (hour of hoursRuler; track hour) {
              <div class="grid-hline" [style.grid-row]="(hour - 4) + 1" [style.grid-column]="'1 / -1'"></div>
            }

            @for (event of renderedEvents(); track $index) {
               <div class="event-block custom-tooltip-container" 
                    [class.transversal]="event.es_transversal"
                    [style.grid-column]="event.col"
                    [style.grid-row-start]="event.rowStart"
                    [style.grid-row-end]="'span ' + event.rowSpan">
                  <div class="event-title">{{ event.componenteText }}</div>
                  <div class="event-sub">Instr: {{ event.instructorName }}</div>
                  <div class="event-time">{{ event.ambText }} | {{ event.timeText }}</div>

                  @if (event.competencia) {
                    <div class="custom-tooltip">
                      <div class="tt-header">
                        Información Académica
                      </div>
                      <div class="tt-body">
                        <div><strong>Competencia:</strong><br/>{{ event.competencia }}</div>
                        <div style="margin-top: 4px;"><strong>Resultado:</strong><br/>{{ event.resultado }}</div>
                        <div style="margin-top: 4px; color: #EAB308;"><strong>{{ event.fecha_inicio_competencia }} a {{ event.fecha_fin_competencia }}</strong></div>
                      </div>
                    </div>
                  }
               </div>
            }
         </div>
       </div>
    </div>
  `,
  // The CSS Grid is structurally identical to Instructor's. Omitting verbose redundancy to fit inside limit cleanly, binding the same global CSS Grid variables.
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 22px; color: var(--color-text); font-weight: 600; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .btn-primary { background: var(--color-primary); color: var(--color-white); border: none; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; }
    .btn-primary:hover { background: var(--color-primary-dark); }
    
    .schedule-wrapper { display: flex; background: var(--color-white); border-radius: var(--radius-lg); border: 1px solid var(--color-border); min-height: 800px; overflow: hidden; box-shadow: var(--shadow-sm); }
    .time-rulers { width: 60px; border-right: 1px solid var(--color-border); background: #F9FAFB; display: grid; grid-template-rows: 40px repeat(16, 60px); }
    .time-label { text-align: center; font-size: 12px; color: var(--color-text-muted); font-weight: 500; padding-top: 8px; transform: translateY(-50%); }
    .schedule-grid { flex: 1; display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: 40px repeat(16, 60px); position: relative; }
    .grid-header { text-align: center; font-size: 13px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; padding: 12px 0; border-bottom: 1px solid var(--color-border); border-right: 1px solid #F0F2F4; background: #F9FAFB; }
    .grid-hline { border-bottom: 1px dashed var(--color-border); pointer-events: none; }
    
    .event-block { margin: 2px 4px; padding: 8px; border-radius: var(--radius-md); background: #E8F5EE; border-left: 4px solid var(--color-primary); overflow: hidden; display: flex; flex-direction: column; gap: 2px; transition: transform 0.15s; }
    .event-block:hover { box-shadow: var(--shadow-md); z-index: 5; }
    .event-block.transversal { background: #EFF6FF; border-left: 4px solid #3B82F6; }
    .event-title { font-size: 13px; font-weight: 600; color: var(--color-text); }
    .event-sub { font-size: 11px; color: var(--color-text-muted); }
    .event-time { font-size: 11px; font-weight: 500; margin-top: auto; color: var(--color-text-muted); }

    /* CUSTOM TOOLTIP */
    .custom-tooltip-container { position: relative; overflow: visible !important; }
    .custom-tooltip {
      visibility: hidden;
      opacity: 0;
      position: absolute;
      top: 0;
      left: calc(100% + 12px);
      z-index: 9999;
      background: #111827;
      color: #F9FAFB;
      width: 250px;
      padding: 14px;
      border-radius: 8px;
      border: 1px solid #374151;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
      transform: translateX(10px);
      pointer-events: none;
    }
    .custom-tooltip-container:hover .custom-tooltip {
      visibility: visible;
      opacity: 1;
      transform: translateX(0);
    }
    .custom-tooltip::before {
      content: '';
      position: absolute;
      top: 18px;
      left: -7px;
      border-width: 7px 7px 7px 0;
      border-style: solid;
      border-color: transparent #111827 transparent transparent;
      filter: drop-shadow(-1px 0px 1px rgba(0,0,0,0.1));
    }
    .custom-tooltip .tt-header {
      font-weight: 700;
      font-size: 14px;
      border-bottom: 1px solid #374151;
      padding-bottom: 8px;
      margin-bottom: 10px;
      color: #E5E7EB;
    }
    .custom-tooltip .tt-body {
      font-size: 12px;
      line-height: 1.5;
      white-space: normal;
    }
    .custom-tooltip .tt-body strong {
      color: #9CA3AF;
      font-weight: 600;
    }
  `]
})
export class MiHorarioAprendizComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  
  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  hoursRuler = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  eventChunks = signal<any[]>([]);

  ngOnInit() {
    // Fetch the learner's schedule matching their Ficha 
    const personaId = this.auth.userContextSignal()?.personaId;
    if (personaId) {
      this.http.get<any[]>(`http://localhost:3000/api/erp/v1/horarios/aprendiz/${personaId}`).subscribe(data => {
         const horario = data[0];
         if (horario && horario.detalles) {
           const mappedDetalles = horario.detalles.map((d: any) => ({
             ...d,
             ambienteName: horario.ambiente?.nombre || 'Amb'
           }));
           this.eventChunks.set(mappedDetalles);
         } else {
           this.eventChunks.set([]);
         }
      });
    }
  }

  renderedEvents = computed(() => {
    return this.eventChunks().map(d => {
       let colIndex = -1;
       if (typeof d.dia === 'number') {
         // Assuming 1 = Lunes, 2 = Martes, etc.
         colIndex = d.dia - 1;
       } else {
         colIndex = this.days.indexOf(d.dia);
       }
       
       const colStart = colIndex >= 0 ? colIndex + 1 : 1;
       const startHour = parseInt(d.hora_inicio.substring(0, 2));
       const endHour = parseInt(d.hora_fin.substring(0, 2));
       
       const instructorNombre = d.instructor?.nombre ? `${d.instructor.nombre} ${d.instructor.apellido || ''}`.trim() : 'Pendiente';
       
       return {
         ...d,
         col: colStart,
         rowStart: (startHour - 6) + 2,
         rowSpan: endHour - startHour,
         componenteText: d.es_transversal ? 'Transversal' : 'Específica',
         instructorName: instructorNombre,
         ambText: d.ambienteName, 
         timeText: `${d.hora_inicio.substring(0,5)} - ${d.hora_fin.substring(0,5)}`
       };
    });
  });

  downloadPdf() {
    alert('Función de generador PDF de Ficha implementable con el Backend.');
  }
  
  formatHour(h: number) { return `${h.toString().padStart(2, '0')}:00`; }
}

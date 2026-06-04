import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule, Paperclip, Send, X } from 'lucide-angular';
import { InstructorService } from '../../../core/services/instructor.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/table/table.component';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, DataTableComponent],
  template: `
    <div class="page-container">
       <div class="page-header">
         <div>
           <h1 class="page-title">Solicitudes de Cambio</h1>
           <p class="page-subtitle">Canalice modificaciones de horario mediante el líder de su área (Comuníquese con su líder)</p>
         </div>
       </div>
       
       <div class="list-container">
          <app-data-table 
             [columns]="tableCols()" 
             [data]="srv.solicitudesEnviadas()">
          </app-data-table>
       </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 22px; color: var(--color-text); font-weight: 600; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .header-actions { display: flex; gap: 12px; }
    
    .btn-primary { background: var(--color-primary); color: var(--color-white); border: none; padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; display: flex; gap: 8px; align-items: center; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: var(--color-white); color: var(--color-primary); border: 1px solid var(--color-primary); padding: 10px 16px; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; }

    /* Modals backdrop */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: var(--color-white); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 500px; display: flex; flex-direction: column; overflow: hidden; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 18px; }
    .close-btn { background: transparent; border: none; cursor: pointer; color: var(--color-text-muted); }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 12px; background: var(--color-bg); }
    
    .advanced-form { display: flex; flex-direction: column; gap: 16px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: var(--color-text); }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 14px; outline: none; transition: border 0.2s; background: var(--color-white); font-family: inherit;}
    .form-control:focus { border-color: var(--color-primary); }
    textarea { resize: none; }
  `]
})
export class SolicitudesComponent implements OnInit {
  srv = inject(InstructorService);
  fb = inject(FormBuilder);

  tableCols = signal<TableColumn[]>([
    { field: 'tipo_solicitud', header: 'Tipo' },
    { field: 'descripcion', header: 'Justificación Emitida' },
    { field: 'estado', header: 'Estado', isBadge: true },
    { field: 'fecha_solicitud', header: 'Fecha Realizada' }
  ]);

  ngOnInit() {
    this.srv.fetchSolicitudesEnviadas();
  }
}

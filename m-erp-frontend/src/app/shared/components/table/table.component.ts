import { Component, Output, EventEmitter, signal, computed, ChangeDetectionStrategy, input, ChangeDetectorRef, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronsUpDown, Pencil, Trash2, ChevronLeft, ChevronRight, Bell } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  field: string;
  header: string;
  isAction?: boolean;
  isNotifyAction?: boolean;
  isBadge?: boolean;
  isLiderazgo?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              @for (col of columns(); track col.field) {
                <th>
                  <div class="th-content">
                    <span>{{ col.header }}</span>
                    @if (!col.isAction) {
                      <lucide-icon name="chevrons-up-down" [size]="14"></lucide-icon>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of paginatedData(); track $index) {
              <tr>
                @for (col of columns(); track col.field) {
                  <td>
                    @if (col.isAction) {
                      <div class="actions-cell">
                        <button class="action-btn edit" (click)="onEdit.emit(row)">
                          <lucide-icon name="pencil" [size]="16"></lucide-icon>
                        </button>
                        <button class="action-btn delete" (click)="onDelete.emit(row)">
                          <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                        </button>
                      </div>
                    } @else if (col.isNotifyAction) {
                      <div class="actions-cell">
                        <button class="action-btn notify" [disabled]="row.estado !== 'aprobado' && row.estado !== 'rechazado'" (click)="onNotify.emit(row)" title="Notificar Instructor">
                          <lucide-icon name="bell" [size]="16"></lucide-icon>
                        </button>
                      </div>
                    } @else if (col.isBadge) {
                      <span class="badge" 
                            [class.active]="row[col.field] === 'Activo' || row[col.field] === true" 
                            [class.inactive]="row[col.field] === 'Inactivo' || row[col.field] === false"
                            [class.aprobado]="row[col.field] === 'Aprobado'"
                            [class.rechazado]="row[col.field] === 'Rechazado'"
                            [class.enviado]="row[col.field] === 'Enviado' || row[col.field] === 'Pendiente'">
                        {{ row[col.field] === true ? 'Activo' : row[col.field] === false ? 'Inactivo' : row[col.field] }}
                      </span>
                    } @else if (col.isLiderazgo) {
                      <div class="liderazgo-badges">
                        @if (row.es_lider_area) {
                          <span class="badge lider-area">Líder {{ row.nombre_area }}</span>
                        }
                        @if (row.es_lider_ficha) {
                          <span class="badge lider-ficha">Líder Ficha {{ row.numero_ficha }}</span>
                        }
                        @if (!row.es_lider_area && !row.es_lider_ficha) {
                          <span class="text-muted">—</span>
                        }
                      </div>
                    } @else {
                      {{ row[col.field] }}
                    }
                  </td>
                }
              </tr>
            }
            @if (data().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length" class="empty-state">
                  No hay datos para mostrar
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="pagination-footer">
        <div class="page-info">
          Mostrando {{ (currentPage() - 1) * pageSize() + 1 }} - 
          {{ min(currentPage() * pageSize(), data().length) }} de {{ data().length }} resultados
        </div>
        
        <div class="page-controls">
          <select [(ngModel)]="pageSize" (change)="currentPage.set(1)" class="page-select">
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
          </select>

          <button class="page-btn nav" [disabled]="currentPage() === 1" (click)="currentPage.update(p => p - 1)">
            <lucide-icon name="chevron-left" [size]="16"></lucide-icon>
          </button>
          
          @for (page of totalPagesArray(); track $index) {
            <button class="page-btn" [class.active]="page === currentPage()" (click)="currentPage.set(page)">
              {{ page }}
            </button>
          }

          <button class="page-btn nav" [disabled]="currentPage() === totalPages()" (click)="currentPage.update(p => p + 1)">
            <lucide-icon name="chevron-right" [size]="16"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    thead {
      background: var(--color-bg);
    }

    th {
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-muted);
      text-transform: uppercase;
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
    }

    .th-content {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    tbody tr {
      background: var(--color-white);
      border-bottom: 1px solid #F0F2F4;
      transition: background 0.15s;
    }

    tbody tr:hover {
      background: #F9FAFB;
    }

    tbody tr:last-child {
      border-bottom: none;
    }

    td {
      padding: 13px 16px;
      font-size: 14px;
      color: var(--color-text);
      vertical-align: middle;
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--color-text-muted);
      font-size: 14px;
    }

    .actions-cell {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-radius: var(--radius-sm);
      transition: all 0.2s;
    }

    .action-btn.edit {
      color: var(--color-primary);
    }

    .action-btn.edit:hover {
      background: var(--color-primary-light);
    }

    .action-btn.delete {
      color: var(--color-danger);
    }

    .action-btn.delete:hover {
      background: var(--color-danger-light);
    }

    .action-btn.notify {
      color: #D97706; /* Amber-600 */
    }

    .action-btn.notify:hover:not(:disabled) {
      background: #FEF3C7; /* Amber-100 */
    }

    .action-btn.notify:disabled {
      color: #D1D5DB; /* Gray-300 */
      cursor: not-allowed;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge.active {
      background: var(--color-primary-light);
      color: var(--color-primary-dark);
    }

    .badge.inactive {
      background: var(--color-danger-light);
      color: #991B1B;
    }

    .badge.aprobado {
      background: #DCFCE7;
      color: #166534;
      font-weight: 700;
      border: 1px solid #BBF7D0;
      box-shadow: 0 2px 4px rgba(22, 101, 52, 0.1);
    }

    .badge.rechazado {
      background: #FEE2E2;
      color: #991B1B;
      font-weight: 700;
      border: 1px solid #FECACA;
      box-shadow: 0 2px 4px rgba(153, 27, 27, 0.1);
    }

    .badge.enviado {
      background: #FEF3C7;
      color: #92400E;
      font-weight: 700;
      border: 1px solid #FDE68A;
      box-shadow: 0 2px 4px rgba(146, 64, 14, 0.1);
    }

    .liderazgo-badges {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }

    .badge.lider-area {
      background: #1B5C3A;
      color: white;
    }

    .badge.lider-ficha {
      background: #EFF6FF;
      color: #1E40AF;
    }

    .text-muted {
      color: var(--color-text-muted);
    }

    /* Paginación */
    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-top: 1px solid var(--color-border);
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-info {
      color: var(--color-text-muted);
      font-size: 13px;
    }

    .page-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-select {
      background: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 6px 32px 6px 12px;
      font-size: 13px;
      color: var(--color-text);
      outline: none;
      margin-right: 8px;
    }
    
    .page-select:focus {
      border-color: var(--color-primary);
    }

    .page-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      background: var(--color-white);
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: var(--color-bg);
      color: var(--color-text);
    }

    .page-btn.active {
      background: var(--color-primary);
      color: var(--color-white);
      border-color: var(--color-primary);
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class DataTableComponent implements OnInit, OnChanges {
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  ngOnChanges() {
    this.cdr.detectChanges();
  }

  columns = input<TableColumn[]>([]);
  data = input<any[]>([]);
  
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onNotify = new EventEmitter<any>();

  currentPage = signal(1);
  pageSize = signal(10);

  min(a: number, b: number) { return Math.min(a, b); }

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.data().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.data().length / this.pageSize()) || 1);
  
  totalPagesArray = computed(() => 
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-superadmin-usuarios',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Usuarios Globales</h1>
          <p>Directorio nacional de todos los usuarios registrados</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-toolbar">
          <div class="search-box">
            <lucide-icon name="search" [size]="18" class="text-gray"></lucide-icon>
            <input type="text" placeholder="Buscar por nombre o documento..." [(ngModel)]="searchTerm" />
          </div>
          <div class="filter-box">
            <select [(ngModel)]="selectedRole">
              <option value="">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Instructor">Instructor</option>
              <option value="Aprendiz">Aprendiz</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre Completo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th class="text-right">Sede (Tenant)</th>
              </tr>
            </thead>
            <tbody>
              @for (u of filteredUsuarios(); track u.id) {
                <tr>
                  <td class="font-medium">{{ u.credencial?.username || 'N/A' }}</td>
                  <td>{{ u.persona?.nombre }} {{ u.persona?.apellido }}</td>
                  <td><span class="badge gray">{{ u.rol?.nombre }}</span></td>
                  <td>
                    <span class="badge" [class.success]="u.estado" [class.danger]="!u.estado">
                      {{ u.estado ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="text-right font-medium text-gray">
                    <!-- Si tiene sede_id, lo ideal sería cruzar con el array de sedes para ver el nombre. Como simplificación mostraremos el UUID o "Global" si es null -->
                    {{ u.persona?.sede_id || 'Nacional' }}
                  </td>
                </tr>
              }
              @if (filteredUsuarios().length === 0) {
                <tr>
                  <td colspan="5" class="text-center text-gray py-8">
                    No se encontraron usuarios
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
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #111827; }
    .page-header p { margin: 0; color: #6B7280; font-size: 14px; }
    
    .panel { background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #F3F4F6; overflow: hidden; }
    
    .panel-toolbar { display: flex; gap: 16px; padding: 16px 20px; border-bottom: 1px solid #F3F4F6; background: #F9FAFB; }
    .search-box { display: flex; align-items: center; background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; padding: 0 12px; flex: 1; max-width: 400px; }
    .search-box input { border: none; outline: none; padding: 10px; width: 100%; font-size: 14px; }
    .filter-box select { padding: 10px 12px; border: 1px solid #D1D5DB; border-radius: 8px; background: #FFFFFF; font-size: 14px; outline: none; }
    
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { background: #FFFFFF; padding: 12px 20px; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
    .data-table td { padding: 16px 20px; font-size: 14px; color: #374151; border-bottom: 1px solid #F3F4F6; }
    
    .font-medium { font-weight: 500; color: #111827 !important; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-gray { color: #6B7280; }
    .py-8 { padding-top: 32px !important; padding-bottom: 32px !important; }

    .badge { display: inline-flex; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    .badge.success { background: #D1FAE5; color: #065F46; }
    .badge.danger { background: #FEE2E2; color: #991B1B; }
    .badge.gray { background: #F3F4F6; color: #374151; }
  `]
})
export class SuperadminUsuariosComponent implements OnInit {
  private http = inject(HttpClient);
  
  usuarios = signal<any[]>([]);
  searchTerm = '';
  selectedRole = '';

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/erp/v1/superadmin/usuarios').subscribe(data => {
      this.usuarios.set(data);
    });
  }

  filteredUsuarios() {
    return this.usuarios().filter(u => {
      const matchSearch = (u.persona?.nombre || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                          (u.credencial?.username || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchRole = this.selectedRole ? u.rol?.nombre === this.selectedRole : true;
      return matchSearch && matchRole;
    });
  }
}

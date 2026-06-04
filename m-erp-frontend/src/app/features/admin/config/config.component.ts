import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AdminConfigService } from '../../../core/services/admin-config.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {
  srv = inject(AdminConfigService);

  // Tabs structure
  sections = [
    {
      title: 'Ubicaciones',
      items: [
        { id: 'departamentos', label: 'Departamentos' },
        { id: 'municipios', label: 'Municipios' }
      ]
    },
    {
      title: 'Organización',
      items: [
        { id: 'centros', label: 'Centro de Formación' },
        { id: 'sedes', label: 'Sedes' },
        { id: 'areas', label: 'Áreas' },
        { id: 'programas', label: 'Programas' }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'aplicativos', label: 'Aplicativos' }
      ]
    },
    {
      title: 'Auditoría',
      items: [
        { id: 'accesos', label: 'Accesos' }
      ]
    }
  ];

  activeTab: string = 'departamentos';

  // Modal Control
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  
  // Generic Payload
  payload: any = {};

  // For Cascade Lookups during creation/editing
  filterOptions = {
    departamento_id: '',
    centro_id: '',
    sede_id: '',
    area_id: '',
    aplicativo_id: ''
  };

  // Auditorium filters
  auditFilters = {
    search: '',
    start_date: '',
    end_date: '',
    aplicativo_id: ''
  };

  errorMessage = '';

  ngOnInit() {
    this.switchTab(this.activeTab);
  }

  // CASCADA SELECT FIELDS IN HEADER
  onFilterChange(type: string): void {
    if (type === 'departamento') { this.srv.fetchMunicipios(this.filterOptions.departamento_id); return; }
    if (type === 'centro') { this.srv.fetchSedes(this.filterOptions.centro_id); return; }
    if (type === 'sede') { this.srv.fetchAreas(this.filterOptions.sede_id); return; }
    if (type === 'area') { this.srv.fetchProgramas(this.filterOptions.area_id); return; }
  }

  // TABS LOGIC
  switchTab(tabId: string) {
    this.activeTab = tabId;
    this.errorMessage = '';
    if (tabId === 'departamentos') this.srv.fetchDepartamentos();
    if (tabId === 'municipios') {
      this.srv.fetchDepartamentos();
      this.srv.fetchMunicipios();
    }
    if (tabId === 'centros') this.srv.fetchCentros();
    if (tabId === 'sedes') {
      this.srv.fetchCentros();
      this.srv.fetchSedes();
    }
    if (tabId === 'areas') {
      this.srv.fetchSedes();
      this.srv.fetchAreas();
      this.srv.fetchInstructores(); // For Lider dropdown
    }
    if (tabId === 'programas') {
      this.srv.fetchAreas();
      this.srv.fetchProgramas();
    }
    if (tabId === 'aplicativos') this.srv.fetchAplicativos();
    if (tabId === 'accesos') {
      this.srv.fetchAplicativos();
      this.fetchAccesos(1);
    }
  }

  // ACCESOS PAGINATION
  fetchAccesos(page: number = 1) {
    this.srv.fetchAccesos({ ...this.auditFilters, page, limit: 10 });
  }

  getPagesArray() {
    const total = this.srv.accesos().meta.totalPages;
    return Array(total).fill(0).map((x, i) => i + 1);
  }

  // MODAL LOGIC
  openModal(mode: 'create' | 'edit', row?: any) {
    this.modalMode = mode;
    this.errorMessage = '';
    
    if (mode === 'create') {
      this.payload = {};
      if (this.activeTab === 'municipios') this.payload.departamento_id = this.filterOptions.departamento_id;
      if (this.activeTab === 'sedes') this.payload.centro_id = this.filterOptions.centro_id;
      if (this.activeTab === 'areas') this.payload.sede_id = this.filterOptions.sede_id;
      if (this.activeTab === 'programas') this.payload.area_id = this.filterOptions.area_id;
    } else {
      this.payload = { ...row };
      // Map relations IDs for easy ngModel binding
      if (row.departamento) this.payload.departamento_id = row.departamento.id;
      if (row.centro) this.payload.centro_id = row.centro.id;
      if (row.sede) this.payload.sede_id = row.sede.id;
      if (row.area) this.payload.area_id = row.area.id;
      if (row.lider) this.payload.lider_id = row.lider.id;
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveEntity() {
    const isCreate = this.modalMode === 'create';
    const id = this.payload.id;

    const request = isCreate
      ? this.srv.createEntity(this.activeTab, this.payload)
      : this.srv.updateEntity(this.activeTab, id, this.payload);

    request.subscribe({
      next: () => {
        this.switchTab(this.activeTab); // refresh table
        this.closeModal();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error occurred';
      }
    });
  }

  deleteEntity(id: string) {
    if (!confirm('¿Seguro que desea eliminar este registro?')) return;
    this.srv.deleteEntity(this.activeTab, id).subscribe({
      next: () => this.switchTab(this.activeTab),
      error: (err) => {
        alert(err.error?.message || 'Error deleting item');
      }
    });
  }
}

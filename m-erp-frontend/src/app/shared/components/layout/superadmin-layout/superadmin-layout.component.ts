import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-superadmin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="layout-wrapper">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-box">
            <lucide-icon name="shield" color="#FFD700" [size]="24"></lucide-icon>
          </div>
          <span class="brand-text">ChronoGest Nacional</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/superadmin/dashboard" routerLinkActive="active" class="nav-item">
            <lucide-icon name="layout-dashboard" [size]="20"></lucide-icon>
            <span>Dashboard Global</span>
          </a>
          <a routerLink="/superadmin/sedes" routerLinkActive="active" class="nav-item">
            <lucide-icon name="building-2" [size]="20"></lucide-icon>
            <span>Gestión de Sedes</span>
          </a>
          <a routerLink="/superadmin/usuarios" routerLinkActive="active" class="nav-item">
            <lucide-icon name="users" [size]="20"></lucide-icon>
            <span>Usuarios Globales</span>
          </a>
          <a routerLink="/superadmin/reportes" routerLinkActive="active" class="nav-item">
            <lucide-icon name="bar-chart-3" [size]="20"></lucide-icon>
            <span>Reportes Nacionales</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <lucide-icon name="log-out" [size]="20"></lucide-icon>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Navbar -->
        <header class="navbar">
          <div class="navbar-left">
            <h2 class="page-title">Panel Super Administrador</h2>
          </div>
          
          <div class="navbar-right">
            <!-- Selector de Sede -->
            <div class="tenant-selector">
              <lucide-icon name="map-pin" [size]="16" class="tenant-icon"></lucide-icon>
              <select [value]="currentTenant()" (change)="onTenantChange($event)">
                <option value="">-- Vista Global --</option>
                @for (sede of sedes(); track sede.id) {
                  <option [value]="sede.codigo">{{ sede.nombre }} ({{ sede.codigo }})</option>
                }
              </select>
            </div>

            <div class="user-profile">
              <div class="avatar">SA</div>
              <span class="user-name">Super Administrador</span>
            </div>
          </div>
        </header>

        <!-- Router Outlet -->
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: 'Inter', system-ui, sans-serif;
      background: #F3F4F6;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: #0D3321;
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255,255,255,0.1);
      z-index: 10;
    }

    .sidebar-header {
      padding: 24px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo-box {
      background: rgba(255, 215, 0, 0.1);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-text {
      font-size: 16px;
      font-weight: 700;
      color: #FFD700;
      letter-spacing: -0.02em;
    }

    .sidebar-nav {
      flex: 1;
      padding: 24px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: #D1FAE5;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #FFFFFF;
    }

    .nav-item.active {
      background: rgba(255, 215, 0, 0.15);
      color: #FFD700;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: #D1FAE5;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      background: rgba(220, 38, 38, 0.1);
      color: #FCA5A5;
      border-color: rgba(220, 38, 38, 0.3);
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .navbar {
      height: 70px;
      background: #FFFFFF;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
    }

    .page-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .tenant-selector {
      display: flex;
      align-items: center;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 0 12px;
      height: 38px;
    }

    .tenant-icon {
      color: #6B7280;
      margin-right: 8px;
    }

    .tenant-selector select {
      background: transparent;
      border: none;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      outline: none;
      cursor: pointer;
      padding-right: 8px;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #0D3321 0%, #16A34A 100%);
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .content-area {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
  `]
})
export class SuperadminLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  // We mock the tenant service for now, or just use localStorage
  
  sedes = signal<any[]>([]);
  currentTenant = signal<string>('');

  ngOnInit() {
    this.loadSedes();
    this.currentTenant.set(localStorage.getItem('tenant_id') || '');
  }

  loadSedes() {
    this.http.get<any[]>('http://localhost:3000/api/erp/v1/superadmin/sedes').subscribe({
      next: (data) => this.sedes.set(data),
      error: (err) => console.error(err)
    });
  }

  onTenantChange(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    this.currentTenant.set(code);
    if (code) {
      localStorage.setItem('tenant_id', code);
    } else {
      localStorage.removeItem('tenant_id');
    }
    // Opcional: Recargar la página o disparar evento
    window.location.reload();
  }

  logout() {
    this.authService.logout();
  }
}

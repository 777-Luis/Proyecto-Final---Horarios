import { Component, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, CalendarDays, BookOpen, Building2, CalendarCheck, ClipboardList, UserCircle, ClipboardCheck, Settings, LogOut } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <aside class="sidebar">
      <div class="logo-container">
        <span class="logo-short">CG</span>
        <span class="logo-full">ChronoGest</span>
      </div>

      <nav class="nav-links">
        @for (link of menuLinks(); track link.label) {
          @if (link.children) {
            <div class="nav-group">
              <a class="nav-item" [class.active]="isParentActive(link)" (click)="toggleMenu(link.label, $event)">
                <lucide-icon [name]="link.icon" [size]="20" [strokeWidth]="2"></lucide-icon>
                <span class="nav-text">{{ link.label }}</span>
                <lucide-icon class="chevron-icon nav-text" [name]="expandedMenus[link.label] ? 'chevron-down' : 'chevron-right'" [size]="16"></lucide-icon>
              </a>
              @if (expandedMenus[link.label]) {
                <div class="sub-menu">
                  @for (child of link.children; track child.path) {
                    <a [routerLink]="child.path" routerLinkActive="active" class="nav-item sub-item">
                      <lucide-icon [name]="child.icon" [size]="18" [strokeWidth]="2"></lucide-icon>
                      <span class="nav-text">{{ child.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          } @else {
            <a [routerLink]="link.path" routerLinkActive="active" class="nav-item">
              <lucide-icon [name]="link.icon" [size]="20" [strokeWidth]="2"></lucide-icon>
              <span class="nav-text">{{ link.label }}</span>
            </a>
          }
        }
      </nav>

      <div class="logout-container">
        <a class="nav-item logout" (click)="logout()">
          <lucide-icon name="log-out" [size]="20" [strokeWidth]="2"></lucide-icon>
          <span class="nav-text">Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: var(--sidebar-collapsed);
      background-color: #1B5C3A;
      transition: var(--sidebar-transition);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 4px 0 16px rgba(0,0,0,0.15);
    }

    .sidebar:hover {
      width: var(--sidebar-expanded);
    }

    .logo-container {
      height: var(--navbar-height);
      display: flex;
      align-items: center;
      padding: 0 20px;
      white-space: nowrap;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      color: var(--color-white);
    }

    .logo-short {
      font-weight: 700;
      font-size: 18px;
      min-width: 24px;
      text-align: center;
    }

    .logo-full {
      margin-left: 16px;
      font-weight: 600;
      font-size: 20px;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .sidebar:hover .logo-full {
      opacity: 1;
    }

    .nav-links {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      position: relative;
    }

    .nav-item:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: var(--color-white);
    }

    .nav-item.active {
      background-color: #2E7D52;
      border-left: 3px solid #4CAF7D;
      color: var(--color-white);
      padding-left: 13px; /* Compensar borde */
    }

    .nav-text {
      margin-left: 16px;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.25s ease;
      flex: 1;
    }
    
    .chevron-icon {
      margin-left: auto;
      flex: 0 0 auto;
    }

    .sidebar:hover .nav-text {
      opacity: 1;
    }
    
    .sub-menu {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: rgba(0, 0, 0, 0.1);
    }
    
    .sub-item {
      padding-left: 32px; /* 16px from normal + 16px indentation */
    }
    
    .sub-item.active {
      padding-left: 29px; /* Compensar borde 3px */
    }

    .logout-container {
      padding: 16px 0;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .logout {
      color: #F87171 !important;
    }
  `]
})
export class SidebarComponent implements OnInit, OnChanges {
  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  expandedMenus: { [key: string]: boolean } = {};

  ngOnInit() {
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(), 0);
    
    // Auto-expand menu if a child is active
    const links = this.menuLinks();
    links.forEach(link => {
      if (link.children && this.isParentActive(link)) {
        this.expandedMenus[link.label] = true;
      }
    });
  }

  ngOnChanges() {
    this.cdr.detectChanges();
  }

  private authService = inject(AuthService);

  toggleMenu(label: string, event: Event) {
    event.preventDefault();
    this.expandedMenus[label] = !this.expandedMenus[label];
  }

  isParentActive(link: any): boolean {
    if (!link.children) return false;
    return link.children.some((child: any) => this.router.isActive(child.path, { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' }));
  }

  // Menu Builder by Role explicitly
  readonly menuLinks = computed(() => {
    const role = this.authService.currentRole();
    const isLider = this.authService.isLeader();

    let links: any[] = [];
    if (role === 'Administrador') {
      links = [
        { path: '/admin/dashboard', icon: 'layout-dashboard', label: 'Inicio' },
        { 
          icon: 'calendar-days', 
          label: 'Horarios',
          children: [
            { path: '/admin/horarios/instructor', icon: 'user-check', label: 'Horarios de Instructor' },
            { path: '/admin/horarios/fichas', icon: 'book-open', label: 'Horarios de Fichas' },
            { path: '/admin/horarios/ambientes', icon: 'building-2', label: 'Horarios de Ambientes' }
          ]
        },
        { path: '/admin/solicitudes', icon: 'clipboard-list', label: 'Solicitudes' },
        { path: '/admin/usuarios', icon: 'users', label: 'Usuarios' },
        { path: '/admin/planeacion', icon: 'gantt-chart-square', label: 'Planeación' },
        { path: '/admin/configuracion', icon: 'settings', label: 'Configuración' },
      ];
      } else if (role === 'Instructor') {
        links = [
          { path: '/instructor/mi-horario', icon: 'calendar-check', label: 'Mi Horario' },
          { path: '/instructor/perfil', icon: 'user-circle', label: 'Mi Perfil' },
        ];
        if (isLider) {
          links.splice(1, 0, { path: '/instructor/mis-solicitudes', icon: 'clipboard-list', label: 'Gestión de Solicitudes' });
        }
    } else if (role === 'Aprendiz') {
      links = [
        { path: '/aprendiz/mi-horario', icon: 'calendar-check', label: 'Mi Horario' },
        { path: '/aprendiz/perfil', icon: 'user-circle', label: 'Mi Perfil' },
      ];
    }

    return links;
  });

  logout() {
    this.authService.logout();
  }
}

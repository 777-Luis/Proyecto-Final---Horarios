import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, UserCircle } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="navbar">
      <div class="spacer"></div>
      
      <div class="actions">
        <!-- Notificaciones Dropdown -->
        <div class="notification-trigger" (click)="toggleNotifications()">
          <lucide-icon name="bell" [size]="20" color="#6B7280"></lucide-icon>
          @if (unreadCount() > 0) {
            <span class="badge"></span>
          }
          
          @if (showNotifications()) {
            <div class="dropdown-menu" (click)="$event.stopPropagation()">
              <div class="dropdown-header">Notificaciones</div>
              
              <div class="dropdown-body custom-scroll">
                 @if (notificaciones().length === 0) {
                   <div class="empty-state">No hay notificaciones nuevas</div>
                 } @else {
                   @for (notif of notificaciones(); track notif.id) {
                     <div class="notif-item" [class.unread]="!notif.leida" (click)="markAsRead(notif.id)">
                        <div class="notif-content">
                          <div class="notif-message">{{ notif.mensaje }}</div>
                          <div class="notif-time">{{ formatDate(notif.fecha_creacion) }}</div>
                        </div>
                        @if (!notif.leida) {
                          <div class="unread-dot"></div>
                        }
                     </div>
                   }
                 }
              </div>
            </div>
          }
        </div>

        <div class="user-profile">
           <div class="avatar"><lucide-icon name="user-circle" [size]="20"></lucide-icon></div>
           <div class="user-info">
             <span class="user-name">{{ userName() }}</span>
             <span class="user-role">{{ roleText() }}</span>
           </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: var(--navbar-height);
      background-color: var(--color-white);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .spacer {
      flex: 1;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .notification-trigger {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-bg);
      transition: background 0.2s;
    }

    .notification-trigger:hover {
      background: var(--color-border);
    }

    .badge {
      position: absolute;
      top: 6px;
      right: 8px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #EF4444; /* Rojo para destacar alertas */
      border: 2px solid var(--color-white);
    }

    .dropdown-menu {
      position: absolute;
      top: 45px;
      right: -10px;
      width: 320px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      overflow: hidden;
      cursor: default;
    }

    .dropdown-header {
      padding: 16px;
      font-weight: 600;
      border-bottom: 1px solid var(--color-border);
      font-size: 14px;
      background: #F9FAFB;
    }

    .dropdown-body {
      max-height: 350px;
      overflow-y: auto;
    }
    
    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--color-text-muted);
      font-size: 13px;
    }

    .notif-item {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .notif-item:hover {
      background: #F3F4F6;
    }

    .notif-item.unread {
      background: #F0FDF4; /* Verde muy claro indicando nuevo en el sistema */
    }

    .notif-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notif-message {
      font-size: 13px;
      color: var(--color-text);
      line-height: 1.4;
    }

    .notif-time {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #2E7D52;
      flex-shrink: 0;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text);
    }

    .user-role {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .custom-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #D1D5DB;
      border-radius: 4px;
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notifService = inject(NotificacionesService);
  private cdr = inject(ChangeDetectorRef);
  
  showNotifications = signal(false);
  
  unreadCount = this.notifService.unreadCount;
  notificaciones = this.notifService.notificaciones;
  
  userName = computed(() => {
    const context: any = this.authService.userContextSignal();
    return context?.nombre || 'Usuario Actual';
  }); 

  roleText = computed(() => {
    const rawRole = this.authService.currentRole();
    if (rawRole === 'Instructor' && this.authService.isLeader()) {
      return 'Instructor Líder';
    }
    return rawRole || 'Invitado';
  });

  ngOnInit() {
    this.notifService.startPolling();
  }

  ngOnDestroy() {
    this.notifService.stopPolling();
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }

  markAsRead(id: string) {
    this.notifService.markAsRead(id);
  }

  formatDate(d: string) {
    if(!d) return '';
    const date = new Date(d);
    return date.toLocaleString();
  }
}

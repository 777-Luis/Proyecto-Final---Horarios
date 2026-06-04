import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/erp/v1/notificaciones';

  notificaciones = signal<any[]>([]);
  unreadCount = signal(0);
  
  private pollingInterval: any;

  startPolling() {
    this.fetchNotificaciones();
    // Poll every 30 seconds
    this.pollingInterval = setInterval(() => {
       if (this.authService.isAuthenticated()) {
         this.fetchNotificaciones();
       }
    }, 30000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  fetchNotificaciones() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.notificaciones.set(data);
        const unread = data.filter(n => !n.leida).length;
        this.unreadCount.set(unread);
      },
      error: (e) => console.error("Error fetching notifications", e)
    });
  }

  markAsRead(id: string) {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).subscribe({
       next: () => {
         // Update local state optimistic
         this.notificaciones.update(current => 
            current.map(n => n.id === id ? { ...n, leida: true } : n)
         );
         this.unreadCount.update(c => Math.max(0, c - 1));
       }
    });
  }
}

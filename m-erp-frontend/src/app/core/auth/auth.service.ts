import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface UserContext {
  userId: string;
  role: string;
  personaId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Core Signals implementation
  private readonly tokenSignal = signal<string | null>(this.getInitialToken());
  readonly userContextSignal = signal<UserContext | null>(this.getInitialContext());
  private readonly isLiderSignal = signal<boolean>(false);

  // Computed derivatives
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly currentRole = computed(() => this.userContextSignal()?.role || null);
  readonly isLeader = computed(() => this.isLiderSignal());

  // APIs definitions
  private apiUrl = 'http://localhost:3000/api/erp/v1';

  constructor() {
    // If we reboot with a token, detect leader state right away
    if (this.isAuthenticated()) {
      this.detectLeaderState();
    }
  }

  private getInitialToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getInitialContext(): UserContext | null {
    const raw = localStorage.getItem('user_context');
    return raw ? JSON.parse(raw) : null;
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  login(credentials: any) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        const token = res.access_token;
        this.tokenSignal.set(token);
        localStorage.setItem('access_token', token);
        
        // Naive JWT decode fallback to extract context if necessary, 
        // assuming standard base64 structure.
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const context: UserContext = {
             userId: payload.userId,
             role: payload.role,
             personaId: payload.personaId
          };
          this.userContextSignal.set(context);
          localStorage.setItem('user_context', JSON.stringify(context));
          
          this.detectLeaderState();
        } catch(e) {}
      })
    );
  }

  logout() {
    this.tokenSignal.set(null);
    this.userContextSignal.set(null);
    this.isLiderSignal.set(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_context');
    this.router.navigate(['/auth/login']);
  }

  // Comprueba dinámicamente si es líder consultando las áreas
  private detectLeaderState() {
    if (this.currentRole() !== 'Instructor') return;

    this.http.get<any[]>(`${this.apiUrl}/areas`).pipe(
      catchError(() => of([]))
    ).subscribe((areas) => {
      const pId = this.userContextSignal()?.personaId;
      const leaderMatch = areas.some(a => a.lider?.id === pId);
      this.isLiderSignal.set(leaderMatch);
    });
  }
}

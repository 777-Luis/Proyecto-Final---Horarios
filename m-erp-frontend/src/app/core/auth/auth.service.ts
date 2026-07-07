import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface UserContext {
  userId: string;
  role: string;
  personaId: string;
  isSuperAdmin?: boolean;
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
  private readonly isLiderFichaSignal = signal<boolean>(false);

  // Computed derivatives
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly currentRole = computed(() => this.userContextSignal()?.role || null);
  readonly isLeader = computed(() => this.isLiderSignal());
  readonly isLeaderFicha = computed(() => this.isLiderFichaSignal());
  readonly isSuperAdmin = computed(() => this.userContextSignal()?.isSuperAdmin === true);
  readonly currentUserValue = this.userContextSignal; // Expose directly for guards if needed

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
        this.handleToken(res.access_token);
      })
    );
  }

  superadminLogin(credentials: any) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/superadmin/login`, credentials).pipe(
      tap((res) => {
        this.handleToken(res.access_token);
      })
    );
  }

  private handleToken(token: string) {
    this.tokenSignal.set(token);
    localStorage.setItem('access_token', token);
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const context: UserContext = {
         userId: payload.userId,
         role: payload.role,
         personaId: payload.personaId,
         isSuperAdmin: payload.isSuperAdmin
      };
      this.userContextSignal.set(context);
      localStorage.setItem('user_context', JSON.stringify(context));
      
      this.detectLeaderState();
    } catch(e) {}
  }

  logout() {
    this.tokenSignal.set(null);
    this.userContextSignal.set(null);
    this.isLiderSignal.set(false);
    this.isLiderFichaSignal.set(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_context');
    this.router.navigate(['/auth/login']);
  }

  // Comprueba dinámicamente si es líder consultando las áreas y fichas
  private detectLeaderState() {
    if (this.currentRole() !== 'Instructor') return;

    const pId = this.userContextSignal()?.personaId;
    if (!pId) return;

    this.http.get<any[]>(`${this.apiUrl}/areas`).pipe(
      catchError(() => of([]))
    ).subscribe((areas) => {
      const leaderMatch = areas.some(a => a.lider?.id === pId);
      this.isLiderSignal.set(leaderMatch);
    });

    this.http.get<any[]>(`${this.apiUrl}/cursos/mis-fichas-lideradas/${pId}`).pipe(
      catchError(() => of([]))
    ).subscribe((fichas) => {
      this.isLiderFichaSignal.set(fichas.length > 0);
    });
  }
}

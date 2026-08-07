import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: { name: string }[];
  permissions: string[];
  professional: {
    department: string;
    position: string;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  protected apiUrl =  `${environment.apiUrl}/api/v1`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Verificar se o utilizador já está logado ao iniciar
    if (this.getToken()) {
      this.loadUserProfile().subscribe();
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        this.setSession(response.token, response.user);
      })
    );
  }

  logout(): void {
    // Opcional: chamar endpoint de logout no backend
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private loadUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap(user => {
        localStorage.setItem('auth_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    // Simplificação: se for super-admin, tem tudo. Senão, verifica o array de permissões.
    if (user.roles.some(r => r.name === 'super-admin')) return true;
    return user.permissions.includes(permission);
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timeout, catchError, tap, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { User } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenSvc = inject(TokenService);
  private apiUrl = `${environment.apiUrl}/auth`;

  register(dto: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleName: string;
  }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/register`, dto);
  }

  login(email: string, password: string): Observable<{ token: string; user: User }> {
    console.log('[AUTH] Enviando login a:', `${this.apiUrl}/login`);
    console.log('[AUTH] Email:', email);

    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, password }).pipe(
      timeout(20000),

      tap(response => {
        console.log('[AUTH] Respuesta login recibida:', response);
      }),

      switchMap(response => {
        if (!response?.token) {
          throw new Error('El backend no devolvió token');
        }

        console.log('[AUTH] Token recibido. Length:', response.token.length);
        this.tokenSvc.saveToken(response.token);

        console.log('[AUTH] Pidiendo usuario actual:', `${environment.apiUrl}/users/me`);

        return this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
          timeout(20000),
          tap(user => {
            console.log('[AUTH] Usuario recibido:', user);
            this.tokenSvc.saveUser(user);
          }),
          map(user => ({ token: response.token, user }))
        );
      }),

      catchError(error => {
        console.error('[AUTH] Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.tokenSvc.clear();
  }

  isLoggedIn(): boolean {
    return !!this.tokenSvc.getToken();
  }

  getUser(): User | null {
    return this.tokenSvc.getUser();
  }
}
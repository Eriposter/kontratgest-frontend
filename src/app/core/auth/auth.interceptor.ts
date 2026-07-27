import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  
  // Obter o token do localStorage (ou de um Auth Service)
  const token = localStorage.getItem('auth_token');

  // Clonar o pedido e adicionar o cabeçalho Authorization
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  }

  // Enviar o pedido e tratar erros
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado ou inválido
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
      })
  );
};
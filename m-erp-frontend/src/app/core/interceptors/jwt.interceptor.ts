import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let clonedRequest = req;
  
  if (token) {
    const tenantId = localStorage.getItem('tenant_id');
    let headersConfig: any = {
      Authorization: `Bearer ${token}`
    };
    if (tenantId) {
      headersConfig['X-Tenant-Id'] = tenantId;
    }
    clonedRequest = req.clone({
      setHeaders: headersConfig
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si recibimos 401 Unauthorized, invalidamos la sesión para limpiar tokens rotos
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};

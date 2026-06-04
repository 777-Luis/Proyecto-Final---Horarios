import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () => import('./features/public/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
         path: 'recuperar',
         loadComponent: () => import('./features/auth/recover-password/recover-password.component').then(m => m.RecoverPasswordComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] },
        children: [
          { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
          { 
            path: 'horarios', 
            children: [
              { path: 'instructor', loadComponent: () => import('./features/admin/horarios/horarios.component').then(m => m.AdminHorariosComponent) },
              { path: 'fichas', loadComponent: () => import('./features/admin/cursos/cursos.component').then(m => m.AdminCursosComponent) },
              { path: 'ambientes', loadComponent: () => import('./features/admin/ambientes/ambientes.component').then(m => m.AdminAmbientesComponent) },
              { path: '', redirectTo: 'instructor', pathMatch: 'full' }
            ]
          },
          { path: 'solicitudes', loadComponent: () => import('./features/admin/solicitudes/solicitudes.component').then(m => m.AdminSolicitudesComponent) },
          { path: 'usuarios', loadComponent: () => import('./features/admin/users/users.component').then(m => m.AdminUsersComponent) },
          { path: 'planeacion', loadComponent: () => import('./features/admin/planeacion/planeacion.component').then(m => m.AdminPlaneacionComponent) }, 
          { path: 'configuracion', loadComponent: () => import('./features/admin/config/config.component').then(m => m.ConfigComponent) }
        ]
      },
      {
        path: 'instructor',
        canActivate: [roleGuard],
        data: { roles: ['Instructor'] },
        children: [
           { path: 'mi-horario', loadComponent: () => import('./features/instructor/mi-horario/mi-horario.component').then(m => m.MiHorarioComponent) },
           { path: 'solicitudes', loadComponent: () => import('./features/instructor/solicitudes/solicitudes.component').then(m => m.SolicitudesComponent) },
           { path: 'mis-solicitudes', loadComponent: () => import('./features/instructor/mis-solicitudes/mis-solicitudes.component').then(m => m.MisSolicitudesLiderComponent) },
           { path: 'perfil', loadComponent: () => import('./shared/components/perfil/perfil.component').then(m => m.PerfilComponent) },
        ]
      },
      {
        path: 'aprendiz',
        canActivate: [roleGuard],
        data: { roles: ['Aprendiz'] },
        children: [
           { path: 'mi-horario', loadComponent: () => import('./features/aprendiz/mi-horario/mi-horario-aprendiz.component').then(m => m.MiHorarioAprendizComponent) },
           { path: 'perfil', loadComponent: () => import('./shared/components/perfil/perfil.component').then(m => m.PerfilComponent) },
        ]
      },
      { path: '', redirectTo: 'auth/login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];

import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Rota pública
  { path: 'auth/login', component: LoginComponent },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Rotas protegidas pelo Layout e AuthGuard
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) 
      },
      { 
        path: 'entities', 
        loadComponent: () => import('./features/entities/entities').then(m => m.EntitiesComponent) 
      },
      { 
        path: 'contracts', 
        loadComponent: () => import('./features/contracts/contracts').then(m => m.ContractsComponent) 
      },
      // Adiciona aqui as outras rotas (guarantees, payments, etc.) no futuro
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { ProcedureDetailComponent } from './features/procurement/procedure-detail/procedure-detail';
import { ProcedureListComponent } from './features/procurement/procedure-list/procedure-list';

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
        path: 'pac', 
        loadComponent: () => import('./features/pac/pac').then(m => m.PACComponent) 
      },
      { 
        path: 'entities', 
        loadComponent: () => import('./features/entities/entities').then(m => m.EntitiesComponent) 
      },

      {
  path: 'procurement',
  children: [
    { path: '', component: ProcedureListComponent },
    { path: ':id', component: ProcedureDetailComponent }
  ]
},
      { 
        path: 'contracts', 
        loadComponent: () => import('./features/contracts/contracts').then(m => m.ContractsComponent) 
      },
      { 
        path: 'measurements', 
        loadComponent: () => import('./features/measurements/measurements').then(m => m.MeasurementsComponent) 
      },
      { 
        path: 'payments', 
        loadComponent: () => import('./features/payments/payments').then(m => m.PaymentsComponent) 
      },
      {
        path: 'guarantees',
        loadComponent: () => import('./features/guarantees/guarantees').then(m => m.GuaranteesComponent)
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent) 
      },
      // Adiciona aqui as outras rotas (guarantees, payments, etc.) no futuro
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
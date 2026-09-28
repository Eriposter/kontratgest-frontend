import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService, DashboardOverview } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
   
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  dashboardService = inject(DashboardService);

  user = (this.authService as any).currentUserSubject.value;
  overview: DashboardOverview | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';
    
    this.dashboardService.getOverview().subscribe({
      next: (response) => {
        this.overview = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar dados do dashboard';
        this.loading = false;
        console.error(err);
      }
    });
  }

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K ${currency}`;
    }
    return `${value.toFixed(2)} ${currency}`;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 19) return 'Boa tarde';
    return 'Boa noite';
  }
}
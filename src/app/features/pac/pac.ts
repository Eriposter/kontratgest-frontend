import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PACService, AnnualContractPlan } from '../../core/services/pac.service';
import { PACDetailComponent } from './pac-detail/pac-detail';
import { PACFormComponent } from './pac-form/pac-form';

@Component({
  selector: 'app-pac',
  standalone: true,
  imports: [CommonModule, FormsModule, PACDetailComponent, PACFormComponent],
  templateUrl: './pac.html',
  styleUrls: ['./pac.scss'],
   
})
export class PACComponent implements OnInit {
  private pacService = inject(PACService);

  plans: AnnualContractPlan[] = [];
  loading = true;
  error = '';

  // Filtros
  searchQuery = '';
  selectedYear: number | null = null;
  selectedStatus = '';

  // Paginação
  currentPage = 1;
  totalPages = 1;
  totalPlans = 0;
  perPage = 10;

  // Modais
  showDetailModal = false;
  selectedPlan: AnnualContractPlan | null = null;
  showFormModal = false;
  editingPlan: AnnualContractPlan | null = null;

  // Métricas
  metrics = {
    total: 0,
    draft: 0,
    approved: 0,
    inProgress: 0,
    completed: 0,
    totalPlanned: 0,
    totalExecuted: 0
  };

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedYear) params.year = this.selectedYear;
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.pacService.list(params).subscribe({
      next: (response) => {
        this.plans = response.data;
        this.totalPages = response.meta.last_page;
        this.totalPlans = response.meta.total;
        this.calculateMetrics();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar planos';
        this.loading = false;
        console.error(err);
      }
    });
  }

  calculateMetrics(): void {
    this.metrics.total = this.totalPlans;
    this.metrics.draft = this.plans.filter(p => p.status === 'draft').length;
    this.metrics.approved = this.plans.filter(p => p.status === 'approved').length;
    this.metrics.inProgress = this.plans.filter(p => p.status === 'in_progress').length;
    this.metrics.completed = this.plans.filter(p => p.status === 'completed').length;
    this.metrics.totalPlanned = this.plans.reduce((sum, p) => sum + p.financial.total_planned, 0);
    this.metrics.totalExecuted = this.plans.reduce((sum, p) => sum + p.financial.total_executed, 0);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPlans();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPlans();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPlans();
    }
  }

  viewDetails(plan: AnnualContractPlan): void {
    this.selectedPlan = plan;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedPlan = null;
  }

  openCreateModal(): void {
    this.editingPlan = null;
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingPlan = null;
  }

  onPlanSaved(): void {
    this.loadPlans();
    this.closeFormModal();
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'draft': { label: 'Rascunho', class: 'status--draft', icon: '' },
      'submitted': { label: 'Submetido', class: 'status--submitted', icon: '' },
      'approved': { label: 'Aprovado', class: 'status--approved', icon: '' },
      'in_progress': { label: 'Em Execução', class: 'status--in-progress', icon: '' },
      'completed': { label: 'Concluído', class: 'status--completed', icon: '' },
      'cancelled': { label: 'Cancelado', class: 'status--cancelled', icon: '' }
    };
    return statuses[status] || { label: status, class: '', icon: '' };
  }

  getExecutionClass(plan: AnnualContractPlan): string {
    const pct = plan.financial.execution_percentage;
    if (pct === 0) return 'execution--none';
    if (pct < 50) return 'execution--low';
    if (pct < 100) return 'execution--medium';
    return 'execution--complete';
  }

  formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B AOA`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M AOA`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K AOA`;
    return `${value.toFixed(2)} AOA`;
  }

  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }
}
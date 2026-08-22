import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuaranteeService, Guarantee } from '../../core/services/guarantee.service';
import { GuaranteeDetailComponent } from './guarantee-detail/guarantee-detail';
import { GuaranteeFormComponent } from './guarantee-form/guarantee-form';

@Component({
  selector: 'app-guarantees',
  standalone: true,
  imports: [CommonModule, FormsModule, GuaranteeDetailComponent, GuaranteeFormComponent],
  templateUrl: './guarantees.html',
  styleUrls: ['./guarantees.scss'],
   
})
export class GuaranteesComponent implements OnInit {
  private guaranteeService = inject(GuaranteeService);

  guarantees: Guarantee[] = [];
  loading = true;
  error = '';

  // Filtros
  searchQuery = '';
  selectedStatus = '';
  selectedType = '';
  selectedPurpose = '';

  // Paginação
  currentPage = 1;
  totalPages = 1;
  totalGuarantees = 0;
  perPage = 10;

  // Modais
  showDetailModal = false;
  selectedGuarantee: Guarantee | null = null;
  showFormModal = false;

  // Métricas
  metrics = {
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    released: 0,
    totalValue: 0
  };

  ngOnInit(): void {
    this.loadGuarantees();
  }

  loadGuarantees(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedType) params.type = this.selectedType;
    if (this.selectedPurpose) params.purpose = this.selectedPurpose;

    this.guaranteeService.list(params).subscribe({
      next: (response) => {
        this.guarantees = response.data;
        this.totalPages = response.meta.last_page;
        this.totalGuarantees = response.meta.total;
        this.calculateMetrics();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar cauções';
        this.loading = false;
        console.error(err);
      }
    });
  }

  calculateMetrics(): void {
    this.metrics.total = this.totalGuarantees;
    this.metrics.active = this.guarantees.filter(g => g.status === 'active').length;
    this.metrics.expiring = this.guarantees.filter(g => g.dates.is_expiring_soon && !g.dates.is_expired).length;
    this.metrics.expired = this.guarantees.filter(g => g.dates.is_expired).length;
    this.metrics.released = this.guarantees.filter(g => g.status === 'released').length;
    this.metrics.totalValue = this.guarantees
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + g.financial.amount_in_aoa, 0);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadGuarantees();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadGuarantees();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadGuarantees();
    }
  }

  viewDetails(guarantee: Guarantee): void {
    this.selectedGuarantee = guarantee;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedGuarantee = null;
  }

  openCreateModal(): void {
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
  }

  onGuaranteeSaved(): void {
    this.loadGuarantees();
    this.closeFormModal();
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'active': { label: 'Ativa', class: 'status--active', icon: '🟢' },
      'released': { label: 'Libertada', class: 'status--released', icon: '✅' },
      'executed': { label: 'Executada', class: 'status--executed', icon: '⚡' },
      'cancelled': { label: 'Cancelada', class: 'status--cancelled', icon: '🚫' },
      'expired': { label: 'Expirada', class: 'status--expired', icon: '⏰' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
  }

  getExpiryInfo(guarantee: Guarantee): { text: string; class: string } | null {
    if (guarantee.dates.is_expired) {
      return { text: 'Expirada', class: 'expiry--expired' };
    }
    if (guarantee.dates.is_expiring_soon) {
      return { text: `${guarantee.dates.days_until_expiry}d`, class: 'expiry--warning' };
    }
    if (guarantee.dates.days_until_expiry <= 90) {
      return { text: `${guarantee.dates.days_until_expiry}d`, class: 'expiry--info' };
    }
    return null;
  }

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ${currency}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ${currency}`;
    return `${value.toFixed(2)} ${currency}`;
  }
}
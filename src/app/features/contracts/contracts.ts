import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService, Contract } from '../../core/services/contract.service';
import { ContractDetailComponent } from './contract-detail/contract-detail';
import { ContractFormComponent } from './contract-form/contract-form';
import { DocumentUploaderComponent } from '../../shared/components/document-uploader/document-uploader';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ContractDetailComponent, ContractFormComponent, DocumentUploaderComponent],
  templateUrl: './contracts.html',
  styleUrls: ['./contracts.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractsComponent implements OnInit {
  private contractService = inject(ContractService);

  contracts: Contract[] = [];
  loading = true;
  error = '';

  // Filtros
  searchQuery = '';
  selectedType = '';
  selectedStatus = '';
  
  // Paginação
  currentPage = 1;
  totalPages = 1;
  totalContracts = 0;
  perPage = 10;

  // Modais
  showDetailModal = false;
  selectedContract: Contract | null = null;
  showFormModal = false;
  editingContract: Contract | null = null;

  // Métricas
  metrics = {
    active: 0,
    pending: 0,
    totalValue: 0,
    expiring: 0
  };

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedType) params.type = this.selectedType;
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.contractService.list(params).subscribe({
      next: (response) => {
        this.contracts = response.data;
        this.totalPages = response.meta.last_page;
        this.totalContracts = response.meta.total;
        this.calculateMetrics();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar contratos';
        this.loading = false;
        console.error(err);
      }
    });
  }

  calculateMetrics(): void {
    this.metrics.active = this.contracts.filter(c => c.status === 'active').length;
    this.metrics.pending = this.contracts.filter(c => c.status === 'pending_approval').length;
    this.metrics.totalValue = this.contracts
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.financial.total_amount, 0);
    this.metrics.expiring = this.contracts.filter(c => 
      c.dates.days_until_expiry !== null && 
      c.dates.days_until_expiry <= 30 && 
      c.dates.days_until_expiry > 0
    ).length;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadContracts();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadContracts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadContracts();
    }
  }

  viewDetails(contract: Contract): void {
    this.selectedContract = contract;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedContract = null;
  }

  openCreateModal(): void {
    this.editingContract = null;
    this.showFormModal = true;
  }

  editContract(contract: Contract): void {
    this.editingContract = contract;
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingContract = null;
  }

  onContractSaved(): void {
    this.loadContracts();
    this.closeFormModal();
  }

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B ${currency}`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K ${currency}`;
    }
    return `${value.toFixed(2)} ${currency}`;
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'draft': { label: 'Rascunho', class: 'status--draft', icon: '📝' },
      'pending_approval': { label: 'Pendente', class: 'status--pending', icon: '⏳' },
      'approved': { label: 'Aprovado', class: 'status--approved', icon: '✅' },
      'active': { label: 'Ativo', class: 'status--active', icon: '🟢' },
      'suspended': { label: 'Suspenso', class: 'status--suspended', icon: '⏸️' },
      'terminated': { label: 'Rescindido', class: 'status--terminated', icon: '🚫' },
      'expired': { label: 'Expirado', class: 'status--expired', icon: '⏰' },
      'archived': { label: 'Arquivado', class: 'status--archived', icon: '📦' }
    };
    return statuses[status] || { label: status, class: 'status--default', icon: '❓' };
  }

  getPaymentModelLabel(model: string): string {
    const labels: { [key: string]: string } = {
      'single': 'Pagamento Único',
      'installment': 'Parcelar',
      'measurement': 'Por Medição',
      'consignment': 'Consignação',
      'milestone': 'Por Marcos'
    };
    return labels[model] || model;
  }

  getExpiryInfo(contract: Contract): { text: string; class: string } | null {
    if (contract.dates.is_expired) {
      return { text: 'Expirado', class: 'expiry--expired' };
    }
    if (contract.dates.days_until_expiry !== null) {
      if (contract.dates.days_until_expiry <= 0) {
        return { text: 'Expira hoje', class: 'expiry--urgent' };
      }
      if (contract.dates.days_until_expiry <= 30) {
        return { text: `${contract.dates.days_until_expiry} dias`, class: 'expiry--warning' };
      }
      if (contract.dates.days_until_expiry <= 90) {
        return { text: `${contract.dates.days_until_expiry} dias`, class: 'expiry--info' };
      }
    }
    return null;
  }
}
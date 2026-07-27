import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractService, Contract } from '../../../core/services/contract.service';
import { ContractProgressComponent } from '../contract-progress/contract-progress';


@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, ContractProgressComponent],
  templateUrl: './contract-detail.html',
  styleUrls: ['./contract-detail.scss']
})
export class ContractDetailComponent {
  private contractService = inject(ContractService);

  @Input() contract!: Contract;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  activeTab = 'overview';
  isLoading = false;
  actionMessage = '';
  actionError = '';

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B ${currency}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${currency}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K ${currency}`;
    return `${value.toFixed(2)} ${currency}`;
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'draft': { label: 'Rascunho', class: 'status--draft', icon: '📝' },
      'pending_approval': { label: 'Pendente de Aprovação', class: 'status--pending', icon: '⏳' },
      'approved': { label: 'Aprovado', class: 'status--approved', icon: '✅' },
      'active': { label: 'Ativo', class: 'status--active', icon: '🟢' },
      'suspended': { label: 'Suspenso', class: 'status--suspended', icon: '⏸️' },
      'terminated': { label: 'Rescindido', class: 'status--terminated', icon: '🚫' },
      'expired': { label: 'Expirado', class: 'status--expired', icon: '⏰' },
      'archived': { label: 'Arquivado', class: 'status--archived', icon: '📦' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
  }

  canSubmit(): boolean {
    return this.contract.status === 'draft';
  }

  canApprove(): boolean {
    return this.contract.status === 'pending_approval';
  }

  canActivate(): boolean {
    return this.contract.status === 'approved';
  }

  canSuspend(): boolean {
    return this.contract.status === 'active';
  }

  canTerminate(): boolean {
    return ['active', 'approved', 'suspended'].includes(this.contract.status);
  }

  submitForApproval(): void {
    this.performAction(() => 
      this.contractService.submitForApproval(this.contract.id)
    , 'Contrato submetido para aprovação com sucesso!');
  }

  approveContract(): void {
    this.performAction(() => 
      this.contractService.approve(this.contract.id)
    , 'Contrato aprovado com sucesso!');
  }

  activateContract(): void {
    this.performAction(() => 
      this.contractService.activate(this.contract.id)
    , 'Contrato ativado com sucesso!');
  }

  suspendContract(): void {
    if (!confirm('Tem a certeza que deseja suspender este contrato?')) return;
    this.performAction(() => 
      this.contractService.suspend(this.contract.id, 'Suspenso pelo utilizador')
    , 'Contrato suspenso com sucesso!');
  }

  terminateContract(): void {
    if (!confirm('Tem a certeza que deseja rescindir este contrato? Esta ação é irreversível.')) return;
    this.performAction(() => 
      this.contractService.terminate(this.contract.id, 'Rescindido pelo utilizador')
    , 'Contrato rescindido com sucesso!');
  }

  private performAction(action: () => any, successMessage: string): void {
    this.isLoading = true;
    this.actionMessage = '';
    this.actionError = '';

    action().subscribe({
      next: (response: { data: Contract; }) => {
        this.contract = response.data;
        this.isLoading = false;
        this.actionMessage = successMessage;
        this.refresh.emit();
        setTimeout(() => this.actionMessage = '', 3000);
      },
      error: (err: { error: { message: string; }; }) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao executar ação';
        setTimeout(() => this.actionError = '', 5000);
      }
    });
  }

  getProgressPercentage(): number {
    if (!this.contract.dates.start || !this.contract.dates.end) return 0;
    const start = new Date(this.contract.dates.start).getTime();
    const end = new Date(this.contract.dates.end).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  }

  showProgressModal = false;

openProgressModal(): void {
  this.showProgressModal = true;
}

closeProgressModal(): void {
  this.showProgressModal = false;
}

onProgressUpdated(): void {
  this.refresh.emit();
}
}
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuaranteeService, Guarantee } from '../../../core/services/guarantee.service';
import { DocumentUploaderComponent } from '../../../shared/components/document-uploader/document-uploader';

@Component({
  selector: 'app-guarantee-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentUploaderComponent],
  templateUrl: './guarantee-detail.html',
  styleUrls: ['./guarantee-detail.scss'],
   
})
export class GuaranteeDetailComponent {
  private guaranteeService = inject(GuaranteeService);

  @Input() guarantee!: Guarantee;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  activeTab = 'overview';
  isLoading = false;
  actionMessage = '';
  actionError = '';

  // Modais de ação
  showReleaseModal = false;
  showExecuteModal = false;

  // Formulários
  releaseNotes = '';
  executeData = {
    amount: 0,
    reason: ''
  };

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B ${currency}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${currency}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K ${currency}`;
    return `${value.toFixed(2)} ${currency}`;
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

  getExpiryStatus(): { text: string; class: string } {
    if (this.guarantee.dates.is_expired) {
      return { text: 'Expirada', class: 'expiry--expired' };
    }
    if (this.guarantee.dates.days_until_expiry <= 0) {
      return { text: 'Expira hoje', class: 'expiry--urgent' };
    }
    if (this.guarantee.dates.days_until_expiry <= 30) {
      return { text: `${this.guarantee.dates.days_until_expiry} dias`, class: 'expiry--warning' };
    }
    if (this.guarantee.dates.days_until_expiry <= 90) {
      return { text: `${this.guarantee.dates.days_until_expiry} dias`, class: 'expiry--info' };
    }
    return { text: `${this.guarantee.dates.days_until_expiry} dias`, class: 'expiry--normal' };
  }

  openReleaseModal(): void {
    this.releaseNotes = '';
    this.showReleaseModal = true;
  }

  releaseGuarantee(): void {
    this.performAction(() => 
      this.guaranteeService.release(this.guarantee.id, this.releaseNotes)
    , 'Caução libertada com sucesso!');
    this.showReleaseModal = false;
  }

  openExecuteModal(): void {
    this.executeData = { amount: 0, reason: '' };
    this.showExecuteModal = true;
  }

  executeGuarantee(): void {
    if (this.executeData.amount <= 0) {
      this.actionError = 'Por favor, indique o valor a executar.';
      return;
    }
    if (!this.executeData.reason.trim()) {
      this.actionError = 'Por favor, indique o motivo da execução.';
      return;
    }

    this.performAction(() => 
      this.guaranteeService.execute(this.guarantee.id, this.executeData.amount, this.executeData.reason)
    , 'Caução executada com sucesso!');
    this.showExecuteModal = false;
  }

  private performAction(action: () => any, successMessage: string): void {
    this.isLoading = true;
    this.actionMessage = '';
    this.actionError = '';

    action().subscribe({
      next: (response: { data: Guarantee; }) => {
        this.guarantee = response.data;
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

  getValidityProgress(): number {
    const total = this.guarantee.dates.validity_days;
    const remaining = this.guarantee.dates.days_until_expiry;
    
    if (remaining <= 0) return 100;
    if (total <= 0) return 0;
    
    return Math.round(((total - remaining) / total) * 100);
  }
}
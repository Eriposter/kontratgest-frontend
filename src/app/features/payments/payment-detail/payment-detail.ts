import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, Payment } from '../../../core/services/payment.service';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-detail.html',
  styleUrls: ['./payment-detail.scss'],
   
})
export class PaymentDetailComponent {
  private paymentService = inject(PaymentService);

  @Input() payment!: Payment;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  activeTab = 'overview';
  isLoading = false;
  actionMessage = '';
  actionError = '';

  // Modais de ação
  showRejectModal = false;
  showPaidModal = false;
  showCancelModal = false;

  // Formulários
  rejectionNotes = '';
  paidData = {
    bank_reference: '',
    payment_method: 'transfer',
    payment_date: ''
  };
  cancelReason = '';

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B ${currency}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${currency}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K ${currency}`;
    return `${value.toFixed(2)} ${currency}`;
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'pending': { label: 'Pendente', class: 'status--pending', icon: '⏳' },
      'approved': { label: 'Aprovado', class: 'status--approved', icon: '✅' },
      'paid': { label: 'Pago', class: 'status--paid', icon: '💰' },
      'rejected': { label: 'Rejeitado', class: 'status--rejected', icon: '❌' },
      'cancelled': { label: 'Cancelado', class: 'status--cancelled', icon: '🚫' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
  }

  getPaymentMethodLabel(method: string | null): string {
    if (!method) return '—';
    const methods: { [key: string]: string } = {
      'transfer': 'Transferência Bancária',
      'check': 'Cheque',
      'cash': 'Numerário',
      'credit_card': 'Cartão de Crédito',
      'other': 'Outro'
    };
    return methods[method] || method;
  }

  approvePayment(): void {
    if (!confirm('Tem a certeza que deseja aprovar este pagamento?')) return;
    
    this.performAction(() => 
      this.paymentService.approve(this.payment.id)
    , 'Pagamento aprovado com sucesso!');
  }

  openRejectModal(): void {
    this.rejectionNotes = '';
    this.showRejectModal = true;
  }

  rejectPayment(): void {
    if (!this.rejectionNotes.trim()) {
      this.actionError = 'Por favor, indique o motivo da rejeição.';
      return;
    }

    this.performAction(() => 
      this.paymentService.reject(this.payment.id, this.rejectionNotes)
    , 'Pagamento rejeitado.');
    this.showRejectModal = false;
  }

  openPaidModal(): void {
    this.paidData = {
      bank_reference: '',
      payment_method: 'transfer',
      payment_date: new Date().toISOString().split('T')[0]
    };
    this.showPaidModal = true;
  }

  markAsPaid(): void {
    if (!this.paidData.bank_reference.trim()) {
      this.actionError = 'Por favor, indique a referência bancária.';
      return;
    }

    this.performAction(() => 
      this.paymentService.markAsPaid(this.payment.id, this.paidData)
    , 'Pagamento marcado como pago com sucesso!');
    this.showPaidModal = false;
  }

  openCancelModal(): void {
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  cancelPayment(): void {
    if (!this.cancelReason.trim()) {
      this.actionError = 'Por favor, indique o motivo do cancelamento.';
      return;
    }

    if (!confirm('Tem a certeza que deseja cancelar este pagamento? Esta ação não pode ser desfeita.')) return;

    this.performAction(() => 
      this.paymentService.cancel(this.payment.id, this.cancelReason)
    , 'Pagamento cancelado.');
    this.showCancelModal = false;
  }

  private performAction(action: () => any, successMessage: string): void {
    this.isLoading = true;
    this.actionMessage = '';
    this.actionError = '';

    action().subscribe({
      next: (response: { data: Payment; }) => {
        this.payment = response.data;
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
}
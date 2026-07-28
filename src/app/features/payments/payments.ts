// payments.ts - Versão completa com todos os métodos
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, Payment } from '../../core/services/payment.service';
import { PaymentDetailComponent } from './payment-detail/payment-detail';
import { PaymentFormComponent } from './payment-form/payment-form';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentDetailComponent, PaymentFormComponent],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);

  payments: Payment[] = [];
  loading = true;
  error = '';

  // Filtros
  searchQuery = '';
  selectedStatus = '';
  selectedType = '';

  // Paginação
  currentPage = 1;
  totalPages = 1;
  totalPayments = 0;
  perPage = 10;

  // Modais
  showDetailModal = false;
  selectedPayment: Payment | null = null;
  showFormModal = false;

  // Métricas
  metrics = {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0,
    overdueAmount: 0
  };

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedType) params.type = this.selectedType;

    this.paymentService.list(params).subscribe({
      next: (response) => {
        this.payments = response.data;
        this.totalPages = response.meta.last_page;
        this.totalPayments = response.meta.total;
        this.calculateMetrics();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar pagamentos';
        this.loading = false;
        console.error(err);
      }
    });
  }

  calculateMetrics(): void {
    const allPayments = this.payments;
    this.metrics.total = this.totalPayments;
    this.metrics.pending = allPayments.filter(p => p.status === 'pending').length;
    this.metrics.approved = allPayments.filter(p => p.status === 'approved').length;
    this.metrics.paid = allPayments.filter(p => p.status === 'paid').length;
    this.metrics.overdue = allPayments.filter(p => p.dates?.is_overdue).length;
    this.metrics.totalAmount = allPayments.reduce((sum, p) => sum + (p.financial?.net_amount || 0), 0);
    this.metrics.overdueAmount = allPayments
      .filter(p => p.dates?.is_overdue)
      .reduce((sum, p) => sum + (p.financial?.net_amount || 0), 0);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPayments();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPayments();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPayments();
    }
  }

  viewDetails(payment: Payment): void {
    this.selectedPayment = payment;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedPayment = null;
  }

  openCreateModal(): void {
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
  }

  onPaymentSaved(): void {
    this.loadPayments();
    this.closeFormModal();
  }

  // Método para aprovar pagamento
  approvePayment(payment: Payment): void {
    if (!payment || !payment.id) return;
    
    if (!confirm(`Deseja aprovar o pagamento ${payment.payment_number}?`)) {
      return;
    }

    this.loading = true;
    this.paymentService.approve(payment.id).subscribe({
      next: () => {
        this.loadPayments();
      },
      error: (err) => {
        this.error = 'Erro ao aprovar pagamento';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Método para rejeitar pagamento
  rejectPayment(payment: Payment): void {
    if (!payment || !payment.id) return;
    
    const reason = prompt('Motivo da rejeição:');
    if (reason === null) return; // Cancelado pelo usuário
    
    if (!reason.trim()) {
      this.error = 'Por favor, informe o motivo da rejeição';
      return;
    }

    this.loading = true;
    this.paymentService.reject(payment.id, reason).subscribe({
      next: () => {
        this.loadPayments();
      },
      error: (err) => {
        this.error = 'Erro ao rejeitar pagamento';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Método para marcar como pago
  markAsPaid(payment: Payment): void {
    if (!payment || !payment.id) return;
    
    if (!confirm(`Confirmar que o pagamento ${payment.payment_number} foi efetuado?`)) {
      return;
    }

    this.loading = true;
    this.paymentService.markAsPaid(payment.id, {
      bank_reference: '',
      payment_method: '',
      payment_date: undefined
    }).subscribe({
      next: () => {
        this.loadPayments();
      },
      error: (err) => {
        this.error = 'Erro ao marcar pagamento como pago';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Método para cancelar pagamento
  cancelPayment(payment: Payment): void {
    if (!payment || !payment.id) return;
    
    const reason = prompt('Motivo do cancelamento:');
    if (reason === null) return; // Cancelado pelo usuário
    
    if (!reason.trim()) {
      this.error = 'Por favor, informe o motivo do cancelamento';
      return;
    }

    this.loading = true;
    this.paymentService.cancel(payment.id, reason).subscribe({
      next: () => {
        this.loadPayments();
      },
      error: (err) => {
        this.error = 'Erro ao cancelar pagamento';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'pending': { label: 'Pendente', class: 'status--pending', icon: '⏳' },
      'approved': { label: 'Aprovado', class: 'status--approved', icon: '✅' },
      'paid': { label: 'Pago', class: 'status--paid', icon: '💰' },
      'rejected': { label: 'Rejeitado', class: 'status--rejected', icon: '❌' },
      'cancelled': { label: 'Cancelado', class: 'status--cancelled', icon: '🚫' }
    };
    return statuses[status] || { label: status, class: 'status--pending', icon: '❓' };
  }

  getDueDateInfo(payment: Payment): { text: string; class: string } | null {
    if (!payment.dates) return null;
    
    if (payment.dates.is_overdue) {
      return { text: `Atrasado ${payment.dates.days_overdue || 0}d`, class: 'due--overdue' };
    }
    if (payment.dates.days_until_due !== null && payment.dates.days_until_due !== undefined) {
      if (payment.dates.days_until_due <= 7) {
        return { text: `Vence em ${payment.dates.days_until_due}d`, class: 'due--urgent' };
      }
      if (payment.dates.days_until_due <= 30) {
        return { text: `Vence em ${payment.dates.days_until_due}d`, class: 'due--warning' };
      }
    }
    return null;
  }

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (!value) return `0,00 ${currency}`;
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ${currency}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ${currency}`;
    return `${value.toFixed(2)} ${currency}`;
  }
}
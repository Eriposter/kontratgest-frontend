import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeasurementService, Measurement, MeasurementItem } from '../../../core/services/measurement.service';
import { DocumentUploaderComponent } from '../../../shared/components/document-uploader/document-uploader';

@Component({
  selector: 'app-measurement-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentUploaderComponent],
  templateUrl: './measurement-detail.html',
  styleUrls: ['./measurement-detail.scss'],
   
})
export class MeasurementDetailComponent {
  private measurementService = inject(MeasurementService);

  @Input() measurement!: Measurement;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  activeTab = 'overview';
  isLoading = false;
  actionMessage = '';
  actionError = '';
  approvalNotes = '';
  rejectionNotes = '';

  showApproveModal = false;
  showRejectModal = false;

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B ${currency}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${currency}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K ${currency}`;
    return `${value.toFixed(2)} ${currency}`;
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'draft': { label: 'Rascunho', class: 'status--draft', icon: '📝' },
      'submitted': { label: 'Submetido', class: 'status--submitted', icon: '📤' },
      'approved': { label: 'Aprovado', class: 'status--approved', icon: '✅' },
      'rejected': { label: 'Rejeitado', class: 'status--rejected', icon: '❌' },
      'paid': { label: 'Pago', class: 'status--paid', icon: '💰' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
  }

  submitForApproval(): void {
    this.performAction(() => 
      this.measurementService.submit(this.measurement.id)
    , 'Auto de medição submetido para aprovação com sucesso!');
  }

  openApproveModal(): void {
    this.approvalNotes = '';
    this.showApproveModal = true;
  }

  approveMeasurement(): void {
    this.performAction(() => 
      this.measurementService.approve(this.measurement.id, this.approvalNotes)
    , 'Auto de medição aprovado com sucesso!');
    this.showApproveModal = false;
  }

  openRejectModal(): void {
    this.rejectionNotes = '';
    this.showRejectModal = true;
  }

  rejectMeasurement(): void {
    if (!this.rejectionNotes.trim()) {
      this.actionError = 'Por favor, indique o motivo da rejeição.';
      return;
    }
    this.performAction(() => 
      this.measurementService.reject(this.measurement.id, this.rejectionNotes)
    , 'Auto de medição rejeitado.');
    this.showRejectModal = false;
  }

  private performAction(action: () => any, successMessage: string): void {
    this.isLoading = true;
    this.actionMessage = '';
    this.actionError = '';

    action().subscribe({
      next: (response: { data: Measurement; }) => {
        this.measurement = response.data;
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

  getTotalItems(): number {
    return this.measurement.items?.length || 0;
  }

  calculateItemTotal(item: MeasurementItem): number {
    return item.quantity * item.unit_price;
  }
}
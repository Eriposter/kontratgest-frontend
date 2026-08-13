import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeasurementService, Measurement } from '../../core/services/measurement.service';
import { MeasurementDetailComponent } from './measurement-detail/measurement-detail';
import { MeasurementFormComponent } from './measurement-form/measurement-form';

@Component({
  selector: 'app-measurements',
  standalone: true,
  imports: [CommonModule, FormsModule, MeasurementDetailComponent, MeasurementFormComponent],
  templateUrl: './measurements.html',
  styleUrls: ['./measurements.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeasurementsComponent implements OnInit {
  private measurementService = inject(MeasurementService);

  measurements: Measurement[] = [];
  loading = true;
  error = '';

  // Filtros
  searchQuery = '';
  selectedStatus = '';
  selectedContractId = '';

  // Paginação
  currentPage = 1;
  totalPages = 1;
  totalMeasurements = 0;
  perPage = 10;

  // Modais
  showDetailModal = false;
  selectedMeasurement: Measurement | null = null;
  showFormModal = false;
  editingMeasurement: Measurement | null = null;

  // Métricas
  metrics = {
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    paid: 0,
    totalAmount: 0
  };

  ngOnInit(): void {
    this.loadMeasurements();
  }

  loadMeasurements(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedContractId) params.contract_id = this.selectedContractId;

    this.measurementService.list(params).subscribe({
      next: (response) => {
        this.measurements = response.data;
        this.totalPages = response.meta.last_page;
        this.totalMeasurements = response.meta.total;
        this.calculateMetrics();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar autos de medição';
        this.loading = false;
        console.error(err);
      }
    });
  }

  calculateMetrics(): void {
    this.metrics.total = this.totalMeasurements;
    this.metrics.draft = this.measurements.filter(m => m.status === 'draft').length;
    this.metrics.submitted = this.measurements.filter(m => m.status === 'submitted').length;
    this.metrics.approved = this.measurements.filter(m => m.status === 'approved').length;
    this.metrics.paid = this.measurements.filter(m => m.status === 'paid').length;
    this.metrics.totalAmount = this.measurements.reduce((sum, m) => sum + m.financial.total_amount, 0);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadMeasurements();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadMeasurements();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMeasurements();
    }
  }

  viewDetails(measurement: Measurement): void {
    this.selectedMeasurement = measurement;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedMeasurement = null;
  }

  openCreateModal(): void {
    this.editingMeasurement = null;
    this.showFormModal = true;
  }

  editMeasurement(measurement: Measurement): void {
    this.editingMeasurement = measurement;
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingMeasurement = null;
  }

  onMeasurementSaved(): void {
    this.loadMeasurements();
    this.closeFormModal();
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

  formatCurrency(value: number, currency: string = 'AOA'): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ${currency}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ${currency}`;
    return `${value.toFixed(2)} ${currency}`;
  }
}
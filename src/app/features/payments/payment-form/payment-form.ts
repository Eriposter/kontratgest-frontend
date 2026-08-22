// payment-form.ts - Versão otimizada com scroll
import { Component, EventEmitter, OnInit, Output, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { ContractService, Contract } from '../../../core/services/contract.service';
import { MeasurementService, Measurement } from '../../../core/services/measurement.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-form.html',
  styleUrls: ['./payment-form.scss'],
   
})
export class PaymentFormComponent implements OnInit, AfterViewInit {
  private paymentService = inject(PaymentService);
  private contractService = inject(ContractService);
  private measurementService = inject(MeasurementService);

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isLoading = false;
  isSaving = false;
  errorMessage = '';

  // Scroll management
  scrollProgress = 0;
  showScrollTop = false;
  private scrollContainer!: HTMLElement;

  contracts: Contract[] = [];
  measurements: Measurement[] = [];
  selectedContract: Contract | null = null;
  selectedMeasurement: Measurement | null = null;

  paymentTypes = [
    { value: 'measurement', label: 'Auto de Medição' },
    { value: 'advance', label: 'Adiantamento' },
    { value: 'installment', label: 'Prestação' },
    { value: 'final', label: 'Pagamento Final' }
  ];

  formData = {
    contract_id: '',
    measurement_id: '',
    payment_type: 'measurement',
    gross_amount: 0,
    vat_rate: 14,
    withholding_tax_rate: 0,
    stamp_duty_rate: 0,
    retention_amount: 0,
    due_date: '',
    invoice_date: '',
    invoice_number: '',
    notes: '',
    proof_document: null as File | null
  };

  ngOnInit(): void {
    this.loadContracts();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollContainer = document.querySelector('.form-scroll-container') as HTMLElement;
    });
  }

  // Scroll methods
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    
    this.scrollProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    this.showScrollTop = scrollTop > 200;
  }

  scrollToTop(): void {
    if (this.scrollContainer) {
      this.scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  loadContracts(): void {
    this.isLoading = true;
    this.contractService.list({ status: 'active', per_page: 100 }).subscribe({
      next: (response) => {
        this.contracts = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao carregar contratos';
      }
    });
  }

  onContractChange(): void {
    this.selectedContract = this.contracts.find(c => c.id === this.formData.contract_id) || null;
    this.selectedMeasurement = null;
    this.formData.measurement_id = '';
    this.measurements = [];

    if (this.selectedContract) {
      this.loadMeasurements();
      
      // Preencher automaticamente com dados do contrato
      this.formData.vat_rate = this.selectedContract.financial?.vat_rate || 14;
      this.formData.withholding_tax_rate = this.selectedContract.financial?.withholding_tax_rate || 0;
      this.onAmountChange();
    }
  }

  loadMeasurements(): void {
    if (!this.selectedContract) return;

    this.measurementService.list({ 
      contract_id: this.selectedContract.id, 
      status: 'approved',
      per_page: 100 
    }).subscribe({
      next: (response) => {
        this.measurements = response.data;
      },
      error: () => {
        this.measurements = [];
      }
    });
  }

  onMeasurementChange(): void {
    this.selectedMeasurement = this.measurements.find(m => m.id === this.formData.measurement_id) || null;

    if (this.selectedMeasurement) {
      // Preencher automaticamente com dados do auto de medição
      this.formData.gross_amount = this.selectedMeasurement.financial?.net_amount || 0;
      this.formData.retention_amount = this.selectedMeasurement.financial?.retention_amount || 0;
      this.onAmountChange();
    }
  }

  onPaymentTypeChange(): void {
    if (this.formData.payment_type === 'measurement') {
      // Mostrar campo de auto de medição
    } else {
      this.selectedMeasurement = null;
      this.formData.measurement_id = '';
    }
  }

  onAmountChange(): void {
    // Trigger recalculation of totals
  }

  getVatAmount(): number {
    return this.formData.gross_amount * (this.formData.vat_rate / 100);
  }

  getWithholdingAmount(): number {
    return this.formData.gross_amount * (this.formData.withholding_tax_rate / 100);
  }

  getStampDutyAmount(): number {
    return this.formData.gross_amount * (this.formData.stamp_duty_rate / 100);
  }

  getNetAmount(): number {
    return this.formData.gross_amount + this.getVatAmount() - this.getWithholdingAmount() - this.getStampDutyAmount() - this.formData.retention_amount;
  }

  isFormValid(): boolean {
    if (!this.formData.contract_id) return false;
    if (this.formData.gross_amount <= 0) return false;
    if (this.formData.payment_type === 'measurement' && !this.formData.measurement_id) return false;
    if (!this.formData.due_date) return false; // Vencimento obrigatório
    return true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.formData.proof_document = input.files[0];
    }
  }

  onSubmit(): void {
  if (!this.isFormValid()) {
    this.errorMessage = 'Por favor, preencha todos os campos obrigatórios';
    return;
  }

  this.isSaving = true;
  this.errorMessage = '';

  const payload = {
    contract_id: this.formData.contract_id,
    measurement_id: this.formData.measurement_id || null,
    payment_type: this.formData.payment_type,
    gross_amount: this.formData.gross_amount,
    vat_rate: this.formData.vat_rate,
    withholding_tax_rate: this.formData.withholding_tax_rate,
    stamp_duty_rate: this.formData.stamp_duty_rate,
    retention_amount: this.formData.retention_amount,
    due_date: this.formData.due_date || null,
    invoice_date: this.formData.invoice_date || null,
    invoice_number: this.formData.invoice_number || null,
    payment_notes: this.formData.notes,
    has_proof_document: !!this.formData.proof_document
  };

  this.paymentService.create(payload).subscribe({
    next: () => {
      this.isSaving = false;
      this.saved.emit();
    },
    error: (err) => {
      this.isSaving = false;
      this.errorMessage = err.error?.message || 'Erro ao criar pagamento';
      this.scrollToTop();
    }
  });
}

  formatCurrency(value: number): string {
    if (!value) return '0,00';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(2);
  }
}
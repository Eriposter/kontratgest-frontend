import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService, Contract } from '../../../core/services/contract.service';
import { EntityService, Entity } from '../../../core/services/entity.service';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-form.html',
  styleUrls: ['./contract-form.scss']
})
export class ContractFormComponent implements OnInit {
  private contractService = inject(ContractService);
  private entityService = inject(EntityService);

  @Input() contract: Contract | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Contract>();

  isEdit = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  currentStep = 1;
  totalSteps = 4;

  entities: Entity[] = [];

  contractTypes = [
    { code: 'WORKS', name: 'Empreitada de Obras' },
    { code: 'SERVICE', name: 'Prestação de Serviços' },
    { code: 'SUPPLY', name: 'Fornecimento de Bens' },
    { code: 'CONSULTANCY', name: 'Consultoria' },
    { code: 'LEASE', name: 'Arrendamento' }
  ];

  paymentModels = [
    { value: 'single', label: 'Pagamento Único' },
    { value: 'installment', label: 'Pagamento Parcelar' },
    { value: 'measurement', label: 'Por Auto de Medição' },
    { value: 'consignment', label: 'À Consignação' },
    { value: 'milestone', label: 'Por Marcos' }
  ];

  currencies = [
    { value: 'AOA', label: 'Kwanza (AOA)', symbol: 'Kz' },
    { value: 'USD', label: 'Dólar (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' }
  ];

  formData = {
    contract_type_id: '',
    counterparty_id: '',
    title: '',
    description: '',
    object: '',
    currency: 'AOA',
    total_amount: 0,
    vat_rate: 14,
    withholding_tax_rate: 0,
    exchange_rate: null as number | null,
    start_date: '',
    end_date: '',
    signature_date: '',
    duration_months: null as number | null,
    payment_model: 'installment',
    requires_bna_registration: false,
    bna_registration_number: '',
    tribunal_de_contas_visto: false,
    internal_notes: '',
    payment_schedules: [] as any[]
  };

  ngOnInit(): void {
    this.loadEntities();
    if (this.contract) {
      this.isEdit = true;
      this.loadContractData();
    }
  }

  loadEntities(): void {
    this.isLoading = true;
    this.entityService.list({ status: 'active', per_page: 100 }).subscribe({
      next: (response) => {
        this.entities = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadContractData(): void {
    if (!this.contract) return;

    this.formData = {
      contract_type_id: this.contract.type.id,
      counterparty_id: this.contract.counterparty.id,
      title: this.contract.title,
      description: this.contract.description || '',
      object: this.contract.object || '',
      currency: this.contract.financial.currency,
      total_amount: this.contract.financial.total_amount,
      vat_rate: this.contract.financial.vat_rate,
      withholding_tax_rate: this.contract.financial.withholding_tax_rate,
      exchange_rate: this.contract.financial.exchange_rate,
      start_date: this.contract.dates.start,
      end_date: this.contract.dates.end || '',
      signature_date: this.contract.dates.signature || '',
      duration_months: this.contract.dates.duration_months,
      payment_model: this.contract.payment.model,
      requires_bna_registration: false,
      bna_registration_number: '',
      tribunal_de_contas_visto: false,
      internal_notes: '',
      payment_schedules: this.contract.payment.schedules || []
    };
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  onCurrencyChange(): void {
    this.formData.requires_bna_registration = this.formData.currency !== 'AOA';
    if (this.formData.currency === 'AOA') {
      this.formData.exchange_rate = null;
    }
  }

  onDatesChange(): void {
    if (this.formData.start_date && this.formData.end_date) {
      const start = new Date(this.formData.start_date);
      const end = new Date(this.formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.formData.duration_months = Math.round(diffDays / 30);
    }
  }

  addPaymentSchedule(): void {
    this.formData.payment_schedules.push({
      milestone_name: '',
      due_date: '',
      percentage: 0,
      amount: 0,
      is_conditional: false
    });
  }

  removePaymentSchedule(index: number): void {
    this.formData.payment_schedules.splice(index, 1);
  }

  getTotalPercentage(): number {
    return this.formData.payment_schedules.reduce((sum, s) => sum + (s.percentage || 0), 0);
  }

  getVatAmount(): number {
    return this.formData.total_amount * (this.formData.vat_rate / 100);
  }

  getWithholdingAmount(): number {
    return this.formData.total_amount * (this.formData.withholding_tax_rate / 100);
  }

  getNetAmount(): number {
    return this.formData.total_amount + this.getVatAmount() - this.getWithholdingAmount();
  }

  onSubmit(): void {
    this.isSaving = true;
    this.errorMessage = '';

    const payload: any = {
      contract_type_id: this.formData.contract_type_id,
      counterparty_id: this.formData.counterparty_id,
      title: this.formData.title,
      description: this.formData.description,
      object: this.formData.object,
      currency: this.formData.currency,
      total_amount: this.formData.total_amount,
      vat_rate: this.formData.vat_rate,
      withholding_tax_rate: this.formData.withholding_tax_rate,
      start_date: this.formData.start_date,
      end_date: this.formData.end_date || null,
      signature_date: this.formData.signature_date || null,
      duration_months: this.formData.duration_months,
      payment_model: this.formData.payment_model,
      requires_bna_registration: this.formData.requires_bna_registration,
      bna_registration_number: this.formData.bna_registration_number || null,
      tribunal_de_contas_visto: this.formData.tribunal_de_contas_visto,
      internal_notes: this.formData.internal_notes,
      payment_schedules: this.formData.payment_schedules.filter(s => s.milestone_name)
    };

    if (this.formData.currency !== 'AOA' && this.formData.exchange_rate) {
      payload.exchange_rate = this.formData.exchange_rate;
    }

    const operation = this.isEdit && this.contract
      ? this.contractService.update(this.contract.id, payload)
      : this.contractService.create(payload);

    operation.subscribe({
      next: (response) => {
        this.isSaving = false;
        this.saved.emit(response.data);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Erro ao guardar contrato';
      }
    });
  }

  getEntityName(id: string): string {
    const entity = this.entities.find(e => e.id === id);
    return entity ? entity.identification.name : '';
  }

  getStepTitle(step: number): string {
    const titles = ['Identificação', 'Contraparte', 'Financeiro', 'Plano de Pagamento'];
    return titles[step - 1] || '';
  }
}
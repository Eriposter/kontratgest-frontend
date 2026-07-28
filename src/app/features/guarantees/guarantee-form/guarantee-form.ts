import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuaranteeService } from '../../../core/services/guarantee.service';
import { ContractService, Contract } from '../../../core/services/contract.service';

@Component({
  selector: 'app-guarantee-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guarantee-form.html',
  styleUrls: ['./guarantee-form.scss']
})
export class GuaranteeFormComponent implements OnInit {
  private guaranteeService = inject(GuaranteeService);
  private contractService = inject(ContractService);

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  currentStep = 1;
  totalSteps = 3;
  

  contracts: Contract[] = [];
  selectedContract: Contract | null = null;

  guaranteeTypes = [
    { value: 'bank_guarantee', label: 'Garantia Bancária' },
    { value: 'insurance', label: 'Seguro de Caução' },
    { value: 'cash_deposit', label: 'Depósito em Numerário' }
  ];

  guaranteePurposes = [
    { value: 'performance', label: 'Boa Execução' },
    { value: 'advance_payment', label: 'Adiantamento' },
    { value: 'bid', label: 'Proposta' },
    { value: 'retention', label: 'Retenção' },
    { value: 'warranty', label: 'Garantia' }
  ];

  currencies = [
    { value: 'AOA', label: 'Kwanza (AOA)', symbol: 'Kz' },
    { value: 'USD', label: 'Dólar (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' }
  ];

  formData = {
    contract_id: '',
    guarantee_type: 'bank_guarantee',
    purpose: 'performance',
    issuer_name: '',
    issuer_nif: '',
    issuer_contact: '',
    currency: 'AOA',
    amount: 0,
    exchange_rate: null as number | null,
    issue_date: '',
    expiry_date: '',
    release_conditions: ''
  };

  ngOnInit(): void {
    this.loadContracts();
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
      }
    });
  }

  onContractChange(): void {
    this.selectedContract = this.contracts.find(c => c.id === this.formData.contract_id) || null;
  }

  onCurrencyChange(): void {
    if (this.formData.currency === 'AOA') {
      this.formData.exchange_rate = null;
    }
  }

  onDatesChange(): void {
    // Calcular automaticamente dias de validade se ambas as datas estiverem preenchidas
  }

  getValidityDays(): number {
    if (!this.formData.issue_date || !this.formData.expiry_date) return 0;
    
    const issue = new Date(this.formData.issue_date);
    const expiry = new Date(this.formData.expiry_date);
    const diffTime = Math.abs(expiry.getTime() - issue.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  onSubmit(): void {
    this.isSaving = true;
    this.errorMessage = '';

    const payload = {
      contract_id: this.formData.contract_id,
      guarantee_type: this.formData.guarantee_type,
      purpose: this.formData.purpose,
      issuer_name: this.formData.issuer_name,
      issuer_nif: this.formData.issuer_nif,
      issuer_contact: this.formData.issuer_contact,
      currency: this.formData.currency,
      amount: this.formData.amount,
      exchange_rate: this.formData.exchange_rate,
      issue_date: this.formData.issue_date,
      expiry_date: this.formData.expiry_date,
      release_conditions: this.formData.release_conditions
    };

    this.guaranteeService.create(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.saved.emit();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Erro ao criar caução';
      }
    });
  }

  formatCurrency(value: number): string {
    return value.toFixed(2);
  }
}
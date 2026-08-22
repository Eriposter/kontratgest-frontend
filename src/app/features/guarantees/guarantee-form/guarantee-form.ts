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
  styleUrls: ['./guarantee-form.scss'],
   
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

  // Percentagens dinâmicas baseadas no tipo de contrato
  guaranteePercentages: { value: number; label: string }[] = [];

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
    percentage: null as number | null,
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
    
    // Atualizar percentagens disponíveis baseado no tipo de contrato
    if (this.selectedContract) {
      this.updateGuaranteePercentages(this.selectedContract.type.code);
      
      // Se o contrato tiver um valor total, já definir a percentagem padrão e calcular o valor
      if (this.guaranteePercentages.length > 0) {
        const defaultPercentage = this.guaranteePercentages[0].value;
        this.formData.percentage = defaultPercentage;
        this.calculateAmountFromPercentage(defaultPercentage);
      }
    }
  }

  updateGuaranteePercentages(contractTypeCode: string): void {
    // Verificar se é contrato de concessão
    const concessionTypes = ['public_works_concession', 'public_services_concession', 'concessao'];
    const isConcession = concessionTypes.some(type => 
      contractTypeCode.toLowerCase().includes(type)
    );

    if (isConcession) {
      // Contrato de concessão: 1% a 5%
      this.guaranteePercentages = [
        { value: 1, label: '1%' },
        { value: 2, label: '2%' },
        { value: 3, label: '3%' },
        { value: 4, label: '4%' },
        { value: 5, label: '5%' }
      ];
    } else {
      // Outros contratos: 5% a 15%
      this.guaranteePercentages = [
        { value: 5, label: '5%' },
        { value: 6, label: '6%' },
        { value: 7, label: '7%' },
        { value: 8, label: '8%' },
        { value: 9, label: '9%' },
        { value: 10, label: '10%' },
        { value: 11, label: '11%' },
        { value: 12, label: '12%' },
        { value: 13, label: '13%' },
        { value: 14, label: '14%' },
        { value: 15, label: '15%' }
      ];
    }
  }

  onPercentageChange(): void {
    if (this.formData.percentage && this.selectedContract) {
      this.calculateAmountFromPercentage(this.formData.percentage);
    }
  }

  calculateAmountFromPercentage(percentage: number): void {
    if (!this.selectedContract?.financial?.total_amount) return;

    const totalAmount = this.selectedContract.financial.total_amount;
    const calculatedAmount = (totalAmount * percentage) / 100;
    this.formData.amount = calculatedAmount;
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

  // guarantee-form.ts

  onSubmit(): void {
  console.log('🔵 onSubmit chamado!');
  
  if (!this.isFormValid()) {
    setTimeout(() => this.errorMessage = '', 5000);
    return;
  }

  this.isSaving = true;
  this.errorMessage = '';

  // 🔥 PAYLOAD CORRETO - issuing_entity como STRING + percentage
  const payload = {
    contract_id: this.formData.contract_id,
    guarantee_type: this.formData.guarantee_type,
    purpose: this.formData.purpose,
    issuing_entity: this.formData.issuer_name.trim(), // ← STRING (nome da emissora)
    issuer_nif: this.formData.issuer_nif?.trim() || '',
    issuer_contact: this.formData.issuer_contact?.trim() || '',
    currency: this.formData.currency,
    percentage: this.formData.percentage, // ← Percentagem selecionada
    amount: Number(this.formData.amount),
    exchange_rate: this.formData.exchange_rate || null,
    issue_date: this.formData.issue_date,
    expiry_date: this.formData.expiry_date,
    release_conditions: this.formData.release_conditions?.trim() || ''
  };

  console.log('📦 Payload a enviar:', payload);

  this.guaranteeService.create(payload).subscribe({
    next: (response) => {
      console.log('✅ Caução criada:', response);
      this.isSaving = false;
      this.saved.emit();
    },
    error: (err) => {
      console.error('❌ Erro:', err);
      this.isSaving = false;
      
      // Mostrar erros detalhados
      if (err.error?.errors) {
        const errorMessages = Object.entries(err.error.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        this.errorMessage = `Erros:\n${errorMessages}`;
      } else {
        this.errorMessage = err.error?.message || 'Erro ao criar caução. Verifique os dados.';
      }
      
    }
  });
}

isFormValid(): boolean {
  // Validar contrato
  if (!this.formData.contract_id) {
    this.errorMessage = 'Selecione um contrato';
    return false;
  }
  
  // Validar emissora
  if (!this.formData.issuer_name || this.formData.issuer_name.trim().length < 3) {
    this.errorMessage = 'Nome da emissora inválido (mínimo 3 caracteres)';
    return false;
  }
  
  // Validar NIF (se for obrigatório)
  if (!this.formData.issuer_nif || this.formData.issuer_nif.trim().length < 9) {
    this.errorMessage = 'NIF da emissora inválido (mínimo 9 dígitos)';
    return false;
  }
  
  // Validar valor
  if (!this.formData.amount || this.formData.amount <= 0) {
    this.errorMessage = 'Valor da caução deve ser maior que zero';
    return false;
  }
  
  // Validar datas
  if (!this.formData.issue_date || !this.formData.expiry_date) {
    this.errorMessage = 'Preencha todas as datas';
    return false;
  }
  
  const issue = new Date(this.formData.issue_date);
  const expiry = new Date(this.formData.expiry_date);
  
  if (expiry <= issue) {
    this.errorMessage = 'A data de expiração deve ser posterior à data de emissão';
    return false;
  }
  
  this.errorMessage = '';
  return true;
}

  formatCurrency(value: number): string {
    return value.toFixed(2);
  }

  getCurrencySymbol(): string {
    const currency = this.currencies.find(c => c.value === this.formData.currency);
    return currency ? currency.symbol : 'Kz';
  }

  isConcessionContract(): boolean {
    if (!this.selectedContract?.type?.code) return false;
    
    const concessionTypes = ['public_works_concession', 'public_services_concession', 'concessao'];
    const contractTypeCode = this.selectedContract.type.code.toLowerCase();
    
    return concessionTypes.some(type => contractTypeCode.includes(type));
  }
}
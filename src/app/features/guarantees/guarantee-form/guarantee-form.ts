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

  // 🆕 Variáveis para validação dinâmica de percentagem
  minPercentage = 5;
  maxPercentage = 15;
  percentageError = '';

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
    percentage: 5, // 🆕 Campo de percentagem
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
  
  if (this.selectedContract) {
    // 🔥 CORREÇÃO: Extrair o valor total de forma segura
    // Tenta buscar na raiz ou dentro do objeto 'financial'
    const contractValue = this.selectedContract.total_amount 
      || this.selectedContract['financial']?.total_amount 
      || 0;

    // Definir limites baseados no tipo de contrato
    const contractType = this.selectedContract.contract_type;
    const isConcession = ['public_works_concession', 'public_services_concession'].includes(contractType);
    
    this.minPercentage = isConcession ? 1 : 5;
    this.maxPercentage = isConcession ? 5 : 15;
    
    // Ajustar percentagem atual
    if (this.formData.percentage < this.minPercentage) {
      this.formData.percentage = this.minPercentage;
    } else if (this.formData.percentage > this.maxPercentage) {
      this.formData.percentage = this.maxPercentage;
    }
    
    // Calcular o valor da caução com base no valor extraído
    this.formData.amount = contractValue * (this.formData.percentage / 100);
    this.validatePercentage();
  } else {
    this.minPercentage = 5;
    this.maxPercentage = 15;
    this.formData.amount = 0;
    this.percentageError = '';
  }
}

  // 🆕 Chamado quando a percentagem é alterada no input
  onPercentageChange(): void {
    this.validatePercentage();
    this.calculateAmount();
  }

  private validatePercentage(): void {
    if (this.formData.percentage < this.minPercentage || this.formData.percentage > this.maxPercentage) {
      this.percentageError = `A percentagem deve estar entre ${this.minPercentage}% e ${this.maxPercentage}% para este tipo de contrato.`;
    } else {
      this.percentageError = '';
    }
  }

  private calculateAmount(): void {
    if (this.selectedContract) {
      const contractValue = this.selectedContract.total_amount || 0;
      this.formData.amount = contractValue * (this.formData.percentage / 100);
    }
  }

  onCurrencyChange(): void {
    if (this.formData.currency === 'AOA') {
      this.formData.exchange_rate = null;
    }
  }

  getValidityDays(): number {
    if (!this.formData.issue_date || !this.formData.expiry_date) return 0;
    const issue = new Date(this.formData.issue_date);
    const expiry = new Date(this.formData.expiry_date);
    const diffTime = Math.abs(expiry.getTime() - issue.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getContractBaseValue(): string {
  if (!this.selectedContract) return '—';
  
  const value = this.selectedContract.total_amount 
    || this.selectedContract['financial']?.total_amount 
    || 0;
    
  const currency = this.selectedContract.currency || 'AOA';
  
  if (value === 0 || value === null || value === undefined) {
    return `Valor não definido (${currency})`;
  }
  
  return `${value.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${currency}`;
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

// 🆕 Adicionar este método
goToStep(step: number): void {
  if (step >= 1 && step <= this.totalSteps) {
    this.currentStep = step;
  }
}

  onSubmit(): void {
    console.log('🔵 onSubmit chamado!');
    
    if (!this.isFormValid()) {
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const payload = {
      contract_id: this.formData.contract_id,
      guarantee_type: this.formData.guarantee_type,
      purpose: this.formData.purpose,
      issuing_entity: this.formData.issuer_name.trim(),
      issuer_nif: this.formData.issuer_nif?.trim() || '',
      issuer_contact: this.formData.issuer_contact?.trim() || '',
      currency: this.formData.currency,
      percentage: this.formData.percentage, // 🆕 Enviar percentagem se o backend suportar
      amount: Number(this.formData.amount), // Valor calculado automaticamente
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
    if (!this.formData.contract_id) {
      this.errorMessage = 'Selecione um contrato';
      return false;
    }
    
    // 🆕 Validar percentagem antes de tudo
    if (this.percentageError) {
      this.errorMessage = this.percentageError;
      return false;
    }

    if (!this.formData.issuer_name || this.formData.issuer_name.trim().length < 3) {
      this.errorMessage = 'Nome da emissora inválido (mínimo 3 caracteres)';
      return false;
    }
    
    if (!this.formData.issuer_nif || this.formData.issuer_nif.trim().length < 9) {
      this.errorMessage = 'NIF da emissora inválido (mínimo 9 dígitos)';
      return false;
    }
    
    if (!this.formData.amount || this.formData.amount <= 0) {
      this.errorMessage = 'Valor da caução deve ser maior que zero';
      return false;
    }
    
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
    return value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onDatesChange(): void {
  // Calcular automaticamente dias de validade se ambas as datas estiverem preenchidas
  if (this.formData.issue_date && this.formData.expiry_date) {
    const issue = new Date(this.formData.issue_date);
    const expiry = new Date(this.formData.expiry_date);
    
    if (expiry <= issue) {
      this.errorMessage = 'A data de expiração deve ser posterior à data de emissão';
    } else {
      this.errorMessage = '';
    }
  }
}
}
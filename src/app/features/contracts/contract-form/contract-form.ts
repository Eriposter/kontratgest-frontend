import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService, Contract } from '../../../core/services/contract.service';
import { EntityService, Entity } from '../../../core/services/entity.service';
import { PACService } from '../../../core/services/pac.service';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-form.html',
  styleUrls: ['./contract-form.scss'],
   
})
export class ContractFormComponent implements OnInit {
  private contractService = inject(ContractService);
  private entityService = inject(EntityService);
  private pacService = inject(PACService);

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

  fromPAC = false;
  availableNeeds: any[] = [];
  selectedNeed: any = null;
  loadingNeeds = false;

contractTypes: any[] = [];


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
    this.loadContractTypes();
    if (this.contract) {
      this.isEdit = true;
      this.loadContractData();
    }
  }

  toggleFromPAC(): void {
    this.fromPAC = !this.fromPAC;
    if (this.fromPAC) {
      this.loadAvailableNeeds();
    } else {
      this.selectedNeed = null;
    }
  }

  loadAvailableNeeds(): void {
    this.loadingNeeds = true;
    this.pacService.getAvailableNeeds().subscribe({
      next: (response) => {
        this.availableNeeds = response.data;
        this.loadingNeeds = false;
      },
      error: () => {
        this.loadingNeeds = false;
      }
    });
  }

   loadContractTypes(): void {
    
        this.contractTypes = [
          { id: 'db23f5df-29cb-4556-a4b8-05601835e5f4', name: 'Empreitada de obras públicas', code: 'public_works' },
          { id: '7990d7cb-8e03-4eb5-83e5-6d027af103e5', name: 'Aquisição de bens móveis', code: 'goods_acquisition' },
          { id: '4a9a493b-eb39-43b8-a853-b16ac365a51b', name: 'Aquisição de serviços', code: 'services_acquisition' },
          { id: '2e2a098d-41a5-44bb-ae55-a3f2f12bd497', name: 'Serviços de consultoria', code: 'consultancy' },
          { id: 'e79ec9ce-ab99-4d42-ac45-a294cc3cec23', name: 'Locação de bens móveis', code: 'goods_rental' },
          { id: '829305cb-f177-4559-a081-cbcc4f7298f5', name: 'Concessão de obras públicas', code: 'public_works_concession' },
          { id: '0cadc327-0ca2-4c7c-b6b9-6494d43116a7', name: 'Concessão de serviços públicos', code: 'public_services_concession' },
          { id: 'a7ac93e7-4d02-41e6-a504-a1c669bb412a', name: 'Outro', code: 'other', requiresSpecification: true }
        ];
 
  }

  selectNeed(need: any): void {
    this.selectedNeed = need;
    
    this.formData.title = need.title;
    this.formData.object = need.description || '';
    this.formData.total_amount = need.estimated_amount;
    
    // Tentar selecionar o tipo de contrato
    const matchedType = this.contractTypes.find(t => 
      t.code === need.contract_type || 
      t.code === this.mapContractType(need.contract_type)
    );
    if (matchedType) {
      this.formData.contract_type_id = matchedType.id;
    }
  }

  private mapContractType(type: string): string {
    const mapping: { [key: string]: string } = {
      'works': 'public_works',
      'services': 'services_acquisition',
      'supply': 'goods_acquisition',
      'consultancy': 'consultancy',
      'lease': 'goods_rental',
      'concession': 'public_works_concession',
      'other': 'other'
    };
    return mapping[type] || type;
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
  // Validação básica
  if (!this.formData.contract_type_id) {
    this.errorMessage = 'Por favor, selecione o tipo de contrato.';
    return;
  }
  if (!this.formData.counterparty_id) {
    this.errorMessage = 'Por favor, selecione a contraparte.';
    return;
  }
  if (!this.formData.total_amount || this.formData.total_amount <= 0) {
    this.errorMessage = 'Por favor, indique um valor total válido.';
    return;
  }
  if (!this.formData.start_date || !this.formData.end_date) {
    this.errorMessage = 'Por favor, indique as datas de início e fim.';
    return;
  }

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

  let operation;

  if (this.fromPAC && this.selectedNeed) {
    // 🔥 Payload específico para PAC
    const pacPayload = {
      title: this.formData.title,
      object: this.formData.object || this.formData.title,
      contract_type: this.mapContractType(this.selectedNeed.contract_type),
      counterparty_id: this.formData.counterparty_id,
      total_amount: this.formData.total_amount,
      start_date: this.formData.start_date,
      end_date: this.formData.end_date,
      signature_date: this.formData.signature_date || null,
      vat_rate: this.formData.vat_rate,
      withholding_tax_rate: this.formData.withholding_tax_rate,
      payment_model: this.formData.payment_model || 'single',
      notes: this.formData.internal_notes || ''
    };
    operation = this.pacService.generateContract(this.selectedNeed.id, pacPayload);
  } else if (this.isEdit && this.contract) {
    // Edição de contrato existente
    operation = this.contractService.update(this.contract.id, payload);
  } else {
    // Criação de novo contrato normal
    operation = this.contractService.create(payload);
  }

  // ✅ AQUI ESTAVA O PROBLEMA: Faltava o subscribe!
  operation.subscribe({
    next: (response: any) => {
      this.isSaving = false;
      this.saved.emit(response.data);
      this.close.emit();
    },
    error: (err: any) => {
      this.isSaving = false;
      console.error('Erro ao guardar contrato:', err);
      this.errorMessage = err.error?.message || 'Ocorreu um erro ao guardar o contrato. Verifique os dados.';
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
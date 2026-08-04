import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PACService, AnnualContractPlan, PlanNeed } from '../../../core/services/pac.service';
import { ContractService } from '../../../core/services/contract.service';
import { EntityService, Entity } from '../../../core/services/entity.service';

@Component({
  selector: 'app-pac-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pac-detail.html',
  styleUrls: ['./pac-detail.scss']
})
export class PACDetailComponent {
  private pacService = inject(PACService);
  private contractService = inject(ContractService);
  private entityService = inject(EntityService);

  @Input() plan!: AnnualContractPlan;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  activeTab = 'overview';
  isLoading = false;
  actionMessage = '';
  actionError = '';

  Math = Math;

  showSpecificationField: boolean | undefined;

  // Modais
  showNeedFormModal = false;
  editingNeed: PlanNeed | null = null;
  showGenerateContractModal = false;
  selectedNeed: PlanNeed | null = null;
  isGeneratingContract = false;

  entities: Entity[] = [];
  contractTypes: any[] = [];
  loadingEntities = false;

  // Formulário de necessidade
  needFormData = {
    contract_type: 'works',
    procedure_type: 'dynamic_electronic',
    title: '',
    description: '',
    justification: '',
    estimated_amount: 0,
    priority: 'medium',
    planned_quarter: null as number | null
  };

contractFormData = {
  counterparty_id: '',
  contract_type_id: '', // ← ADICIONAR
  contract_type_specification: '',
  start_date: '',
  end_date: '',
  signature_date: '',
  vat_rate: 14,
  withholding_tax_rate: 2,
  payment_model: 'fixed',
  notes: '',
  total_amount: 0,
  use_estimated_amount: true,
};


  paymentModels = [
  { value: 'single', label: 'Pagamento Único' },
  { value: 'installment', label: 'Pagamento Parcelar' },
  { value: 'measurement', label: 'Por Auto de Medição' },
  { value: 'consignment', label: 'À Consignação' },
  { value: 'milestone', label: 'Por Marcos' }
];

  procedureTypes = [
    { value: 'dynamic_electronic', label: 'Dinâmico Eletrónico' },
    { value: 'invitation', label: 'Convite' },
    { value: 'limited_tender', label: 'Concurso Limitado' },
    { value: 'direct_award', label: 'Ajuste Direto' }
  ];

  priorities = [
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' }
  ];
  

  formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B AOA`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M AOA`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K AOA`;
    return `${value.toFixed(2)} AOA`;
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'draft': { label: 'Rascunho', class: 'status--draft', icon: '' },
      'submitted': { label: 'Submetido', class: 'status--submitted', icon: '' },
      'approved': { label: 'Aprovado', class: 'status--approved', icon: '' },
      'in_progress': { label: 'Em Execução', class: 'status--in-progress', icon: '' },
      'completed': { label: 'Concluído', class: 'status--completed', icon: '' },
      'cancelled': { label: 'Cancelado', class: 'status--cancelled', icon: '' }
    };
    return statuses[status] || { label: status, class: '', icon: '' };
  }

  getNeedStatusInfo(status: string): { label: string; class: string } {
    const statuses: { [key: string]: { label: string; class: string } } = {
      'planned': { label: 'Planeada', class: 'need--planned' },
      'in_progress': { label: 'Em Curso', class: 'need--in-progress' },
      'contracted': { label: 'Contratada', class: 'need--contracted' },
      'cancelled': { label: 'Cancelada', class: 'need--cancelled' }
    };
    return statuses[status] || { label: status, class: '' };
  }

  getPriorityInfo(priority: string): { label: string; class: string } {
    const priorities: { [key: string]: { label: string; class: string } } = {
      'high': { label: 'Alta', class: 'priority--high' },
      'medium': { label: 'Média', class: 'priority--medium' },
      'low': { label: 'Baixa', class: 'priority--low' }
    };
    return priorities[priority] || { label: priority, class: '' };
  }

  getExecutionClass(): string {
    const pct = this.plan.financial.execution_percentage;
    if (pct === 0) return 'execution--none';
    if (pct < 50) return 'execution--low';
    if (pct < 100) return 'execution--medium';
    return 'execution--complete';
  }

  // ─── Ações do Plano ──────────────────────────────────────

  submitPlan(): void {
    this.performAction(() => 
      this.pacService.submit(this.plan.id)
    , 'Plano submetido para aprovação!');
  }

  approvePlan(): void {
    if (!confirm('Tem a certeza que deseja aprovar este plano?')) return;
    this.performAction(() => 
      this.pacService.approve(this.plan.id)
    , 'Plano aprovado com sucesso!');
  }

  cancelPlan(): void {
    if (!confirm('Tem a certeza que deseja cancelar este plano? Esta ação é irreversível.')) return;
    this.performAction(() => 
      this.pacService.cancel(this.plan.id)
    , 'Plano cancelado.');
  }

  private performAction(action: () => any, successMessage: string): void {
    this.isLoading = true;
    this.actionMessage = '';
    this.actionError = '';

    action().subscribe({
      next: (response: { data: AnnualContractPlan; }) => {
        this.plan = response.data;
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

  // ─── Gestão de Necessidades ──────────────────────────────

  openAddNeedModal(): void {
    this.editingNeed = null;
    this.needFormData = {
      contract_type: 'works',
      procedure_type: 'dynamic_electronic',
      title: '',
      description: '',
      justification: '',
      estimated_amount: 0,
      priority: 'medium',
      planned_quarter: null
    };
    this.showNeedFormModal = true;
  }

  editNeed(need: PlanNeed): void {
    this.editingNeed = need;
    this.needFormData = {
      contract_type: need.contract_type,
      procedure_type: need.procedure_type,
      title: need.title,
      description: need.description || '',
      justification: need.justification || '',
      estimated_amount: need.estimated_amount,
      priority: need.priority,
      planned_quarter: need.planned_quarter
    };
    this.showNeedFormModal = true;
  }

  closeNeedFormModal(): void {
    this.showNeedFormModal = false;
    this.editingNeed = null;
  }

  saveNeed(): void {
    if (!this.needFormData.title.trim()) {
      this.actionError = 'O título é obrigatório';
      return;
    }

    const operation = this.editingNeed
      ? this.pacService.updateNeed(this.editingNeed.id, this.needFormData)
      : this.pacService.addNeed(this.plan.id, this.needFormData);

    operation.subscribe({
      next: () => {
        this.closeNeedFormModal();
        this.refreshPlan();
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Erro ao guardar necessidade';
      }
    });
  }

  deleteNeed(need: PlanNeed): void {
    if (!confirm(`Tem a certeza que deseja eliminar a necessidade "${need.title}"?`)) return;

    this.pacService.deleteNeed(need.id).subscribe({
      next: () => {
        this.refreshPlan();
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Erro ao eliminar necessidade';
      }
    });
  }

  openGenerateContractModal(need: PlanNeed): void {
  this.selectedNeed = need;
  this.showGenerateContractModal = true;
  
  // Carregar os tipos de contrato
  this.loadContractTypes();
  
  this.contractFormData = {
    counterparty_id: '',
    contract_type_id: '',
    contract_type_specification: '',
    start_date: '',
    end_date: '',
    signature_date: new Date().toISOString().split('T')[0],
    vat_rate: 14,
    withholding_tax_rate: 2,
    payment_model: 'single', // 🔥 VALOR PADRÃO EXPLÍCITO
    notes: '',
    total_amount: need.estimated_amount,
    use_estimated_amount: true,
  };
  
  this.loadEntities();
}

// Método auxiliar para mapear os tipos
private mapContractType(type: string): string {
  const mapping: { [key: string]: string } = {
    'works': 'public_works',
    'services': 'services_acquisition',
    'supply': 'goods_acquisition',
    'consultancy': 'consultancy',
    'lease': 'goods_rental',
    'concession': 'public_works_concession',
    'public_services_concession': 'public_services_concession',
    'other': 'other'
  };
  return mapping[type] || type;
}

// 🆕 NOVO: Método para alternar entre valor estimado e personalizado
toggleEstimatedAmount(): void {
  this.contractFormData.use_estimated_amount = !this.contractFormData.use_estimated_amount;
  if (this.contractFormData.use_estimated_amount && this.selectedNeed) {
    this.contractFormData.total_amount = this.selectedNeed.estimated_amount;
  }
}

  closeGenerateContractModal(): void {
    this.showGenerateContractModal = false;
    this.selectedNeed = null;
  }

  onContractTypeChange(selectedTypeId: string): void {
  const selectedType = this.contractTypes.find(t => t.id === selectedTypeId);
  if (selectedType?.requiresSpecification) {
    this.showSpecificationField = true;
  } else {
    this.showSpecificationField = false;
    this.contractFormData.contract_type_specification = '';
  }
}
  

  loadEntities(): void {
    this.loadingEntities = true;
    this.entityService.list({ per_page: 100, status: 'active' }).subscribe({
      next: (response) => {
        this.entities = response.data;
        this.loadingEntities = false;
      },
      error: () => {
        this.loadingEntities = false;
      }
    });
  }

  loadContractTypes(): void {
  // Carregar do backend em vez de usar dados mock
  this.contractService.getContractTypes().subscribe({
    next: (response: any) => {
      this.contractTypes = response.data || response;
      
      // Após carregar, tentar pré-selecionar o tipo
      if (this.selectedNeed && this.selectedNeed.contract_type) {
        const matchedType = this.contractTypes.find(t => 
          t.code === this.selectedNeed!.contract_type || 
          t.code === this.mapContractType(this.selectedNeed!.contract_type)
        );
        if (matchedType) {
          this.contractFormData.contract_type_id = matchedType.id;
        }
      }
    },
    error: (err) => {
      console.error('Erro ao carregar tipos de contrato:', err);
      // Fallback para dados mock apenas em caso de erro
      this.contractTypes = [
       
        { id: 'db23f5df-29cb-4556-a4b8-05601835e5f4', code: 'public_works', name: 'Empreitada de obras públicas', requires_specification: false },
        { id: '7990d7cb-8e03-4eb5-83e5-6d027af103e5', code: 'goods_acquisition', name: 'Aquisição de bens móveis', requires_specification: false },
        { id: '4a9a493b-eb39-43b8-a853-b16ac365a51b', code: 'services_acquisition', name: 'Aquisição de serviços', requires_specification: false },
        { id: '2e2a098d-41a5-44bb-ae55-a3f2f12bd497', code: 'consultancy', name: 'Serviços de consultoria', requires_specification: false },
        { id: 'e79ec9ce-ab99-4d42-ac45-a294cc3cec23', code: 'goods_rental', name: 'Locação de bens móveis', requires_specification: false },
        { id: '829305cb-f177-4559-a081-cbcc4f7298f5', code: 'public_works_concession', name: 'Concessão de obras públicas', requires_specification: false },
        { id: '0cadc327-0ca2-4c7c-b6b9-6494d43116a7', code: 'public_services_concession', name: 'Concessão de serviços públicos', requires_specification: false },
        { id: 'a7ac93e7-4d02-41e6-a504-a1c669bb412a', code: 'other', name: 'Outro', requires_specification: true }
      ];
    }
  });
}

//   loadContractTypes(): void {
//   this.contractService.getContractTypes?.().subscribe({
//     next: (response: any) => {
//       this.contractTypes = response.data || response;
      
//       // Tenta pré-selecionar o tipo com base na necessidade do PAC
//       const needType = this.selectedNeed?.contract_type; // ex: 'works', 'services'
//       const matched = this.contractTypes.find((t: any) => 
//         t.code === needType || t.name?.toLowerCase().includes(needType === 'works' ? 'empreitada' : needType)
//       );
      
//       if (matched) {
//         this.contractFormData.contract_type_id = matched.id;
//       }
//     },
//     error: () => {
//       this.contractTypes = [];
//     }
//   });
// }

    generateContract(): void {
  if (!this.selectedNeed) return;

  // Validações
  if (!this.contractFormData.counterparty_id) {
    this.actionError = 'Por favor, selecione uma contraparte';
    return;
  }
  if (!this.contractFormData.start_date || !this.contractFormData.end_date) {
    this.actionError = 'Por favor, indique as datas de início e fim';
    return;
  }
  if (!this.contractFormData.total_amount || this.contractFormData.total_amount <= 0) {
    this.actionError = 'Por favor, indique o valor do contrato';
    return;
  }

  // 🔥 VALIDAR PAYMENT_MODEL
  if (!this.contractFormData.payment_model) {
    this.actionError = 'Por favor, selecione um modelo de pagamento';
    return;
  }

  this.isGeneratingContract = true;
  this.actionError = '';

  // MAPEAMENTO DOS TIPOS DE CONTRATO
  const contractTypeMapping: { [key: string]: string } = {
    'works': 'public_works',
    'services': 'services_acquisition',
    'supply': 'goods_acquisition',
    'consultancy': 'consultancy',
    'lease': 'goods_rental',
    'concession': 'public_works_concession',
    'public_services_concession': 'public_services_concession',
    'other': 'other'
  };

  const contractTypeCode = contractTypeMapping[this.selectedNeed.contract_type] || this.selectedNeed.contract_type;

  // 🔥 GARANTIR QUE PAYMENT_MODEL TEM VALOR
  const paymentModel = this.contractFormData.payment_model || 'single';

  const payload = {
    title: this.selectedNeed.title,
    object: this.selectedNeed.description || this.selectedNeed.title,
    counterparty_id: this.contractFormData.counterparty_id,
    contract_type: contractTypeCode,
    procedure_type: this.selectedNeed.procedure_type,
    total_amount: this.contractFormData.total_amount,
    start_date: this.contractFormData.start_date,
    end_date: this.contractFormData.end_date,
    signature_date: this.contractFormData.signature_date || null,
    vat_rate: this.contractFormData.vat_rate || 14,
    withholding_tax_rate: this.contractFormData.withholding_tax_rate || 2,
    payment_model: paymentModel, // 🔥 CAMPO OBRIGATÓRIO
    notes: this.contractFormData.notes || ''
  };

  console.log('Payload a ser enviado:', payload); // 🔥 DEBUG

  this.pacService.generateContract(this.selectedNeed.id, payload).subscribe({
    next: (response: any) => {
      this.isGeneratingContract = false;
      this.actionMessage = `Contrato ${response.data.contract_number} gerado com sucesso!`;
      this.showGenerateContractModal = false;
      this.selectedNeed = null;
      this.refreshPlan();
      setTimeout(() => this.actionMessage = '', 4000);
    },
    error: (err: { error?: { message: string } }) => {
      this.isGeneratingContract = false;
      this.actionError = err.error?.message || 'Erro ao gerar contrato';
      console.error('Erro detalhado:', err); // 🔥 DEBUG
    }
  });
}

  private refreshPlan(): void {
    this.refresh.emit();
  }
}
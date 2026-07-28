import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PACService, AnnualContractPlan, PlanNeed } from '../../../core/services/pac.service';

@Component({
  selector: 'app-pac-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pac-detail.html',
  styleUrls: ['./pac-detail.scss']
})
export class PACDetailComponent {
  private pacService = inject(PACService);

  @Input() plan!: AnnualContractPlan;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  activeTab = 'overview';
  isLoading = false;
  actionMessage = '';
  actionError = '';

  // Modais
  showNeedFormModal = false;
  editingNeed: PlanNeed | null = null;
  showGenerateContractModal = false;
  selectedNeed: PlanNeed | null = null;

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

  contractTypes = [
    { value: 'works', label: 'Empreitada' },
    { value: 'goods', label: 'Aquisição de Bens Móveis' },
    { value: 'services', label: 'Prestação de Serviços' },
    { value: 'consultancy', label: 'Consultoria' }
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
      'draft': { label: 'Rascunho', class: 'status--draft', icon: '📝' },
      'submitted': { label: 'Submetido', class: 'status--submitted', icon: '📤' },
      'approved': { label: 'Aprovado', class: 'status--approved', icon: '✅' },
      'in_progress': { label: 'Em Execução', class: 'status--in-progress', icon: '⚙️' },
      'completed': { label: 'Concluído', class: 'status--completed', icon: '🏁' },
      'cancelled': { label: 'Cancelado', class: 'status--cancelled', icon: '🚫' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
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
  }

  closeGenerateContractModal(): void {
    this.showGenerateContractModal = false;
    this.selectedNeed = null;
  }

  generateContract(): void {
    // Por agora, apenas navegar para a página de contratos com os dados pré-preenchidos
    // Em produção, chamarias this.pacService.generateContract()
    alert(`Gerar contrato para: ${this.selectedNeed?.title}\n\nEsta funcionalidade será implementada na próxima fase.`);
    this.closeGenerateContractModal();
  }

  private refreshPlan(): void {
    this.refresh.emit();
  }
}
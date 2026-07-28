import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityService, Entity } from '../../../core/services/entity.service';
import { DocumentUploaderComponent } from '../../../shared/components/document-uploader/document-uploader';

@Component({
  selector: 'app-entity-detail',
  standalone: true,
  imports: [CommonModule, DocumentUploaderComponent],
  templateUrl: './entity-detail.html',
  styleUrls: ['./entity-detail.scss']
})
export class EntityDetailComponent {
  private entityService = inject(EntityService);

  @Input() entity!: Entity;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Entity>();

  activeTab = 'overview';
  isLoading = false;
  actionMessage = '';
  actionError = '';

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    if (status === 'active') {
      return { label: 'Ativo', class: 'status--active', icon: '🟢' };
    }
    return { label: 'Suspenso', class: 'status--suspended', icon: '⏸️' };
  }

  getComplianceStatus(): { label: string; class: string } {
    if (this.entity.compliance.is_compliant) {
      return { label: 'Conforme', class: 'compliance--ok' };
    }
    
    const agt = this.entity.compliance.certificates.agt;
    const inss = this.entity.compliance.certificates.inss;
    
    if (!agt.is_valid || !inss.is_valid) {
      return { label: 'Expirada', class: 'compliance--expired' };
    }
    
    if ((agt.days_until_expiry && agt.days_until_expiry <= 30) || 
        (inss.days_until_expiry && inss.days_until_expiry <= 30)) {
      return { label: 'A expirar', class: 'compliance--warning' };
    }
    
    return { label: 'Conforme', class: 'compliance--ok' };
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'supplier': 'Fornecedor',
      'client': 'Cliente',
      'contractor': 'Empreiteiro',
      'subcontractor': 'Subempreiteiro',
      'public_entity': 'Entidade Pública',
      'consultant': 'Consultor'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'supplier': '🏪',
      'client': '👤',
      'contractor': '🏗️',
      'subcontractor': '🔧',
      'public_entity': '🏛️',
      'consultant': '💼'
    };
    return icons[type] || '🏢';
  }

  toggleStatus(): void {
    const isSuspending = this.entity.status === 'active';
    const confirmMessage = isSuspending
      ? `Tem certeza que deseja suspender a entidade "${this.entity.identification.name}"?`
      : `Tem certeza que deseja reativar a entidade "${this.entity.identification.name}"?`;

    if (!confirm(confirmMessage)) return;

    this.isLoading = true;
    this.actionMessage = '';
    this.actionError = '';

    const operation = isSuspending
      ? this.entityService.suspend(this.entity.id, 'Suspenso pelo utilizador')
      : this.entityService.reactivate(this.entity.id);

    operation.subscribe({
      next: (response) => {
        this.entity = response.data;
        this.isLoading = false;
        this.actionMessage = isSuspending ? 'Entidade suspensa com sucesso!' : 'Entidade reativada com sucesso!';
        this.refresh.emit();
        setTimeout(() => this.actionMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao alterar estado da entidade';
      }
    });
  }

  openEditModal(): void {
    this.edit.emit(this.entity);
  }
}
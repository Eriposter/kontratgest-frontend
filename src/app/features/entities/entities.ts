import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityService, Entity } from '../../core/services/entity.service';
import { EntityFormComponent } from './entity-form/entity-form';

@Component({
  selector: 'app-entities',
  standalone: true,
  imports: [CommonModule, FormsModule, EntityFormComponent],
  templateUrl: './entities.html',
  styleUrls: ['./entities.scss']
})
export class EntitiesComponent implements OnInit {
  private entityService = inject(EntityService);

  entities: Entity[] = [];
  loading = true;
  error = '';
  
  // Filtros
  searchQuery = '';
  selectedType = '';
  selectedStatus = 'active';
  
  // Paginação
  currentPage = 1;
  totalPages = 1;
  totalEntities = 0;
  perPage = 10;
  
  // Modal de Detalhes
  showDetailModal = false;
  selectedEntity: Entity | null = null;
  
  // Modal de Formulário (Criação/Edição)
  showFormModal = false;
  editingEntity: Entity | null = null;

  // Loading de toggle
  togglingEntityId: number | string | null = null;

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
    };

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    if (this.selectedType) {
      params.type = this.selectedType;
    }

    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }

    this.entityService.list(params).subscribe({
      next: (response) => {
        this.entities = response.data;
        this.totalPages = response.meta.last_page;
        this.totalEntities = response.meta.total;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar entidades';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadEntities();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadEntities();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEntities();
    }
  }

  viewDetails(entity: Entity): void {
    this.selectedEntity = entity;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedEntity = null;
  }

  openCreateModal(): void {
    this.editingEntity = null;
    this.showFormModal = true;
    this.showDetailModal = false;
  }

  editEntity(entity: Entity): void {
    this.editingEntity = entity;
    this.showFormModal = true;
    this.showDetailModal = false;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingEntity = null;
  }

  onEntitySaved(): void {
    this.closeFormModal();
    this.loadEntities();
  }

  // ─── NOVO: Toggle Status (Suspender/Reativar) ──────────
  // entities.component.ts - usando os novos métodos

toggleStatus(entity: Entity): void {
  if (this.togglingEntityId) return;

  const isSuspending = entity.status === 'active';
  const confirmMessage = isSuspending
    ? `Tem certeza que deseja suspender a entidade "${entity.identification.name}"?`
    : `Tem certeza que deseja reativar a entidade "${entity.identification.name}"?`;

  if (!confirm(confirmMessage)) {
    return;
  }

  this.togglingEntityId = entity.id;

  // Usando os métodos do service
  const operation = isSuspending
    ? this.entityService.suspend(entity.id, 'Suspenso pelo usuário')
    : this.entityService.reactivate(entity.id);

  operation.subscribe({
    next: (response) => {
      const index = this.entities.findIndex(e => e.id === entity.id);
      if (index !== -1) {
        this.entities[index] = response.data;
      }
      this.togglingEntityId = null;
      
      if (this.selectedEntity && this.selectedEntity.id === entity.id) {
        this.selectedEntity = response.data;
      }
    },
    error: (err) => {
      this.togglingEntityId = null;
      console.error('Erro ao alterar status:', err);
      // Usar um toast/snackbar em vez de alert
      this.error = 'Erro ao alterar status da entidade. Tente novamente.';
    }
  });
}


  getComplianceStatus(entity: Entity): { label: string; class: string } {
    if (entity.compliance.is_compliant) {
      return { label: 'Conforme', class: 'compliance--ok' };
    }
    
    const agt = entity.compliance.certificates.agt;
    const inss = entity.compliance.certificates.inss;
    
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
}
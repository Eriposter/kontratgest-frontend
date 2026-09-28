import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcurementService, ProcurementProcedure, ProcurementPhase } from '../../../core/services/procurement.service';
import { DocumentUploaderComponent } from '../../../shared/components/document-uploader/document-uploader';

@Component({
  selector: 'app-procedure-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentUploaderComponent],
  templateUrl: './procedure-detail.html',
  styleUrls: ['./procedure-detail.scss']
})
export class ProcedureDetailComponent implements OnInit {
  private procurementService = inject(ProcurementService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  procedure: ProcurementProcedure | null = null;
  loading = true;
  error = '';
  activeTab = 'overview';

  // Mensagens de feedback
  actionMessage = '';
  actionError = '';
  isLoading = false;

  // Modais - Estados
  showCompletePhaseModal = false;
  showAdjudicateModal = false;
  showCancelModal = false;

  // Dados dos modais
  selectedPhase: ProcurementPhase | null = null;
  phaseNotes = '';
  adjudicationData = {
    winning_entity_id: '',
    adjudication_notes: ''
  };
  cancelReason = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProcedure(id);
    }
  }

  loadProcedure(id: string): void {
    this.loading = true;
    this.error = '';
    this.procurementService.get(id).subscribe({
      next: (response) => {
        this.procedure = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao carregar procedimento';
        this.loading = false;
      }
    });
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: any = {
      'planned': { label: 'Planeado', class: 'status--planned', icon: '' },
      'in_progress': { label: 'Em Curso', class: 'status--in-progress', icon: '⏳' },
      'evaluation': { label: 'Em Avaliação', class: 'status--evaluation', icon: '🔍' },
      'completed': { label: 'Finalizado', class: 'status--completed', icon: '✅' },
      'cancelled': { label: 'Cancelado', class: 'status--cancelled', icon: '' },
      'failed': { label: 'Deserto', class: 'status--failed', icon: '❌' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
  }

  getPhaseStatusInfo(status: string): { label: string; class: string } {
    const statuses: any = {
      'pending': { label: 'Pendente', class: 'phase--pending' },
      'ongoing': { label: 'Em Curso', class: 'phase--ongoing' },
      'completed': { label: 'Concluída', class: 'phase--completed' },
      'cancelled': { label: 'Cancelada', class: 'phase--cancelled' }
    };
    return statuses[status] || { label: status, class: '' };
  }

  // ─── AÇÕES DO PROCEDIMENTO ─────────────────────────────

  startProcedure(): void {
    if (!confirm('Iniciar o procedimento de contratação? A primeira fase será ativada automaticamente.')) return;
    this.isLoading = true;
    this.actionMessage = '';
    this.actionError = '';
    this.procurementService.start(this.procedure!.id).subscribe({
      next: (response) => {
        this.procedure = response.data;
        this.isLoading = false;
        this.actionMessage = 'Procedimento iniciado! Primeira fase ativada.';
        setTimeout(() => this.actionMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao iniciar procedimento';
      }
    });
  }

  // ─── GESTÃO DE FASES ───────────────────────────────────

  openCompletePhaseModal(phase: ProcurementPhase): void {
    this.selectedPhase = phase;
    this.phaseNotes = '';
    this.showCompletePhaseModal = true;
  }

  confirmCompletePhase(): void {
    if (!this.selectedPhase) return;
    this.isLoading = true;
    this.actionError = '';
    this.procurementService.completePhase(this.procedure!.id, this.selectedPhase.id, {
      notes: this.phaseNotes,
      end_date: new Date().toISOString().split('T')[0]
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showCompletePhaseModal = false;
        this.selectedPhase = null;
        this.phaseNotes = '';
        // Recarregar para atualizar fases e estado
        if (this.procedure) {
          this.loadProcedure(this.procedure.id);
        }
        this.actionMessage = 'Fase concluída com sucesso!';
        setTimeout(() => this.actionMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao concluir fase';
      }
    });
  }

  // ─── ADJUDICAÇÃO ──────────────────────────────────────

  openAdjudicateModal(): void {
    this.adjudicationData = {
      winning_entity_id: '',
      adjudication_notes: ''
    };
    this.showAdjudicateModal = true;
  }

  confirmAdjudicate(): void {
    if (!this.adjudicationData.winning_entity_id) {
      this.actionError = 'Selecione uma entidade vencedora.';
      return;
    }
    this.isLoading = true;
    this.actionError = '';
    this.procurementService.complete(this.procedure!.id, this.adjudicationData).subscribe({
      next: (response) => {
        this.procedure = response.data;
        this.isLoading = false;
        this.showAdjudicateModal = false;
        this.actionMessage = 'Procedimento adjudicado com sucesso!';
        setTimeout(() => this.actionMessage = '', 4000);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao adjudicar';
      }
    });
  }

  // ─── CANCELAMENTO ──────────────────────────────────────

  openCancelModal(): void {
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  confirmCancel(): void {
    if (!this.cancelReason.trim()) {
      this.actionError = 'Motivo do cancelamento é obrigatório';
      return;
    }
    if (!confirm('Tem a certeza que deseja cancelar este procedimento? Esta ação é irreversível.')) return;
    this.isLoading = true;
    this.actionError = '';
    this.procurementService.cancel(this.procedure!.id, this.cancelReason).subscribe({
      next: (response) => {
        this.procedure = response.data;
        this.isLoading = false;
        this.showCancelModal = false;
        this.actionMessage = 'Procedimento cancelado.';
        setTimeout(() => this.actionMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao cancelar';
      }
    });
  }

  // ─── UTILITÁRIOS ───────────────────────────────────────

  formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B AOA`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M AOA`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K AOA`;
    return `${value.toFixed(2)} AOA`;
  }
}
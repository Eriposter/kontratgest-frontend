import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PACService, ContractingProcedure } from '../../../core/services/pac.service';

@Component({
  selector: 'app-procedure-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procedure-detail.html',
  styleUrls: ['./procedure-detail.scss']
})
export class ProcedureDetailComponent implements OnInit {
  private pacService = inject(PACService);

  @Input() procedure!: ContractingProcedure;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<ContractingProcedure>();

  isLoading = false;
  actionMessage = '';
  actionError = '';
  cancelReason = '';
  showCancelModal = false;

  ngOnInit(): void {
    // Carregar detalhes completos
    this.pacService.getProcedure(this.procedure.id).subscribe({
      next: (response) => {
        this.procedure = response.data;
      }
    });
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: { [key: string]: { label: string; class: string; icon: string } } = {
      'planned': { label: 'Planeado', class: 'status--planned', icon: '📋' },
      'in_progress': { label: 'Em Curso', class: 'status--in-progress', icon: '⏳' },
      'evaluation': { label: 'Em Avaliação', class: 'status--evaluation', icon: '🔍' },
      'completed': { label: 'Finalizado', class: 'status--completed', icon: '✅' },
      'cancelled': { label: 'Cancelado', class: 'status--cancelled', icon: '🚫' },
      'failed': { label: 'Deserto', class: 'status--failed', icon: '❌' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
  }

  startProcedure(): void {
    if (!confirm('Iniciar o procedimento de contratação?')) return;
    this.isLoading = true;
    this.pacService.startProcedure(this.procedure.id).subscribe({
      next: (response) => {
        this.procedure = response.data;
        this.isLoading = false;
        this.updated.emit(response.data);
        this.actionMessage = 'Procedimento iniciado!';
        setTimeout(() => this.actionMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao iniciar procedimento';
      }
    });
  }

  moveToEvaluation(): void {
    if (!confirm('Mover para fase de avaliação de propostas?')) return;
    this.isLoading = true;
    this.pacService.moveToEvaluation(this.procedure.id).subscribe({
      next: (response) => {
        this.procedure = response.data;
        this.isLoading = false;
        this.updated.emit(response.data);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao mover para avaliação';
      }
    });
  }

  completeProcedure(): void {
    if (!this.procedure.winning_entity_id) {
      this.actionError = 'Selecione a entidade vencedora antes de completar';
      return;
    }
    if (!confirm('Confirmar adjudicação e completar o procedimento?')) return;
    this.isLoading = true;
    this.pacService.completeProcedure(this.procedure.id, {
      winning_entity_id: this.procedure.winning_entity_id!,
      adjudication_notes: this.procedure.adjudication_notes ?? undefined
    }).subscribe({
      next: (response) => {
        this.procedure = response.data;
        this.isLoading = false;
        this.updated.emit(response.data);
        this.actionMessage = 'Procedimento finalizado com sucesso!';
        setTimeout(() => this.actionMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao completar procedimento';
      }
    });
  }

  openCancelModal(): void {
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  cancelProcedure(): void {
    if (!this.cancelReason.trim()) {
      this.actionError = 'Motivo do cancelamento é obrigatório';
      return;
    }
    this.isLoading = true;
    this.pacService.cancelProcedure(this.procedure.id, this.cancelReason).subscribe({
      next: (response) => {
        this.procedure = response.data;
        this.isLoading = false;
        this.showCancelModal = false;
        this.updated.emit(response.data);
      },
      error: (err) => {
        this.isLoading = false;
        this.actionError = err.error?.message || 'Erro ao cancelar procedimento';
      }
    });
  }

  formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B AOA`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M AOA`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K AOA`;
    return `${value.toFixed(2)} AOA`;
  }
}
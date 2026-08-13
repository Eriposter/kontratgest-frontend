import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService, Contract, ContractProgress, ProgressUpdate } from '../../../core/services/contract.service';

@Component({
  selector: 'app-contract-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-progress.html',
  styleUrls: ['./contract-progress.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractProgressComponent implements OnInit {
  private contractService = inject(ContractService);

  @Input() contract!: Contract;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  progress: ContractProgress | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  // Form
  newProgress = 0;
  newNotes = '';

  ngOnInit(): void {
    this.loadProgress();
  }

  loadProgress(): void {
    this.loading = true;
    this.contractService.getProgress(this.contract.id).subscribe({
      next: (response) => {
        this.progress = response.data;
        this.newProgress = this.progress.current.current_progress;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Erro ao carregar progresso';
      }
    });
  }

  updateProgress(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.contractService.updateProgress(this.contract.id, {
      progress_percentage: this.newProgress,
      notes: this.newNotes
    }).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Progresso atualizado com sucesso!';
        this.newNotes = '';
        this.loadProgress();
        this.updated.emit();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Erro ao atualizar progresso';
      }
    });
  }

  calculateAutomatic(): void {
    if (!confirm('Recalcular progresso automaticamente baseado nos pagamentos?')) return;

    this.saving = true;
    this.contractService.calculateProgress(this.contract.id).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Progresso recalculado com sucesso!';
        this.loadProgress();
        this.updated.emit();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Erro ao recalcular';
      }
    });
  }

  getUpdateTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'manual': 'Manual',
      'automatic': 'Automático',
      'payment': 'Pagamento',
      'measurement': 'Auto de Medição'
    };
    return labels[type] || type;
  }

  getUpdateTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'manual': 'type--manual',
      'automatic': 'type--automatic',
      'payment': 'type--payment',
      'measurement': 'type--measurement'
    };
    return classes[type] || '';
  }
}
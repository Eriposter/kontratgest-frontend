import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProcurementService, ProcurementProcedure } from '../../../core/services/procurement.service';

@Component({
  selector: 'app-procedure-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './procedure-list.html',
  styleUrls: ['./procedure-list.scss']
})
export class ProcedureListComponent implements OnInit {
  private procurementService = inject(ProcurementService);

  procedures: ProcurementProcedure[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadProcedures();
  }

  loadProcedures(): void {
    this.loading = true;
    this.procurementService.list({ per_page: 50 }).subscribe({
      next: (response) => {
        this.procedures = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar procedimentos';
        this.loading = false;
      }
    });
  }

  getStatusInfo(status: string): { label: string; class: string; icon: string } {
    const statuses: any = {
      'planned': { label: 'Planeado', class: 'status--planned', icon: '📋' },
      'in_progress': { label: 'Em Curso', class: 'status--in-progress', icon: '⏳' },
      'evaluation': { label: 'Em Avaliação', class: 'status--evaluation', icon: '🔍' },
      'completed': { label: 'Finalizado', class: 'status--completed', icon: '✅' },
      'cancelled': { label: 'Cancelado', class: 'status--cancelled', icon: '🚫' },
      'failed': { label: 'Deserto', class: 'status--failed', icon: '' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
  }

  formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B AOA`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M AOA`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K AOA`;
    return `${value.toFixed(2)} AOA`;
  }
}
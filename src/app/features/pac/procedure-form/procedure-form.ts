import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PACService, PlanNeed, ContractingProcedure } from '../../../core/services/pac.service';
import { EntityService, Entity } from '../../../core/services/entity.service';

@Component({
  selector: 'app-procedure-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procedure-form.html',
  styleUrls: ['./procedure-form.scss']
})
export class ProcedureFormComponent implements OnInit {
  private pacService = inject(PACService);
  private entityService = inject(EntityService);

  @Input() procedure: ContractingProcedure | null = null;
  @Input() need: PlanNeed | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ContractingProcedure>();

  isEdit = false;
  isSaving = false;
  errorMessage = '';
  entities: Entity[] = [];
  loadingEntities = false;

  formData = {
    plan_need_id: '',
    procedure_start_date: '',
    procedure_end_date: '',
    confirmed_start_date: '',
    confirmed_end_date: '',
    notes: '',
    winning_entity_id: '',
    adjudication_notes: ''
  };

  ngOnInit(): void {
    this.loadEntities();
    if (this.procedure) {
      this.isEdit = true;
      this.loadProcedureData();
    } else if (this.need) {
      this.formData.plan_need_id = this.need.id;
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

  loadProcedureData(): void {
    if (!this.procedure) return;
    this.formData = {
      plan_need_id: this.procedure.plan_need_id,
      procedure_start_date: this.procedure.procedure_start_date,
      procedure_end_date: this.procedure.procedure_end_date,
      confirmed_start_date: this.procedure.confirmed_start_date || '',
      confirmed_end_date: this.procedure.confirmed_end_date || '',
      notes: this.procedure.notes || '',
      winning_entity_id: this.procedure.winning_entity_id || '',
      adjudication_notes: this.procedure.adjudication_notes || ''
    };
  }

  onSubmit(): void {
    if (!this.formData.plan_need_id) {
      this.errorMessage = 'Necessidade não selecionada';
      return;
    }
    if (!this.formData.procedure_start_date || !this.formData.procedure_end_date) {
      this.errorMessage = 'Datas do procedimento são obrigatórias';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const operation = this.isEdit && this.procedure
      ? this.pacService.updateProcedure(this.procedure.id, this.formData)
      : this.pacService.createProcedure(this.formData);

    operation.subscribe({
      next: (response) => {
        this.isSaving = false;
        this.saved.emit(response.data);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Erro ao guardar procedimento';
      }
    });
  }
}
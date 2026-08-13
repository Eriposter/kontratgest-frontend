import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PACService, AnnualContractPlan } from '../../../core/services/pac.service';

@Component({
  selector: 'app-pac-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pac-form.html',
  styleUrls: ['./pac-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PACFormComponent {
  private pacService = inject(PACService);

  @Input() plan: AnnualContractPlan | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isEdit = false;
  isSaving = false;
  errorMessage = '';

  formData = {
    year: new Date().getFullYear(),
    title: '',
    description: ''
  };

  ngOnInit(): void {
    if (this.plan) {
      this.isEdit = true;
      this.formData = {
        year: this.plan.year,
        title: this.plan.title,
        description: this.plan.description || ''
      };
    }
  }

  onSubmit(): void {
    if (!this.formData.title.trim()) {
      this.errorMessage = 'O título é obrigatório';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const operation = this.isEdit && this.plan
      ? this.pacService.update(this.plan.id, this.formData)
      : this.pacService.create(this.formData);

    operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.saved.emit();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Erro ao guardar plano';
      }
    });
  }

  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear + 1, currentYear + 2];
  }
}
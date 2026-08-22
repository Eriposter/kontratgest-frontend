// measurement-form.ts
import { Component, EventEmitter, Input, OnInit, Output, inject, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeasurementService, Measurement, MeasurementItem } from '../../../core/services/measurement.service';
import { ContractService, Contract } from '../../../core/services/contract.service';

@Component({
  selector: 'app-measurement-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './measurement-form.html',
  styleUrls: ['./measurement-form.scss'],
   
})
export class MeasurementFormComponent implements OnInit, AfterViewInit {
  private measurementService = inject(MeasurementService);
  private contractService = inject(ContractService);

  @Input() measurement: Measurement | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Measurement>();

  isEdit = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  currentStep = 1;
  totalSteps = 3;

  contracts: Contract[] = [];
  selectedContract: Contract | null = null;

  // Scroll management
  showScrollProgress = true;
  scrollProgress = 0;
  showScrollTop = false;
  private scrollContainer!: HTMLElement;
  
  @ViewChildren('stepElement') stepElements!: QueryList<ElementRef>;

  formData = {
    contract_id: '',
    period_start: '',
    period_end: '',
    observations: '',
    retention_percentage: 10,
    items: [] as any[]
  };

  ngOnInit(): void {
    this.loadContracts();
    if (this.measurement) {
      this.isEdit = true;
      this.loadMeasurementData();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.scrollContainer = document.querySelector('.form-scroll-container') as HTMLElement;
    });
  }

  loadContracts(): void {
    this.isLoading = true;
    this.contractService.list({ status: 'active', per_page: 100 }).subscribe({
      next: (response) => {
        this.contracts = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao carregar contratos';
      }
    });
  }

  loadMeasurementData(): void {
    if (!this.measurement) return;

    this.formData = {
      contract_id: this.measurement.contract.id,
      period_start: this.measurement.period.start,
      period_end: this.measurement.period.end,
      observations: this.measurement.observations || '',
      retention_percentage: this.measurement.financial.retention_percentage,
      items: this.measurement.items.map(item => ({
        item_code: item.item_code || '',
        description: item.description,
        unit: item.unit || 'un',
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    };

    this.selectedContract = this.contracts.find(c => c.id === this.measurement!.contract.id) || null;
  }

  // Scroll methods
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    
    this.scrollProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    this.showScrollTop = scrollTop > 200;
  }

  scrollToTop(): void {
    if (this.scrollContainer) {
      this.scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.scrollTo({
        top: this.scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  // Navigation methods with scroll
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.scrollToTop();
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.scrollToTop();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.scrollToTop();
    }
  }

  onContractChange(): void {
    this.selectedContract = this.contracts.find(c => c.id === this.formData.contract_id) || null;
  }

  // Item management
  addItem(): void {
    this.formData.items.push({
      item_code: '',
      description: '',
      unit: 'un',
      quantity: 0,
      unit_price: 0
    });

    // Scroll to the new item
    setTimeout(() => {
      const items = document.querySelectorAll('.item-card');
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        lastItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  removeItem(index: number): void {
    if (this.formData.items.length > 1) {
      this.formData.items.splice(index, 1);
    } else {
      this.errorMessage = 'O auto de medição deve ter pelo menos um item';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  calculateItemTotal(item: any): number {
    return (item.quantity || 0) * (item.unit_price || 0);
  }

  // Financial calculations
  getTotalAmount(): number {
    return this.formData.items.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
  }

  getRetentionAmount(): number {
    return this.getTotalAmount() * (this.formData.retention_percentage / 100);
  }

  getNetAmount(): number {
    return this.getTotalAmount() - this.getRetentionAmount();
  }

  // Validations
  isValidPeriod(): boolean {
    if (!this.formData.period_start || !this.formData.period_end) return true;
    return new Date(this.formData.period_start) < new Date(this.formData.period_end);
  }

  isItemValid(item: any): boolean {
    return item.description && 
           item.description.trim().length > 0 && 
           item.quantity > 0 && 
           item.unit_price > 0;
  }

  isFormValid(): boolean {
    // Check contract
    if (!this.formData.contract_id) return false;
    
    // Check period
    if (!this.isValidPeriod()) return false;
    
    // Check items
    if (this.formData.items.length === 0) return false;
    
    for (const item of this.formData.items) {
      if (!this.isItemValid(item)) return false;
    }
    
    return true;
  }

  getInvalidItemsCount(): number {
    return this.formData.items.filter(item => !this.isItemValid(item)).length;
  }

  // Submit
  onSubmit(): void {
  console.log('🔵 onSubmit chamado!');  // ← DEBUG
  
  if (!this.isFormValid()) {
    console.log('❌ Formulário inválido:', {
      contract_id: this.formData.contract_id,
      period_start: this.formData.period_start,
      period_end: this.formData.period_end,
      items: this.formData.items.length,
      invalidItems: this.getInvalidItemsCount()
    });
    
    this.errorMessage = 'Por favor, preencha todos os campos obrigatórios corretamente.';
    
    if (this.formData.items.length === 0 || this.getInvalidItemsCount() > 0) {
      this.currentStep = 2;
    } else if (!this.isValidPeriod() || !this.formData.contract_id) {
      this.currentStep = 1;
    }
    
    this.scrollToTop();
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
    
    return;
  }

  console.log('✅ Formulário válido, a enviar...');
  this.isSaving = true;
  this.errorMessage = '';

  const payload = {
    contract_id: this.formData.contract_id,
    period_start: this.formData.period_start,
    period_end: this.formData.period_end,
    observations: this.formData.observations || '',
    retention_percentage: this.formData.retention_percentage,
    total_amount: this.getTotalAmount(),
    items: this.formData.items
      .filter(item => this.isItemValid(item))
      .map(item => ({
        item_code: item.item_code || '',
        description: item.description,
        unit: item.unit || 'un',
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price)
      }))
  };

  console.log('📦 Payload:', payload);  // ← DEBUG

  const operation = this.isEdit && this.measurement
    ? this.measurementService.update(this.measurement.id, payload)
    : this.measurementService.create(payload);

  operation.subscribe({
    next: (response) => {
      console.log('✅ Resposta do servidor:', response);  // ← DEBUG
      this.isSaving = false;
      this.saved.emit(response.data || response);
    },
    error: (err) => {
      console.error('❌ Erro:', err);  // ← DEBUG
      this.isSaving = false;
      this.errorMessage = err.error?.message || 'Erro ao guardar auto de medição. Verifique os dados.';
      this.scrollToTop();
    }
  });
}

  // Utility methods
  formatCurrency(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(2);
  }

  getStepTitle(step: number): string {
    const titles = ['Contrato', 'Itens', 'Resumo'];
    return titles[step - 1] || '';
  }

  getStepStatus(step: number): string {
    if (step < this.currentStep) return 'completed';
    if (step === this.currentStep) return 'active';
    return 'pending';
  }

  getContractDisplay(contract: Contract): string {
    return `${contract.contract_number} - ${contract.title}`;
  }

  getUnitLabel(unit: string): string {
    const units: {[key: string]: string} = {
      'un': 'Unidade',
      'm': 'Metro',
      'm2': 'Metro quadrado',
      'm3': 'Metro cúbico',
      'kg': 'Quilograma',
      'h': 'Hora',
      'dia': 'Dia',
      'gl': 'Global'
    };
    return units[unit] || unit;
  }

  // Keyboard shortcuts
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
    
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      if (this.currentStep === this.totalSteps) {
        this.onSubmit();
      } else {
        this.nextStep();
      }
    }
  }

  // Track by for ngFor
  trackByIndex(index: number): number {
    return index;
  }

  trackByItem(index: number, item: any): string {
    return item.id || `item-${index}`;
  }
}
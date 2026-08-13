import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityService, Entity, EntityFormData } from '../../../core/services/entity.service';

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-form.html',
  styleUrls: ['./entity-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityFormComponent implements OnInit {
  private entityService = inject(EntityService);

  @Input() entity: Entity | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Entity>();

  isEdit = false;
  isLoading = false;
  errorMessage = '';
  currentStep = 1;

  // Dados do formulário
  formData = {
    entity_type: 'supplier',
    name: '',
    legal_name: '',
    nif: '',
    email: '',
    phone: '',
    phone_alt: '',
    website: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    agt_certificate_expiry: '',
    inss_certificate_expiry: '',
    tax_regime: 'general',
    is_tax_exempt: false,
    activity_code: '',
    notes: '',
    status: 'active',
    bank_accounts: [
      {
        bank: '',
        iban: '',
        account_holder: '',
        is_default: true
      }
    ]
  };

  // Validações
  nifErrors: string[] = [];

  provinces = [
    { value: 'benguela', label: 'Benguela' },
    { value: 'bengo', label: 'Bengo' },
    { value: 'bie', label: 'Bié' },
    { value: 'cabinda', label: 'Cabinda' },
    { value: 'cuando', label: 'Cuando' },
    { value: 'cubango', label: 'Cubango' },
    { value: 'cuanza_norte', label: 'Cuanza Norte' },
    { value: 'cuanza_sul', label: 'Cuanza Sul' },
    { value: 'cunene', label: 'Cunene' },
    { value: 'huambo', label: 'Huambo' },
    { value: 'huila', label: 'Huíla' },
    { value: 'luanda', label: 'Luanda' },
    { value: 'lunda_norte', label: 'Lunda Norte' },
    { value: 'lunda_sul', label: 'Lunda Sul' },
    { value: 'malanje', label: 'Malanje' },
    { value: 'moxico', label: 'Moxico' },
    { value: 'moxico_leste', label: 'Moxico Leste' },
    { value: 'namibe', label: 'Namibe' },
    { value: 'uige', label: 'Uíge' },
    { value: 'zaire', label: 'Zaire' }
  ];

  entityTypes = [
    { value: 'supplier', label: 'Fornecedor' },
    { value: 'contractor', label: 'Empreiteiro' },
    { value: 'consultant', label: 'Consultor' },
    { value: 'client', label: 'Cliente' },
    { value: 'public_entity', label: 'Entidade Pública' },
    { value: 'subcontractor', label: 'Subempreiteiro' }
  ];

  ngOnInit(): void {
    if (this.entity) {
      this.isEdit = true;
      this.loadEntityData();
    }
  }

  loadEntityData(): void {
    if (!this.entity) return;

    this.formData = {
      entity_type: this.entity.type,
      name: this.entity.identification.name,
      legal_name: this.entity.identification.legal_name || '',
      nif: this.entity.identification.nif,
      email: this.entity.contact.email || '',
      phone: this.entity.contact.phone || '',
      phone_alt: this.entity.contact.phone_alt || '',
      website: this.entity.contact.website || '',
      address: this.entity.address.street || '',
      city: this.entity.address.city || '',
      province: this.entity.address.province || '',
      postal_code: this.entity.address.postal_code || '',
      agt_certificate_expiry: this.entity.compliance.certificates.agt.expiry || '',
      inss_certificate_expiry: this.entity.compliance.certificates.inss.expiry || '',
      tax_regime: this.entity.compliance.tax_regime || 'general',
      is_tax_exempt: this.entity.compliance.tax_exempt || false,
      activity_code: this.entity.identification.activity_code || '',
      notes: this.entity.notes || '',
      status: this.entity.status || 'active',
      bank_accounts: this.entity.banking?.accounts && this.entity.banking.accounts.length > 0 
        ? this.entity.banking.accounts 
        : [{ bank: '', iban: '', account_holder: '', is_default: true }]
    };
  }

  // ─── VALIDAÇÃO DO NIF (suporta 9 ou 14 dígitos) ────────
  validateNif(): boolean {
    this.nifErrors = [];
    const nif = this.formData.nif;

    if (!nif || nif.trim() === '') {
      this.nifErrors.push('NIF é obrigatório');
      return false;
    }

    // Remove espaços e caracteres especiais
    const cleanNif = nif.replace(/[\s.-]/g, '');

    // Verifica se tem 10 ou 14 dígitos
    if (![10, 14].includes(cleanNif.length)) {
      this.nifErrors.push('O NIF deve ter 10 dígitos (pessoa coletiva) ou 14 dígitos (pessoa singular)');
    }

    // Verifica se contém apenas números
    if (!/^\d+$/.test(cleanNif)) {
      this.nifErrors.push('O NIF deve conter apenas números');
    }

    // Atualiza o campo com o valor limpo (sem espaços)
    if (cleanNif !== nif) {
      this.formData.nif = cleanNif;
    }

    return this.nifErrors.length === 0;
  }

  // ─── FORMATAR NIF ENQUANTO DIGITA ──────────────────────
  onNifInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    // Permite 9 ou 14 dígitos, mas limita a 14
    if (value.length > 14) {
      value = value.slice(0, 14);
    }
    
    this.formData.nif = value;
    this.nifErrors = [];
  }

  // ─── DETECTAR TIPO DE NIF PARA EXIBIÇÃO ────────────────
  getNifTypeHint(): string {
    const cleanNif = this.formData.nif.replace(/\D/g, '');
    if (cleanNif.length === 14) {
      return '🔵 NIF de pessoa singular (14 dígitos)';
    } else if (cleanNif.length === 10) {
      return '🟢 NIF de pessoa coletiva (10 dígitos)';
    } else if (cleanNif.length > 0) {
      return `⚠️ NIF inválido (${cleanNif.length} dígitos)`;
    }
    return 'Digite 10 ou 14 dígitos';
  }

  // ─── VALIDAÇÃO DO IBAN ──────────────────────────────────
  validateIban(iban: string): boolean {
    if (!iban) return true;
    
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    
    if (!cleanIban.startsWith('AO')) {
      return false;
    }
    
    if (cleanIban.length !== 25) {
      return false;
    }
    
    return /^AO\d{23}$/.test(cleanIban);
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.validateNif()) {
        return;
      }
    }
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addBankAccount(): void {
    this.formData.bank_accounts.push({
      bank: '',
      iban: '',
      account_holder: '',
      is_default: false
    });
  }

  removeBankAccount(index: number): void {
    if (this.formData.bank_accounts.length > 1) {
      this.formData.bank_accounts.splice(index, 1);
      if (this.formData.bank_accounts.length > 0) {
        this.formData.bank_accounts[0].is_default = true;
      }
    }
  }

  setDefaultAccount(index: number): void {
    this.formData.bank_accounts.forEach((acc, i) => {
      acc.is_default = i === index;
    });
  }

  onSubmit(): void {
    if (!this.validateNif()) {
      this.currentStep = 1;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const cleanNif = this.formData.nif.replace(/\D/g, '');

    const payload: EntityFormData = {
      entity_type: this.formData.entity_type,
      name: this.formData.name.trim(),
      legal_name: this.formData.legal_name?.trim() || undefined,
      nif: cleanNif, // Envia apenas os números
      email: this.formData.email?.trim() || undefined,
      phone: this.formData.phone?.trim() || undefined,
      phone_alt: this.formData.phone_alt?.trim() || undefined,
      website: this.formData.website?.trim() || undefined,
      address: this.formData.address?.trim() || undefined,
      city: this.formData.city?.trim() || undefined,
      province: this.formData.province || undefined,
      postal_code: this.formData.postal_code?.trim() || undefined,
      agt_certificate_expiry: this.formData.agt_certificate_expiry || null,
      inss_certificate_expiry: this.formData.inss_certificate_expiry || null,
      tax_regime: this.formData.tax_regime,
      is_tax_exempt: this.formData.is_tax_exempt,
      activity_code: this.formData.activity_code?.trim() || null,
      notes: this.formData.notes?.trim() || undefined,
      bank_accounts: this.formData.bank_accounts
        .filter(acc => acc.bank && acc.iban)
        .map(acc => ({
          ...acc,
          iban: acc.iban.replace(/\s/g, '').toUpperCase()
        }))
    };

    if (this.isEdit) {
      payload.status = this.formData.status as 'active' | 'suspended' | 'blacklisted';
    }

    const operation = this.isEdit && this.entity
      ? this.entityService.update(this.entity.id, payload)
      : this.entityService.create(payload);

    operation.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.saved.emit(response.data);
        this.close.emit();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erro detalhado:', err);
        
        if (err.error?.errors) {
          const errorMessages = Object.values(err.error.errors).flat();
          this.errorMessage = errorMessages.join(' ');
        } else {
          this.errorMessage = err.error?.message || 'Erro ao guardar entidade';
        }
      }
    });
  }
}
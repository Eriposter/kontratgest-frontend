import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, Company } from '../../../core/services/settings.service';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-profile.html',
  styleUrls: ['./company-profile.scss']
})
export class CompanyProfileComponent implements OnInit {
  private settingsService = inject(SettingsService);

  company: Company | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  provinces = [
    { value: 'benguela', label: 'Benguela' },
    { value: 'bengo', label: 'Bengo' },
    { value: 'bie', label: 'Bié' },
    { value: 'cabinda', label: 'Cabinda' },
    { value: 'cuando_cubango', label: 'Cuando Cubango' },
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
    { value: 'namibe', label: 'Namibe' },
    { value: 'uige', label: 'Uíge' },
    { value: 'zaire', label: 'Zaire' }
  ];

  companyTypes = [
    { value: 'private', label: 'Empresa Privada' },
    { value: 'public', label: 'Empresa Pública' },
    { value: 'mixed', label: 'Empresa Mista' }
  ];

  sectors = [
    { value: 'water', label: 'Água e Saneamento' },
    { value: 'energy', label: 'Energia' },
    { value: 'construction', label: 'Construção' },
    { value: 'services', label: 'Serviços' },
    { value: 'commerce', label: 'Comércio' },
    { value: 'industry', label: 'Indústria' },
    { value: 'agriculture', label: 'Agricultura' },
    { value: 'transport', label: 'Transportes' },
    { value: 'telecom', label: 'Telecomunicações' },
    { value: 'other', label: 'Outro' }
  ];

  ngOnInit(): void {
    this.loadCompany();
  }

  loadCompany(): void {
    this.loading = true;
    this.settingsService.getCompany().subscribe({
      next: (response) => {
        this.company = response.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Erro ao carregar dados da empresa';
      }
    });
  }

  save(): void {
    if (!this.company) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.settingsService.updateCompany({
      name: this.company.name,
      legal_name: this.company.legal_name,
      email: this.company.email,
      phone: this.company.phone,
      address: this.company.address,
      city: this.company.city,
      province: this.company.province,
      settings: this.company.settings
    }).subscribe({
      next: (response) => {
        this.company = response.data;
        this.saving = false;
        this.successMessage = 'Dados atualizados com sucesso!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Erro ao guardar';
      }
    });
  }

  getCompanyTypeLabel(): string {
    const type = this.companyTypes.find(t => t.value === this.company?.company_type);
    return type?.label || '';
  }
}
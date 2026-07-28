import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService, Company } from '../../../core/services/settings.service';

interface Feature {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'public' | 'private' | 'common';
}

@Component({
  selector: 'app-features-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features-settings.html',
  styleUrls: ['./features-settings.scss']
})
export class FeaturesSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  company: Company | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  allFeatures: Feature[] = [
    {
      code: 'public_procedures',
      name: 'Procedimentos Públicos',
      description: 'Concursos públicos, limitados, contratação direta',
      icon: '📋',
      category: 'public'
    },
    {
      code: 'tribunal_contas',
      name: 'Tribunal de Contas',
      description: 'Workflow de visto do Tribunal de Contas',
      icon: '⚖️',
      category: 'public'
    },
    {
      code: 'ura',
      name: 'URAs',
      description: 'Unidades de Realização de Contratos',
      icon: '👥',
      category: 'public'
    },
    {
      code: 'fiscalizacao',
      name: 'Fiscalização',
      description: 'Gestão de entidades fiscalizadoras',
      icon: '🔍',
      category: 'public'
    },
    {
      code: 'publications',
      name: 'Publicações Oficiais',
      description: 'Registo de publicações em Diário da República',
      icon: '📰',
      category: 'public'
    },
    {
      code: 'internal_workflow',
      name: 'Workflow Interno',
      description: 'Aprovações hierárquicas personalizadas',
      icon: '🔄',
      category: 'private'
    },
    {
      code: 'budget_control',
      name: 'Controlo Orçamental',
      description: 'Gestão de budgets por centro de custo',
      icon: '💰',
      category: 'private'
    },
    {
      code: 'client_contracts',
      name: 'Contratos com Clientes',
      description: 'Gestão de contratos onde a empresa é fornecedora',
      icon: '🤝',
      category: 'private'
    }
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
        this.errorMessage = 'Erro ao carregar dados';
      }
    });
  }

  isFeatureEnabled(code: string): boolean {
    return this.company?.enabled_features?.includes(code) || false;
  }

  toggleFeature(code: string): void {
    if (!this.company) return;

    const features = [...(this.company.enabled_features || [])];
    const index = features.indexOf(code);

    if (index >= 0) {
      features.splice(index, 1);
    } else {
      features.push(code);
    }

    this.saveFeatures(features);
  }

  private saveFeatures(features: string[]): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.settingsService.updateCompanyFeatures(features).subscribe({
      next: (response) => {
        this.company = response.data;
        this.saving = false;
        this.successMessage = 'Funcionalidades atualizadas com sucesso!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Erro ao guardar';
      }
    });
  }

  getFeaturesByCategory(category: string): Feature[] {
    return this.allFeatures.filter(f => f.category === category);
  }

  getActiveCount(): number {
    return this.company?.enabled_features?.length || 0;
  }
}
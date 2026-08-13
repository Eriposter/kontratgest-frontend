import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, TaxConfiguration } from '../../../core/services/settings.service';

@Component({
  selector: 'app-fiscal-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fiscal-settings.html',
  styleUrls: ['./fiscal-settings.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiscalSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  configurations: TaxConfiguration[] = [];
  loading = true;
  saving: { [key: string]: boolean } = {};
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadConfigurations();
  }

  loadConfigurations(): void {
    this.loading = true;
    this.settingsService.getTaxConfigurations().subscribe({
      next: (response) => {
        this.configurations = response.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Erro ao carregar configurações fiscais';
      }
    });
  }

  saveConfiguration(config: TaxConfiguration): void {
    this.saving[config.id] = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.settingsService.updateTaxConfiguration(config.id, {
      rate: config.rate,
      is_active: config.is_active
    }).subscribe({
      next: (response) => {
        const index = this.configurations.findIndex(c => c.id === config.id);
        if (index >= 0) {
          this.configurations[index] = response.data;
        }
        this.saving[config.id] = false;
        this.successMessage = `${config.name} atualizado com sucesso!`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.saving[config.id] = false;
        this.errorMessage = err.error?.message || 'Erro ao guardar';
      }
    });
  }

  getIconForCode(code: string): string {
    const icons: { [key: string]: string } = {
      'IVA_14': '🧾',
      'IVA_6': '🧾',
      'IIT_2': '💼',
      'IIT_6_5': '💼',
      'IIT_10': '💼',
      'IMPOSTO_SELO_1': '📜',
      'IMPOSTO_SELO_2': '📜'
    };
    return icons[code] || '💰';
  }

  getCategoryLabel(code: string): string {
    if (code.startsWith('IVA')) return 'IVA';
    if (code.startsWith('IIT')) return 'Imposto Industrial (Retenção)';
    if (code.startsWith('IMPOSTO_SELO')) return 'Imposto de Selo';
    return 'Outro';
  }

  getConfigurationsByCategory(): { [key: string]: TaxConfiguration[] } {
    const categories: { [key: string]: TaxConfiguration[] } = {
      'IVA': [],
      'Imposto Industrial (Retenção)': [],
      'Imposto de Selo': []
    };

    this.configurations.forEach(config => {
      const category = this.getCategoryLabel(config.code);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(config);
    });

    return categories;
  }
}
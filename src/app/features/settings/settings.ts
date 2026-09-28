import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyProfileComponent } from './company-profile/company-profile';
import { FeaturesSettingsComponent } from './features-settings/features-settings';
import { FiscalSettingsComponent } from './fiscal-settings/fiscal-settings';
import { UsersSettingsComponent } from './users-settings/users-settings';
import { RolesSettingsComponent } from './roles-settings/roles-settings';

interface SettingsSection {
  id: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    CompanyProfileComponent,
    FeaturesSettingsComponent,
    FiscalSettingsComponent,
    UsersSettingsComponent,
    RolesSettingsComponent
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss'],
   
})
export class SettingsComponent implements OnInit {
  activeSection = 'company';

  sections: SettingsSection[] = [
    {
      id: 'company',
      label: 'Perfil da Empresa',
      icon: 'building',
      description: 'Dados da organização'
    },
    {
      id: 'features',
      label: 'Funcionalidades',
      icon: 'puzzle',
      description: 'Ativar módulos do sistema'
    },
    {
      id: 'fiscal',
      label: 'Configurações Fiscais',
      icon: 'calculator',
      description: 'IVA, retenções e impostos'
    },
    {
      id: 'users',
      label: 'Utilizadores',
      icon: 'users',
      description: 'Gestão de acessos'
    },
    {
      id: 'roles',
      label: 'Roles e Permissões',
      icon: 'shield',
      description: 'Controlo de permissões'
    }
  ];

  ngOnInit(): void {
    // Carregar secção a partir do URL se existir
    const hash = window.location.hash.replace('#', '');
    if (hash && this.sections.find(s => s.id === hash)) {
      this.activeSection = hash;
    }
  }

  setActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
    window.location.hash = sectionId;
  }

  getIconPath(icon: string): string {
    const paths: { [key: string]: string } = {
      building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      puzzle: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
      calculator: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    };
    return paths[icon] || '';
  }
}
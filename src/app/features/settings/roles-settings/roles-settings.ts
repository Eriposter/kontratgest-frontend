import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, Role } from '../../../core/services/settings.service';

interface PermissionGroup {
  name: string;
  label: string;
  permissions: { id: string; name: string }[];
}

@Component({
  selector: 'app-roles-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-settings.html',
  styleUrls: ['./roles-settings.scss'],
   
})
export class RolesSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  roles: Role[] = [];
  allPermissions: { id: string; name: string; group: string }[] = [];
  permissionGroups: PermissionGroup[] = [];
  
  loading = true;
  errorMessage = '';
  successMessage = '';

  showFormModal = false;
  editingRole: Role | null = null;

  formData = {
    name: '',
    permissions: [] as string[]
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Carregar roles e permissões em paralelo
    Promise.all([
      this.settingsService.getRoles().toPromise(),
      // Nota: Precisamos de um endpoint para listar todas as permissões disponíveis
      // Por agora, vamos extrair das roles existentes ou assumir que o backend devolve
      this.settingsService.getRoles().toPromise() // Placeholder, vamos ajustar
    ]).then(([rolesRes]) => {
      if (rolesRes) {
        this.roles = rolesRes.data;
        this.extractPermissionGroups();
      }
      this.loading = false;
    }).catch(() => {
      this.loading = false;
      this.errorMessage = 'Erro ao carregar dados';
    });
  }

  extractPermissionGroups(): void {
    // Agrupar permissões baseadas no nome (ex: "entities.view" -> group: "entities")
    const groupsMap = new Map<string, { id: string; name: string }[]>();
    
    this.roles.forEach(role => {
      role.permissions.forEach(perm => {
        const groupName = perm.name.split('.')[0];
        if (!groupsMap.has(groupName)) {
          groupsMap.set(groupName, []);
        }
        // Evitar duplicados
        if (!groupsMap.get(groupName)?.some(p => p.name === perm.name)) {
          groupsMap.get(groupName)?.push(perm);
        }
      });
    });

    this.permissionGroups = Array.from(groupsMap.entries()).map(([name, permissions]) => ({
      name,
      label: this.formatGroupName(name),
      permissions: permissions.sort((a, b) => a.name.localeCompare(b.name))
    }));
  }

  formatGroupName(name: string): string {
    const labels: { [key: string]: string } = {
      'entities': 'Entidades',
      'contracts': 'Contratos',
      'measurements': 'Autos de Medição',
      'payments': 'Pagamentos',
      'guarantees': 'Cauções',
      'users': 'Utilizadores',
      'roles': 'Roles e Permissões',
      'tax': 'Configurações Fiscais',
      'settings': 'Definições do Sistema'
    };
    return labels[name] || name.charAt(0).toUpperCase() + name.slice(1);
  }

  openCreateModal(): void {
    this.editingRole = null;
    this.formData = { name: '', permissions: [] };
    this.showFormModal = true;
  }

  openEditModal(role: Role): void {
    this.editingRole = role;
    this.formData = {
      name: role.name,
      permissions: role.permissions.map(p => p.name)
    };
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingRole = null;
  }

  togglePermission(permName: string): void {
    const index = this.formData.permissions.indexOf(permName);
    if (index >= 0) {
      this.formData.permissions.splice(index, 1);
    } else {
      this.formData.permissions.push(permName);
    }
  }

  isPermissionSelected(permName: string): boolean {
    return this.formData.permissions.includes(permName);
  }

  selectAllInGroup(groupName: string): void {
    const group = this.permissionGroups.find(g => g.name === groupName);
    if (group) {
      const allSelected = group.permissions.every(p => this.isPermissionSelected(p.name));
      if (allSelected) {
        group.permissions.forEach(p => {
          const idx = this.formData.permissions.indexOf(p.name);
          if (idx >= 0) this.formData.permissions.splice(idx, 1);
        });
      } else {
        group.permissions.forEach(p => {
          if (!this.isPermissionSelected(p.name)) {
            this.formData.permissions.push(p.name);
          }
        });
      }
    }
  }

  saveRole(): void {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'O nome da role é obrigatório';
      return;
    }

    const payload = {
      name: this.formData.name,
      permissions: this.formData.permissions
    };

    const operation = this.editingRole
      ? this.settingsService.updateRole(this.editingRole.id, payload)
      : this.settingsService.createRole(payload);

    operation.subscribe({
      next: () => {
        this.loadData();
        this.closeFormModal();
        this.successMessage = this.editingRole ? 'Role atualizada com sucesso!' : 'Role criada com sucesso!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erro ao guardar role';
      }
    });
  }

  deleteRole(role: Role): void {
    if (role.name === 'super-admin') {
      this.errorMessage = 'A role super-admin não pode ser eliminada.';
      return;
    }
    if (!confirm(`Tem a certeza que deseja eliminar a role "${role.name}"?`)) return;

    this.settingsService.deleteRole(role.id).subscribe({
      next: () => {
        this.loadData();
        this.successMessage = 'Role eliminada com sucesso!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erro ao eliminar role';
      }
    });
  }
}
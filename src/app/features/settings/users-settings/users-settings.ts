import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, User } from '../../../core/services/settings.service';
import { UserFormComponent } from './user-form/user-form';

@Component({
  selector: 'app-users-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, UserFormComponent],
  templateUrl: './users-settings.html',
  styleUrls: ['./users-settings.scss'],
   
})
export class UsersSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  users: User[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';

  // Modais
  showFormModal = false;
  editingUser: User | null = null;

  // Métricas
  metrics = {
    total: 0,
    active: 0,
    inactive: 0
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.settingsService.getUsers().subscribe({
      next: (response) => {
        this.users = response.data;
        this.calculateMetrics();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Erro ao carregar utilizadores';
      }
    });
  }

  calculateMetrics(): void {
    this.metrics.total = this.users.length;
    this.metrics.active = this.users.filter(u => u.is_active).length;
    this.metrics.inactive = this.users.filter(u => !u.is_active).length;
  }

  get filteredUsers(): User[] {
    if (!this.searchQuery) return this.users;
    const query = this.searchQuery.toLowerCase();
    return this.users.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.department?.toLowerCase().includes(query)
    );
  }

  openCreateModal(): void {
    this.editingUser = null;
    this.showFormModal = true;
  }

  editUser(user: User): void {
    this.editingUser = user;
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingUser = null;
  }

  onUserSaved(): void {
    this.loadUsers();
    this.closeFormModal();
  }

  toggleStatus(user: User): void {
    const action = user.is_active ? 'desativar' : 'ativar';
    if (!confirm(`Tem a certeza que deseja ${action} o utilizador ${user.name}?`)) return;

    this.settingsService.toggleUserStatus(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.successMessage = `Utilizador ${action}do com sucesso!`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erro ao alterar estado';
      }
    });
  }

  getRoleBadgeClass(roleName: string): string {
    const classes: { [key: string]: string } = {
      'super-admin': 'role--super-admin',
      'admin': 'role--admin',
      'manager': 'role--manager',
      'viewer': 'role--viewer',
      'operator': 'role--operator'
    };
    return classes[roleName] || 'role--default';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getGradientClass(name: string): string {
    const gradients = [
      'gradient--indigo',
      'gradient--pink',
      'gradient--emerald',
      'gradient--amber',
      'gradient--cyan',
      'gradient--purple'
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  }
}
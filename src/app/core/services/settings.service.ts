import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Company {
  id: string;
  name: string;
  legal_name: string;
  nif: string;
  logo_path: string | null;
  company_type: string;
  sector: string;
  legal_nature: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  settings: {
    default_currency: string;
    fiscal_year_start: string;
    requires_tribunal_visto_above: number;
    approval_thresholds: {
      director: number;
      council: number;
      minister: number;
    };
  };
  enabled_features: string[];
  is_active: boolean;
}

export interface TaxConfiguration {
  id: string;
  code: string;
  name: string;
  description: string;
  rate: number;
  is_active: boolean;
  applies_to: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  is_active: boolean;
  roles: { id: string; name: string }[];
  last_login_at: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  guard_name: string;
  permissions: { id: string; name: string }[];
  users_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService extends ApiService {
  
  // ==================== USERS ====================
  getUsers(): Observable<{ data: User[] }> {
    return this.get<{ data: User[] }>('settings/users');
  }

  createUser(data: any): Observable<{ data: User }> {
    console.log('📤 SettingsService.createUser - Dados:', data);
    return this.post<{ data: User }>('settings/users', data);
  }

  updateUser(id: string, data: any): Observable<{ data: User }> {
    console.log(`📤 SettingsService.updateUser - ID: ${id}, Dados:`, data);
    return this.put<{ data: User }>(`settings/users/${id}`, data);
  }

  /**
   * CORRIGIDO: Usa o endpoint correto do UserController
   * Ao invés de 'toggle-status', usa 'activate' e 'deactivate'
   */
  toggleUserStatus(id: string): Observable<{ data: User }> {
    // Primeiro buscamos o status atual para decidir qual endpoint chamar
    return new Observable<{ data: User }>((observer) => {
      // Buscar o usuário primeiro para saber o status
      this.get<{ data: User }>(`settings/users/${id}`).subscribe({
        next: (userResponse) => {
          const isActive = userResponse.data.is_active;
          const endpoint = isActive 
            ? `users/${id}/deactivate` 
            : `users/${id}/activate`;
          
          console.log(`🔄 Toggle status: ${isActive ? 'Desativando' : 'Ativando'} usuário ${id}`);
          console.log(`📡 Endpoint: ${endpoint}`);
          
          this.post<{ data: User }>(endpoint, {}).subscribe({
            next: (response) => {
              console.log('✅ Status alterado com sucesso:', response);
              observer.next(response);
              observer.complete();
            },
            error: (err) => {
              console.error('❌ Erro ao alterar status:', err);
              observer.error(err);
            }
          });
        },
        error: (err) => {
          console.error('❌ Erro ao buscar usuário:', err);
          observer.error(err);
        }
      });
    });
  }

  // Método simplificado - se o backend tiver toggle-status
  toggleUserStatusV2(id: string): Observable<{ data: User }> {
    console.log(`🔄 Toggle status do usuário ${id} (via settings/users/${id}/toggle-status)`);
    return this.post<{ data: User }>(`settings/users/${id}/toggle-status`, {});
  }

  // ==================== ROLES ====================
  /**
   * CORRIGIDO: Usa o endpoint correto /api/v1/roles
   * Não /settings/roles
   */
  getRoles(): Observable<{ data: Role[] }> {
    console.log('📤 Buscando roles do endpoint: roles');
    return this.get<{ data: Role[] }>('roles');
  }

  createRole(data: { name: string; permissions: string[] }): Observable<{ data: Role }> {
    console.log('📤 Criando role:', data);
    return this.post<{ data: Role }>('roles', data);
  }

  updateRole(id: string, data: { name?: string; permissions?: string[] }): Observable<{ data: Role }> {
    console.log(`📤 Atualizando role ${id}:`, data);
    return this.put<{ data: Role }>(`roles/${id}`, data);
  }

  deleteRole(id: string): Observable<void> {
    console.log(`📤 Deletando role ${id}`);
    return this.delete<void>(`roles/${id}`);
  }

  // ==================== COMPANY ====================
  getCompany(): Observable<{ data: Company }> {
    return this.get<{ data: Company }>('settings/company');
  }

  updateCompany(data: Partial<Company>): Observable<{ data: Company }> {
    return this.put<{ data: Company }>('settings/company', data);
  }

  updateCompanyFeatures(features: string[]): Observable<{ data: Company }> {
    return this.put<{ data: Company }>('settings/company/features', { features });
  }

  // ==================== TAX ====================
  getTaxConfigurations(): Observable<{ data: TaxConfiguration[] }> {
    return this.get<{ data: TaxConfiguration[] }>('settings/tax-configurations');
  }

  updateTaxConfiguration(id: string, data: Partial<TaxConfiguration>): Observable<{ data: TaxConfiguration }> {
    return this.put<{ data: TaxConfiguration }>(`settings/tax-configurations/${id}`, data);
  }
}
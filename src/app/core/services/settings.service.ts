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
  // Company
  getCompany(): Observable<{ data: Company }> {
    return this.get<{ data: Company }>('settings/company');
  }

  updateCompany(data: Partial<Company>): Observable<{ data: Company }> {
    return this.put<{ data: Company }>('settings/company', data);
  }

  updateCompanyFeatures(features: string[]): Observable<{ data: Company }> {
    return this.put<{ data: Company }>('settings/company/features', { features });
  }

  // Tax Configurations
  getTaxConfigurations(): Observable<{ data: TaxConfiguration[] }> {
    return this.get<{ data: TaxConfiguration[] }>('settings/tax-configurations');
  }

  updateTaxConfiguration(id: string, data: Partial<TaxConfiguration>): Observable<{ data: TaxConfiguration }> {
    return this.put<{ data: TaxConfiguration }>(`settings/tax-configurations/${id}`, data);
  }

  // Users
  getUsers(): Observable<{ data: User[] }> {
    return this.get<{ data: User[] }>('settings/users');
  }

  createUser(data: any): Observable<{ data: User }> {
    return this.post<{ data: User }>('settings/users', data);
  }

  updateUser(id: string, data: any): Observable<{ data: User }> {
    return this.put<{ data: User }>(`settings/users/${id}`, data);
  }

  toggleUserStatus(id: string): Observable<{ data: User }> {
    return this.post<{ data: User }>(`settings/users/${id}/toggle-status`, {});
  }

  // Roles
  getRoles(): Observable<{ data: Role[] }> {
    return this.get<{ data: Role[] }>('settings/roles');
  }

  createRole(data: { name: string; permissions: string[] }): Observable<{ data: Role }> {
    return this.post<{ data: Role }>('settings/roles', data);
  }

  updateRole(id: string, data: { name?: string; permissions?: string[] }): Observable<{ data: Role }> {
    return this.put<{ data: Role }>(`settings/roles/${id}`, data);
  }

  deleteRole(id: string): Observable<void> {
    return this.delete<void>(`settings/roles/${id}`);
  }
}
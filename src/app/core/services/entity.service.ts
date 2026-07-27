import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Entity {
  id: string;
  type: string;
  type_label: string;
  identification: {
    name: string;
    legal_name: string;
    nif: string;
    nif_type: string;
    activity_code: string;
  };
  contact: {
    email: string;
    phone: string;
    phone_alt: string;
    website: string;
  };
  address: {
    street: string;
    city: string;
    province: string;
    province_label: string;
    postal_code: string;
  };
  banking?: {
    accounts: BankAccount[];
    default_account: BankAccount | null;
  };
  compliance: {
    is_compliant: boolean;
    tax_exempt?: boolean;
    tax_regime?: string;
    certificates: {
      agt: { expiry: string; is_valid: boolean; days_until_expiry: number };
      inss: { expiry: string; is_valid: boolean; days_until_expiry: number };
    };
  };
  notes?: string;
  status: 'active' | 'suspended' | 'blacklisted';
  created_at: string;
  updated_at?: string;
}

export interface BankAccount {
  bank: string;
  iban: string;
  account_holder: string;
  is_default: boolean;
}

export interface EntityListResponse {
  data: Entity[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface EntitySingleResponse {
  data: Entity;
}

export interface ComplianceAlertsResponse {
  data: Entity[];
  meta: {
    total: number;
    alert_days: number;
  };
}

// DTO para criar/atualizar entidade
export interface EntityFormData {
  entity_type: string;
  name: string;
  legal_name?: string;
  nif: string;
  email?: string;
  phone?: string;
  phone_alt?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  bank_accounts?: BankAccount[];
  agt_certificate_expiry?: string | null;
  inss_certificate_expiry?: string | null;
  is_tax_exempt?: boolean;
  tax_regime?: string;
  activity_code?: string | null;
  notes?: string;
  status?: 'active' | 'suspended' | 'blacklisted';
}

@Injectable({
  providedIn: 'root'
})
export class EntityService extends ApiService {
  
  /**
   * Lista paginada de entidades com filtros
   */
  list(params?: { 
    type?: string; 
    status?: string; 
    search?: string; 
    per_page?: number;
    page?: number;
  }): Observable<EntityListResponse> {
    return this.get('entities', params);
  }

  /**
   * Obtém uma entidade específica
   */
  getEntity(id: string): Observable<EntitySingleResponse> {
    return this.get(`entities/${id}`);
  }

  /**
   * Cria uma nova entidade
   */
  create(data: EntityFormData): Observable<EntitySingleResponse> {
    return this.post('entities', data);
  }

  /**
   * Atualiza uma entidade existente
   */
  update(id: string, data: EntityFormData): Observable<EntitySingleResponse> {
    return this.put(`entities/${id}`, data);
  }

  /**
   * Remove uma entidade (soft delete)
   */
  deleteEntity(id: string): Observable<void> {
    return this.delete(`entities/${id}`);
  }

  /**
   * Suspende uma entidade
   * @param id - ID da entidade
   * @param reason - Motivo da suspensão
   */
  suspend(id: string, reason?: string): Observable<EntitySingleResponse> {
    return this.post(`entities/${id}/suspend`, { reason: reason || '' });
  }

  /**
   * Reativa uma entidade suspensa
   * @param id - ID da entidade
   */
  reactivate(id: string): Observable<EntitySingleResponse> {
    return this.post(`entities/${id}/reactivate`, {});
  }

  /**
   * Obtém alertas de compliance (certidões a expirar)
   * @param days - Dias para considerar alerta
   */
  getComplianceAlerts(days: number = 30): Observable<ComplianceAlertsResponse> {
    return this.get('entities/compliance/alerts', { days });
  }

  /**
   * Busca entidades por termo de pesquisa
   * @param search - Termo de busca (nome, NIF, email)
   */
  search(search: string): Observable<EntityListResponse> {
    return this.get('entities', { search });
  }

  /**
   * Obtém entidades por tipo
   * @param type - Tipo da entidade
   */
  getByType(type: string): Observable<EntityListResponse> {
    return this.get('entities', { type });
  }

  /**
   * Obtém entidades por status
   * @param status - Status da entidade
   */
  getByStatus(status: 'active' | 'suspended' | 'blacklisted'): Observable<EntityListResponse> {
    return this.get('entities', { status });
  }

  /**
   * Verifica se uma entidade está em compliance
   * @param entity - Entidade para verificar
   */
  isCompliant(entity: Entity): boolean {
    if (!entity.compliance) return false;
    
    const agt = entity.compliance.certificates?.agt;
    const inss = entity.compliance.certificates?.inss;
    
    if (!agt || !inss) return false;
    
    return agt.is_valid && inss.is_valid;
  }

  /**
   * Obtém o status de compliance formatado
   */
  getComplianceStatus(entity: Entity): { label: string; class: string } {
    if (!entity.compliance) {
      return { label: 'Sem dados', class: 'compliance--unknown' };
    }

    const agt = entity.compliance.certificates?.agt;
    const inss = entity.compliance.certificates?.inss;

    // Se não tem certidões registradas
    if (!agt || !inss || (!agt.expiry && !inss.expiry)) {
      return { label: 'Sem dados', class: 'compliance--unknown' };
    }

    // Verifica se alguma está expirada
    if (!agt.is_valid || !inss.is_valid) {
      return { label: 'Expirada', class: 'compliance--expired' };
    }

    // Verifica se alguma está perto de expirar (30 dias)
    if ((agt.days_until_expiry !== null && agt.days_until_expiry <= 30) || 
        (inss.days_until_expiry !== null && inss.days_until_expiry <= 30)) {
      return { label: 'A expirar', class: 'compliance--warning' };
    }

    return { label: 'Conforme', class: 'compliance--ok' };
  }

  static validateNif(nif: string): { valid: boolean; errors: string[]; type?: 'individual' | 'collective' } {
  const errors: string[] = [];
  
  if (!nif || nif.trim() === '') {
    errors.push('NIF é obrigatório');
    return { valid: false, errors };
  }

  const cleanNif = nif.replace(/\D/g, '');

  // Verifica se tem 9 ou 14 dígitos
  if (![9, 14].includes(cleanNif.length)) {
    errors.push('O NIF deve ter 9 dígitos (pessoa coletiva) ou 14 dígitos (pessoa singular)');
  }

  if (!/^\d+$/.test(cleanNif)) {
    errors.push('O NIF deve conter apenas números');
  }

  // Detecta o tipo
  let type: 'individual' | 'collective' | undefined;
  if (cleanNif.length === 14) {
    type = 'individual';
  } else if (cleanNif.length === 9) {
    type = 'collective';
  }

  return {
    valid: errors.length === 0,
    errors,
    type
  };
}

/**
 * Formata o NIF para exibição (ex: 123456789 ou 12345678901234)
 */
static formatNif(nif: string): string {
  return nif.replace(/\D/g, '');
}
}
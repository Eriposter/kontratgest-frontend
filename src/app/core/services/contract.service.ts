import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Contract {
  internal_notes: string;
  tribunal_de_contas_visto: boolean;
  bna_registration_number: string;
object: any;
compliance: any;
  id: string;
  contract_number: string;
  type: { id: string; code: string; name: string };
  counterparty: { id: string; name: string; nif: string };
  title: string;
  description: string;
  financial: {
    currency: string;
    currency_symbol: string;
    total_amount: number;
    vat_rate: number;
    vat_amount: number;
    withholding_tax_rate: number;
    withholding_tax_amount: number;
    net_amount: number;
    exchange_rate: number;
  };
  dates: {
    start: string;
    end: string;
    signature: string;
    duration_months: number;
    days_until_expiry: number;
    is_expired: boolean;
  };
  payment: {
    model: string;
    model_label: string;
    total_paid: number;
    balance: number;
    schedules: any[];
  };
  status: string;
  status_label: string;
  created_at: string;
}

export interface ContractListResponse {
  data: Contract[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ContractSingleResponse {
  data: Contract;
}

export interface ContractProgress {
  current: {
    current_progress: number;
    time_based_progress: number;
    payment_based_progress: number;
    last_update: {
      percentage: number;
      type: string;
      notes: string;
      updated_at: string;
      updated_by: string;
    } | null;
  };
  history: ProgressUpdate[];
}

export interface ProgressUpdate {
  id: string;
  percentage: number;
  type: string;
  notes: string;
  evidence: string[];
  updated_at: string;
  updated_by: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService extends ApiService {
  list(params?: { type?: string; status?: string; search?: string; per_page?: number }): Observable<ContractListResponse> {
    return this.get('contracts', params);
  }

  getContract(id: string): Observable<ContractSingleResponse> {
    return this.get(`contracts/${id}`);
  }

  create(data: any): Observable<ContractSingleResponse> {
    return this.post('contracts', data);
  }

  update(id: string, data: any): Observable<ContractSingleResponse> {
    return this.put(`contracts/${id}`, data);
  }

  deleteContract(id: string): Observable<void> {
    return this.delete(`contracts/${id}`);
  }

  getExpiring(days: number = 30): Observable<{ data: Contract[]; meta: any }> {
    return this.get('contracts/expiring', { days });
  }

  getOverdue(): Observable<{ data: Contract[]; meta: any }> {
    return this.get('contracts/overdue');
  }

  // Adiciona estes métodos à classe ContractService

submitForApproval(id: string): Observable<{ data: Contract }> {
  return this.post<{ data: Contract }>(`contracts/${id}/submit`, {});
}

approve(id: string): Observable<{ data: Contract }> {
  return this.post<{ data: Contract }>(`contracts/${id}/approve`, {});
}

activate(id: string): Observable<{ data: Contract }> {
  return this.post<{ data: Contract }>(`contracts/${id}/activate`, {});
}

suspend(id: string, reason: string = ''): Observable<{ data: Contract }> {
  return this.post<{ data: Contract }>(`contracts/${id}/suspend`, { reason });
}

terminate(id: string, reason: string): Observable<{ data: Contract }> {
  return this.post<{ data: Contract }>(`contracts/${id}/terminate`, { reason });
}

getProgress(contractId: string): Observable<{ data: ContractProgress }> {
  return this.get<{ data: ContractProgress }>(`contracts/${contractId}/progress`);
}

updateProgress(contractId: string, data: { 
  progress_percentage: number; 
  notes?: string; 
  evidence?: string[] 
}): Observable<any> {
  return this.post(`contracts/${contractId}/progress`, data);
}

calculateProgress(contractId: string): Observable<any> {
  return this.post(`contracts/${contractId}/progress/calculate`, {});
}

createFromPAC(needId: string, data: any): Observable<{ data: Contract }> {
  return this.post<{ data: Contract }>(`pacs/needs/${needId}/generate-contract`, data);
}

// Em src/app/core/services/contract.service.ts
getContractTypes(): Observable<any> {
  return this.get<any>('contract-types'); // Ajusta o endpoint se for diferente no teu sistema
}
}
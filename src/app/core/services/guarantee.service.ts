import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Guarantee {
  id: string;
  guarantee_number: string;
  type: {
    code: string;
    label: string;
  };
  purpose: {
    code: string;
    label: string;
  };
  contract: {
    id: string;
    contract_number: string;
    title: string;
    counterparty: {
      id: string;
      name: string;
      nif: string;
    };
  };
  issuer: {
    name: string;
    nif: string;
    contact: string;
  };
  financial: {
    currency: string;
    currency_symbol: string;
    amount: number;
    exchange_rate: number;
    amount_in_aoa: number;
  };
  dates: {
    issue: string;
    expiry: string;
    validity_days: number;
    days_until_expiry: number;
    is_expired: boolean;
    is_expiring_soon: boolean;
  };
  status: string;
  status_label: string;
  release_conditions: string;
  release_date: string | null;
  release_notes: string | null;
  execution_date: string | null;
  execution_amount: number | null;
  execution_reason: string | null;
  can_release: boolean;
  can_execute: boolean;
  documents: any[];
  created_at: string;
  updated_at: string;
}

export interface GuaranteeListResponse {
  data: Guarantee[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GuaranteeService extends ApiService {
  list(params?: { contract_id?: string; status?: string; type?: string; purpose?: string; search?: string; per_page?: number }): Observable<GuaranteeListResponse> {
    return super.get<GuaranteeListResponse>('guarantees', params);
  }

  override get<T = { data: Guarantee }>(id: string, p0?: { days: number; }): Observable<T> {
      return super.get<T>(`guarantees/${id}`);
    }

  create(data: any): Observable<{ data: Guarantee }> {
    return this.post<{ data: Guarantee }>('guarantees', data);
  }

  update(id: string, data: any): Observable<{ data: Guarantee }> {
    return this.put<{ data: Guarantee }>(`guarantees/${id}`, data);
  }

   override delete<T = void>(id: string): Observable<T> {
    return super.delete<T>(`guarantees/${id}`);
  }

  release(id: string, notes: string = ''): Observable<{ data: Guarantee }> {
    return this.post<{ data: Guarantee }>(`guarantees/${id}/release`, { notes });
  }

  execute(id: string, amount: number, reason: string): Observable<{ data: Guarantee }> {
    return this.post<{ data: Guarantee }>(`guarantees/${id}/execute`, { amount, reason });
  }

  getExpiring(days: number = 30): Observable<{ data: Guarantee[]; meta: any }> {
    return this.get<{ data: Guarantee[]; meta: any }>('guarantees/expiring', { days });
  }

  getExpired(): Observable<{ data: Guarantee[]; meta: any }> {
    return this.get<{ data: Guarantee[]; meta: any }>('guarantees/expired');
  }
}
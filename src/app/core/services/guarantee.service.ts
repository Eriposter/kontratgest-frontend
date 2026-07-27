import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Guarantee {
  id: string;
  guarantee_number: string;
  type: { code: string; label: string };
  purpose: { code: string; label: string };
  contract: {
    id: string;
    number: string;
    counterparty: { id: string; name: string };
  };
  issuer: { name: string; nif: string; contact: string };
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
  can_release: boolean;
  can_execute: boolean;
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

export interface GuaranteeSingleResponse {
  data: Guarantee;
}

@Injectable({
  providedIn: 'root'
})
export class GuaranteeService extends ApiService {
  list(params?: { contract_id?: string; status?: string; type?: string; per_page?: number }): Observable<GuaranteeListResponse> {
    return this.get('guarantees', params);
  }

  getGuarantee(id: string): Observable<GuaranteeSingleResponse> {
    return this.get(`guarantees/${id}`);
  }

  getExpiring(days: number = 30): Observable<{ data: Guarantee[]; meta: any }> {
    return this.get('guarantees/expiring', { days });
  }

  release(id: string, notes: string = ''): Observable<GuaranteeSingleResponse> {
    return this.post(`guarantees/${id}/release`, { notes });
  }

  execute(id: string, amount: number, reason: string): Observable<GuaranteeSingleResponse> {
    return this.post(`guarantees/${id}/execute`, { amount, reason });
  }
}
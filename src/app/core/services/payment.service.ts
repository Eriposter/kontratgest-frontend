import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Payment {
  id: string;
  payment_number: string;
  payment_type: string;
  payment_type_label: string;
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
  financial: {
    currency: string;
    currency_symbol: string;
    gross_amount: number;
    vat: { rate: number; amount: number };
    withholding_tax: { rate: number; amount: number };
    stamp_duty: { rate: number; amount: number };
    retention_amount: number;
    total_tax: number;
    net_amount: number;
  };
  dates: {
    due: string | null;
    invoice: string | null;
    payment: string | null;
    days_until_due: number | null;
    is_overdue: boolean;
    days_overdue: number | null;
  };
  bank: {
    reference: string | null;
    method: string | null;
    method_label: string | null;
  };
  status: string;
  status_label: string;
  invoice: {
    number: string | null;
  };
  measurement: {
    id: string | null;
    number: string | null;
  } | null;
  can_be_approved: boolean;
  can_be_paid: boolean;
  can_be_rejected: boolean;
  can_be_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentListResponse {
  data: Payment[];
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
export class PaymentService extends ApiService {
  list(params?: { contract_id?: string; status?: string; type?: string; search?: string; per_page?: number }): Observable<PaymentListResponse> {
    return super.get<PaymentListResponse>('payments', params);
  }

  override get<T = { data: Payment }>(id: string): Observable<T> {
    return super.get<T>(`payments/${id}`);
  }

  create(data: any): Observable<{ data: Payment }> {
    return this.post<{ data: Payment }>('payments', data);
  }

  update(id: string, data: any): Observable<{ data: Payment }> {
    return this.put<{ data: Payment }>(`payments/${id}`, data);
  }

  override delete<T = void>(id: string): Observable<T> {
    return super.delete<T>(`payments/${id}`);
  }

  approve(id: string): Observable<{ data: Payment }> {
    return this.post<{ data: Payment }>(`payments/${id}/approve`, {});
  }

  reject(id: string, notes: string): Observable<{ data: Payment }> {
    return this.post<{ data: Payment }>(`payments/${id}/reject`, { notes });
  }

  markAsPaid(id: string, data: { bank_reference: string; payment_method: string; payment_date?: string }): Observable<{ data: Payment }> {
    return this.post<{ data: Payment }>(`payments/${id}/mark-as-paid`, data);
  }

  cancel(id: string, reason: string): Observable<{ data: Payment }> {
    return this.post<{ data: Payment }>(`payments/${id}/cancel`, { reason });
  }

  getOverdue(): Observable<{ data: Payment[]; meta: any }> {
    return this.get<{ data: Payment[]; meta: any }>('payments/overdue');
  }

  getPending(): Observable<{ data: Payment[]; meta: any }> {
    return this.get<{ data: Payment[]; meta: any }>('payments/pending');
  }

  getApproved(): Observable<{ data: Payment[]; meta: any }> {
    return this.get<{ data: Payment[]; meta: any }>('payments/approved');
  }
}
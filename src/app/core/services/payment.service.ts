import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Payment {
  id: string;
  payment_number: string;
  payment_type: string;
  contract: {
    id: string;
    number: string;
    counterparty: { id: string; name: string };
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
    due: string;
    invoice: string;
    payment: string;
    days_until_due: number;
    is_overdue: boolean;
  };
  bank: { reference: string; method: string };
  status: string;
  invoice: { number: string };
  can_be_approved: boolean;
  can_be_paid: boolean;
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

export interface PaymentSingleResponse {
  data: Payment;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService extends ApiService {
  list(params?: { contract_id?: string; status?: string; type?: string; per_page?: number }): Observable<PaymentListResponse> {
    return this.get('payments', params);
  }

  getPayment(id: string): Observable<PaymentSingleResponse> {
    return this.get(`payments/${id}`);
  }

  getOverdue(): Observable<{ data: Payment[]; meta: any }> {
    return this.get('payments/overdue');
  }

  getPending(): Observable<{ data: Payment[]; meta: any }> {
    return this.get('payments/pending');
  }

  approve(id: string): Observable<PaymentSingleResponse> {
    return this.post(`payments/${id}/approve`, {});
  }

  markAsPaid(id: string, data: { bank_reference: string; payment_method: string; payment_date?: string }): Observable<PaymentSingleResponse> {
    return this.post(`payments/${id}/mark-as-paid`, data);
  }
}
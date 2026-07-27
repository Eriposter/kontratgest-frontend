import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardOverview {
  contracts: {
    active: number;
    pending_approval: number;
    draft: number;
    total_value: number;
    by_type: { [key: string]: number };
  };
  guarantees: {
    expiring_soon: GuaranteeAlert[];
    expired: number;
    total_value: number;
  };
  payments: {
    overdue: PaymentAlert[];
    pending: number;
    total_overdue_amount: number;
    paid_this_month: number;
  };
  measurements: {
    pending_approval: number;
    approved_unpaid: number;
  };
  compliance: {
    entities_expired_certificates: number;
    entities_expiring_certificates: ComplianceAlert[];
  };
  recent_activities: Activity[];
}

export interface GuaranteeAlert {
  id: string;
  number: string;
  amount: number;
  currency: string;
  expiry_date: string;
  days_until_expiry: number;
  counterparty: string;
  contract_number: string;
}

export interface PaymentAlert {
  id: string;
  number: string;
  net_amount: number;
  currency: string;
  due_date: string;
  days_overdue: number;
  counterparty: string;
}

export interface ComplianceAlert {
  id: string;
  name: string;
  nif: string;
  agt_expiry: string | null;
  inss_expiry: string | null;
  days_until_agt_expiry: number | null;
  days_until_inss_expiry: number | null;
}

export interface Activity {
  id: number;
  event: string;
  description: string;
  subject_type: string;
  subject_id: string;
  created_at: string;
  entity_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends ApiService {
  getOverview(): Observable<{ data: DashboardOverview }> {
    return this.get<{ data: DashboardOverview }>('dashboard/overview');
  }
}
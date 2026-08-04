import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PlanNeed {
  id: string;
  contract_type: string;
  contract_type_label: string;
  procedure_type: string;
  procedure_type_label: string;
  title: string;
  description: string | null;
  justification: string | null;
  estimated_amount: number;
  executed_amount: number | null;
  priority: string;
  priority_label: string;
  planned_quarter: number | null;
  status: string;
  status_label: string;
  contract: {
    id: string;
    contract_number: string;
  } | null;
  created_at: string;
}

export interface AnnualContractPlan {
  id: string;
  year: number;
  title: string;
  description: string | null;
  financial: {
    total_planned: number;
    total_executed: number;
    execution_percentage: number;
  };
  status: string;
  status_label: string;
  approval: {
    approved_by: string | null;
    approved_at: string | null;
  };
  created_by: string | null;
  needs_count: number;
  needs: PlanNeed[];
  created_at: string;
  updated_at: string;
}

export interface PACListResponse {
  data: AnnualContractPlan[];
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
export class PACService extends ApiService {
  

  list(params?: { year?: number; status?: string; search?: string; per_page?: number }): Observable<PACListResponse> {
      return super.get<PACListResponse>('pacs', params);
    }
  
  getById(id: string): Observable<{ data: AnnualContractPlan }> {
      return super.get<{ data: AnnualContractPlan }>(`pacs/${id}`);
    }

  create(data: { year: number; title: string; description?: string }): Observable<{ data: AnnualContractPlan }> {
    return this.post<{ data: AnnualContractPlan }>('pacs', data);
  }

  update(id: string, data: { title?: string; description?: string }): Observable<{ data: AnnualContractPlan }> {
    return this.put<{ data: AnnualContractPlan }>(`pacs/${id}`, data);
  }

  submit(id: string): Observable<{ data: AnnualContractPlan }> {
    return this.post<{ data: AnnualContractPlan }>(`pacs/${id}/submit`, {});
  }

  approve(id: string): Observable<{ data: AnnualContractPlan }> {
    return this.post<{ data: AnnualContractPlan }>(`pacs/${id}/approve`, {});
  }

  cancel(id: string): Observable<{ data: AnnualContractPlan }> {
    return this.post<{ data: AnnualContractPlan }>(`pacs/${id}/cancel`, {});
  }

  // ─── Necessidades ──────────────────────────────────────
  addNeed(planId: string, data: any): Observable<{ data: PlanNeed }> {
    return this.post<{ data: PlanNeed }>(`pacs/${planId}/needs`, data);
  }

  updateNeed(needId: string, data: any): Observable<{ data: PlanNeed }> {
    return this.put<{ data: PlanNeed }>(`pacs/needs/${needId}`, data);
  }

  deleteNeed(needId: string): Observable<void> {
    return this.delete<void>(`pacs/needs/${needId}`);
  }

  getAvailableNeeds(): Observable<{ data: any[] }> {
  return this.get<{ data: any[] }>('pacs/available-needs');
}

generateContract(needId: string, data: any): Observable<{ data: any }> {
  return this.post<{ data: any }>(`pacs/needs/${needId}/generate-contract`, data);
}
}
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ProcurementProcedure } from './procurement.service';

export interface PlanNeed {
procurement_procedure: any;
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
  proposed_start_date: string | null;
  proposed_end_date: string | null;
 contracting_procedure?: ContractingProcedure | null;
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

// Adiciona no topo, junto das outras interfaces
export interface ContractingProcedure {
  id: string;
  plan_need_id: string;
  contract_id: string | null;
  winning_entity_id: string | null;
  procedure_start_date: string;
  procedure_end_date: string;
  confirmed_start_date: string | null;
  confirmed_end_date: string | null;
  status: string;
  status_label: string;
  duration_days: number | null;
  documents: any[] | null;
  notes: string | null;
  adjudication_notes: string | null;
  created_by: string | null;
  completed_at: string | null;
  need?: {
    id: string;
    title: string;
    estimated_amount: number;
    plan?: { year: number; title: string };
  };
  contract?: {
    id: string;
    contract_number: string;
    title: string;
  };
  winning_entity?: {
    id: string;
    name: string;
  };
  created_at: string;
}

export interface ContractingProcedureListResponse {
  data: ContractingProcedure[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

@Injectable({
  providedIn: 'root'
})
export class PACService extends ApiService {
  list(params?: { year?: number; status?: string; search?: string; per_page?: number }): Observable<PACListResponse> {
    return super.get<PACListResponse>('pacs', params);
  }

  // ✅ CORRIGIDO: Override para adicionar include automaticamente
  override get<T = any>(endpoint: string, params?: any): Observable<T> {
    // Se o endpoint for para buscar um PAC específico (ex: pacs/uuid-aqui)
    if (endpoint.startsWith('pacs/') && !endpoint.includes('available-needs')) {
      const id = endpoint.split('/')[1];
      // UUIDs têm formato específico (8-4-4-4-12 caracteres hex)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUUID) {
        if (!params) {
          params = { include: 'needs.contract' };
        } else if (!params.include) {
          params = { ...params, include: 'needs.contract' };
        }
      }
    }
    return super.get<T>(endpoint, params);
  }

  // Método específico para buscar PAC com necessidades
  getPACWithNeeds(id: string): Observable<{ data: AnnualContractPlan }> {
    return super.get<{ data: AnnualContractPlan }>(`pacs/${id}`, { include: 'needs.contract' });
  }

  create(data: { year: number; title: string; description?: string }): Observable<{ data: AnnualContractPlan }> {
    return super.post<{ data: AnnualContractPlan }>('pacs', data);
  }

  update(id: string, data: { title?: string; description?: string }): Observable<{ data: AnnualContractPlan }> {
    return super.put<{ data: AnnualContractPlan }>(`pacs/${id}`, data);
  }

  submit(id: string): Observable<{ data: AnnualContractPlan }> {
    return super.post<{ data: AnnualContractPlan }>(`pacs/${id}/submit`, {});
  }

  approve(id: string): Observable<{ data: AnnualContractPlan }> {
    return super.post<{ data: AnnualContractPlan }>(`pacs/${id}/approve`, {});
  }

  cancel(id: string): Observable<{ data: AnnualContractPlan }> {
    return super.post<{ data: AnnualContractPlan }>(`pacs/${id}/cancel`, {});
  }

  // ─── Necessidades ─────────────────────────────────────
  addNeed(planId: string, data: any): Observable<{ data: PlanNeed }> {
    return super.post<{ data: PlanNeed }>(`pacs/${planId}/needs`, data);
  }

  updateNeed(needId: string, data: any): Observable<{ data: PlanNeed }> {
    return super.put<{ data: PlanNeed }>(`pacs/needs/${needId}`, data);
  }

  deleteNeed(needId: string): Observable<void> {
    return super.delete<void>(`pacs/needs/${needId}`);
  }

  getAvailableNeeds(): Observable<{ data: any[] }> {
    return super.get<{ data: any[] }>('pacs/available-needs');
  }

  generateContract(needId: string, data: any): Observable<{ data: any }> {
    return super.post<{ data: any }>(`pacs/needs/${needId}/generate-contract`, data);
  }


  // ─── Procedimentos de Contratação ──────────────────────
listProcedures(params?: { status?: string; per_page?: number }): Observable<ContractingProcedureListResponse> {
  return super.get<ContractingProcedureListResponse>('contracting-procedures', params);
}

getProcedure(id: string): Observable<{ data: ContractingProcedure }> {
  return super.get<{ data: ContractingProcedure }>(`contracting-procedures/${id}`);
}

createProcedure(data: any): Observable<{ data: ContractingProcedure }> {
  return super.post<{ data: ContractingProcedure }>('contracting-procedures', data);
}

updateProcedure(id: string, data: any): Observable<{ data: ContractingProcedure }> {
  return super.put<{ data: ContractingProcedure }>(`contracting-procedures/${id}`, data);
}

startProcedure(id: string): Observable<{ data: ContractingProcedure }> {
  return super.post<{ data: ContractingProcedure }>(`contracting-procedures/${id}/start`, {});
}

moveToEvaluation(id: string): Observable<{ data: ContractingProcedure }> {
  return super.post<{ data: ContractingProcedure }>(`contracting-procedures/${id}/evaluation`, {});
}

completeProcedure(id: string, data: { winning_entity_id: string; adjudication_notes?: string }): Observable<{ data: ContractingProcedure }> {
  return super.post<{ data: ContractingProcedure }>(`contracting-procedures/${id}/complete`, data);
}

cancelProcedure(id: string, reason: string): Observable<{ data: ContractingProcedure }> {
  return super.post<{ data: ContractingProcedure }>(`contracting-procedures/${id}/cancel`, { reason });
}
}
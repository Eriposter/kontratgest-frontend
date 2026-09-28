import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ProcurementPhase {
  id: string;
  procedure_id: string;
  phase_name: string;
  sequence_order: number;
  status: string;
  status_label: string;
  start_date: string | null;
  end_date: string | null;
  documents: any[] | null;
  notes: string | null;
  observations: string | null;
  completed_at: string | null;
}

export interface ProcurementCandidate {
  id: string;
  entity_id: string;
  entity_name: string;
  status: string;
  status_label: string;
  proposed_amount: number | null;
  technical_score: number | null;
  financial_score: number | null;
  total_score: number | null;
}

export interface ProcurementProcedure {
  id: string;
  plan_need_id: string;
  contract_id: string | null;
  winning_entity_id: string | null;
  procedure_type: string;
  procedure_type_label: string;
  procedure_start_date: string;
  procedure_end_date: string;
  confirmed_start_date: string | null;
  confirmed_end_date: string | null;
  status: string;
  status_label: string;
  estimated_amount: number | null;
  contracted_amount: number | null;
  duration_days: number | null;
  progress_percentage: number;
  completed_phases_count: number;
  total_phases_count: number;
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
  phases: ProcurementPhase[];
  candidates: ProcurementCandidate[];
  created_at: string;
}

export interface ProcurementListResponse {
  data: ProcurementProcedure[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

@Injectable({
  providedIn: 'root'
})
export class ProcurementService extends ApiService {
  list(params?: { status?: string; type?: string; per_page?: number }): Observable<ProcurementListResponse> {
    return super.get<ProcurementListResponse>('procurement-procedures', params);
  }

  override get<T = { data: ProcurementProcedure }>(
    id: string,
    params?: any,
    options?: { responseType?: string }
  ): Observable<T> {
    return super.get<T>(`procurement-procedures/${id}`, params, options as any);
  }

  create(data: any): Observable<{ data: ProcurementProcedure }> {
    return super.post<{ data: ProcurementProcedure }>('procurement-procedures', data);
  }

  start(id: string): Observable<{ data: ProcurementProcedure }> {
    return super.post<{ data: ProcurementProcedure }>(`procurement-procedures/${id}/start`, {});
  }

  completePhase(procedureId: string, phaseId: string, data: any): Observable<any> {
    return super.post(`procurement-procedures/${procedureId}/phases/${phaseId}/complete`, data);
  }

  complete(id: string, data: { winning_entity_id: string; adjudication_notes?: string }): Observable<{ data: ProcurementProcedure }> {
    return super.post<{ data: ProcurementProcedure }>(`procurement-procedures/${id}/complete`, data);
  }

  cancel(id: string, reason: string): Observable<{ data: ProcurementProcedure }> {
    return super.post<{ data: ProcurementProcedure }>(`procurement-procedures/${id}/cancel`, { reason });
  }
}
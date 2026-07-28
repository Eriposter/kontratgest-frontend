// measurement.service.ts - Versão corrigida baseada no contract.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Measurement {
  id: string;
  measurement_number: string;
  sequence_number: number;
  contract: {
    id: string;
    contract_number: string;
    counterparty: {
      id: string;
      name: string;
    };
  };
  period: {
    start: string;
    end: string;
  };
  financial: {
    total_amount: number;
    cumulative_amount: number;
    retention_percentage: number;
    retention_amount: number;
    net_amount: number;
  };
  status: string;
  status_label: string;
  observations: string;
  approval: {
    submitted_by: string;
    submitted_at: string;
    approved_by: string;
    approved_at: string;
    notes: string;
  };
  payment: {
    id: string;
    paid_at: string;
  };
  can_be_submitted: boolean;
  can_be_approved: boolean;
  can_be_paid: boolean;
  items: MeasurementItem[];
  created_at: string;
  updated_at: string;
}

export interface MeasurementItem {
  id: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  specific_data: any;
}

export interface MeasurementListResponse {
  data: Measurement[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface MeasurementSingleResponse {
  data: Measurement;
}

export interface MeasurementPendingResponse {
  data: Measurement[];
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
export class MeasurementService extends ApiService {
  
  /**
   * Lista todas as medições com filtros opcionais
   */
  list(params?: { 
    contract_id?: string; 
    status?: string; 
    search?: string; 
    per_page?: number 
  }): Observable<MeasurementListResponse> {
    return this.get<MeasurementListResponse>('measurements', params);
  }

  /**
   * Obtém uma medição específica pelo ID
   */
  getMeasurement(id: string): Observable<MeasurementSingleResponse> {
    return this.get<MeasurementSingleResponse>(`measurements/${id}`);
  }

  /**
   * Cria uma nova medição
   */
  create(data: any): Observable<MeasurementSingleResponse> {
    return this.post<MeasurementSingleResponse>('measurements', data);
  }

  /**
   * Atualiza uma medição existente
   */
  update(id: string, data: any): Observable<MeasurementSingleResponse> {
    return this.put<MeasurementSingleResponse>(`measurements/${id}`, data);
  }

  /**
   * Remove uma medição
   */
  deleteMeasurement(id: string): Observable<void> {
    return this.delete<void>(`measurements/${id}`);
  }

  /**
   * Submete uma medição para aprovação
   */
  submit(id: string): Observable<MeasurementSingleResponse> {
    return this.post<MeasurementSingleResponse>(`measurements/${id}/submit`, {});
  }

  /**
   * Aprova uma medição submetida
   */
  approve(id: string, notes: string = ''): Observable<MeasurementSingleResponse> {
    return this.post<MeasurementSingleResponse>(`measurements/${id}/approve`, { notes });
  }

  /**
   * Rejeita uma medição submetida
   */
  reject(id: string, notes: string): Observable<MeasurementSingleResponse> {
    return this.post<MeasurementSingleResponse>(`measurements/${id}/reject`, { notes });
  }

  /**
   * Marca uma medição como paga
   */
  markAsPaid(id: string): Observable<MeasurementSingleResponse> {
    return this.post<MeasurementSingleResponse>(`measurements/${id}/pay`, {});
  }

  /**
   * Obtém todas as medições pendentes
   */
  getPending(params?: { per_page?: number }): Observable<MeasurementPendingResponse> {
    return this.get<MeasurementPendingResponse>('measurements/pending', params);
  }

  /**
   * Obtém todas as medições aprovadas mas não pagas
   */
  getApprovedUnpaid(params?: { per_page?: number }): Observable<MeasurementPendingResponse> {
    return this.get<MeasurementPendingResponse>('measurements/approved-unpaid', params);
  }

  /**
   * Obtém medições por contrato
   */
  getByContract(contractId: string): Observable<MeasurementListResponse> {
    return this.get<MeasurementListResponse>(`contracts/${contractId}/measurements`);
  }

  /**
   * Obtém o progresso de medições de um contrato
   */
  getProgress(contractId: string): Observable<{ data: any }> {
    return this.get<{ data: any }>(`contracts/${contractId}/measurements/progress`);
  }

  /**
   * Obtém estatísticas de medições
   */
  getStats(params?: { contract_id?: string }): Observable<{ data: any }> {
    return this.get<{ data: any }>('measurements/stats', params);
  }
}
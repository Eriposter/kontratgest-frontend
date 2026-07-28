import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Document {
  id: string;
  document_type: string;
  title: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  issued_at: string | null;
  expires_at: string | null;
  is_current: boolean;
  is_expired: boolean;
  uploaded_at: string;
}

export type EntityType = 'entity' | 'contract' | 'guarantee' | 'measurement';

@Injectable({
  providedIn: 'root'
})
export class DocumentService extends ApiService {
  
  // ─── Entidades ───────────────────────────────────────────
  uploadEntityDocument(entityId: string, formData: FormData): Observable<{ data: Document }> {
    return this.post<{ data: Document }>(`documents/entities/${entityId}/upload`, formData);
  }

  getEntityDocuments(entityId: string): Observable<{ data: Document[] }> {
    return this.get<{ data: Document[] }>(`entities/${entityId}/documents`);
  }

  deleteEntityDocument(entityId: string, documentId: string): Observable<void> {
    return this.delete<void>(`entities/${entityId}/documents/${documentId}`);
  }

  // ─── Contratos ───────────────────────────────────────────
  uploadContractDocument(contractId: string, formData: FormData): Observable<{ data: Document }> {
    return this.post<{ data: Document }>(`documents/contracts/${contractId}/upload`, formData);
  }

  getContractDocuments(contractId: string): Observable<{ data: Document[] }> {
    return this.get<{ data: Document[] }>(`contracts/${contractId}/documents`);
  }

  deleteContractDocument(contractId: string, documentId: string): Observable<void> {
    return this.delete<void>(`contracts/${contractId}/documents/${documentId}`);
  }

  // ─── Cauções ─────────────────────────────────────────────
  uploadGuaranteeDocument(guaranteeId: string, formData: FormData): Observable<{ data: Document }> {
    return this.post<{ data: Document }>(`documents/guarantees/${guaranteeId}/upload`, formData);
  }

  getGuaranteeDocuments(guaranteeId: string): Observable<{ data: Document[] }> {
    return this.get<{ data: Document[] }>(`guarantees/${guaranteeId}/documents`);
  }

  deleteGuaranteeDocument(guaranteeId: string, documentId: string): Observable<void> {
    return this.delete<void>(`guarantees/${guaranteeId}/documents/${documentId}`);
  }

  // ─── Autos de Medição (via upload genérico) ──────────────
  // Nota: Autos não têm tabela própria de documentos no backend,
  // então vamos usar o endpoint genérico de contratos (o auto pertence a um contrato)
  // ou criar um endpoint específico se necessário.
  
  // ─── Download genérico ───────────────────────────────────
  downloadDocument(type: EntityType, id: string): Observable<Blob> {
    return this.get<Blob>(`documents/${type}/${id}/download`, {}, { responseType: 'blob' } as any);
  }
}
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService, Document, EntityType } from '../../../core/services/document.service';

@Component({
  selector: 'app-document-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-uploader.html',
  styleUrls: ['./document-uploader.scss']
})
export class DocumentUploaderComponent implements OnInit {
  private documentService = inject(DocumentService);

  @Input() entityType: EntityType = 'entity';
  @Input() entityId: string = '';
  @Input() documentTypes: { value: string; label: string }[] = [];
  
  @Output() uploaded = new EventEmitter<Document[]>();
  @Output() deleted = new EventEmitter<string>();

  documents: Document[] = [];
  loading = false;
  uploading = false;
  errorMessage = '';
  successMessage = '';
  isDragOver = false;

  selectedFile: File | null = null;
  selectedType = '';

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnChanges(): void {
    if (this.entityId) {
      this.loadDocuments();
    }
  }

  loadDocuments(): void {
    if (!this.entityId) return;
    
    this.loading = true;
    
    const method = this.getGetMethod();
    method(this.entityId).subscribe({
      next: (response: { data: Document[]; }) => {
        this.documents = response.data;
        this.loading = false;
      },
      error: () => {
        this.documents = [];
        this.loading = false;
      }
    });
  }

    private getGetMethod(): (id: string) => any {
  switch (this.entityType) {
    case 'entity': return this.documentService.getEntityDocuments.bind(this.documentService);
    case 'contract': return this.documentService.getContractDocuments.bind(this.documentService);
    case 'guarantee': return this.documentService.getGuaranteeDocuments.bind(this.documentService);
    case 'procurement': return this.documentService.getProcurementDocuments.bind(this.documentService); // ✅ ADICIONADO
    default: return this.documentService.getEntityDocuments.bind(this.documentService);
  }
}

private getUploadMethod(): (id: string, formData: FormData) => any {
  switch (this.entityType) {
    case 'entity': return this.documentService.uploadEntityDocument.bind(this.documentService);
    case 'contract': return this.documentService.uploadContractDocument.bind(this.documentService);
    case 'guarantee': return this.documentService.uploadGuaranteeDocument.bind(this.documentService);
    case 'procurement': return this.documentService.uploadProcurementDocument.bind(this.documentService); // ✅ ADICIONADO
    default: return this.documentService.uploadEntityDocument.bind(this.documentService);
  }
}

private getDeleteMethod(): (id: string, docId: string) => any {
  switch (this.entityType) {
    case 'entity': return this.documentService.deleteEntityDocument.bind(this.documentService);
    case 'contract': return this.documentService.deleteContractDocument.bind(this.documentService);
    case 'guarantee': return this.documentService.deleteGuaranteeDocument.bind(this.documentService);
    case 'procurement': return this.documentService.deleteProcurementDocument.bind(this.documentService); // ✅ ADICIONADO
    default: return this.documentService.deleteEntityDocument.bind(this.documentService);
  }
}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateFile(file);
    }
  }

  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      this.errorMessage = 'O ficheiro excede o tamanho máximo de 10MB';
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Tipo de ficheiro não permitido. Use PDF, JPG, PNG ou DOC/DOCX';
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';
  }

  upload(): void {
    if (!this.selectedFile || !this.selectedType) {
      this.errorMessage = 'Selecione um ficheiro e um tipo de documento';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('document', this.selectedFile);
    formData.append('document_type', this.selectedType);

    const uploadMethod = this.getUploadMethod();
    uploadMethod(this.entityId, formData).subscribe({
      next: (response: { data: Document[]; }) => {
        this.uploading = false;
        this.successMessage = 'Documento carregado com sucesso!';
        this.selectedFile = null;
        this.selectedType = '';
        this.loadDocuments();
        this.uploaded.emit(response.data);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: { error: { message: string; }; }) => {
        this.uploading = false;
        this.errorMessage = err.error?.message || 'Erro ao carregar documento';
      }
    });
  }

  deleteDocument(doc: Document): void {
    if (!confirm('Tem a certeza que deseja eliminar este documento?')) return;

    const deleteMethod = this.getDeleteMethod();
    deleteMethod(this.entityId, doc.id).subscribe({
      next: () => {
        this.documents = this.documents.filter(d => d.id !== doc.id);
        this.deleted.emit(doc.id);
      },
      error: (err: { error: { message: string; }; }) => {
        this.errorMessage = err.error?.message || 'Erro ao eliminar documento';
      }
    });
  }

  downloadDocument(doc: Document): void {
    this.documentService.downloadDocument(this.entityType, doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Erro ao descarregar documento';
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} bytes`;
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    return '📎';
  }

  getDocumentTypeLabel(type: string): string {
    const found = this.documentTypes.find(t => t.value === type);
    return found?.label || type;
  }
}
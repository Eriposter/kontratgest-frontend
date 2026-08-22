// user-form.ts - Versão completa com scroll e validações
import { Component, EventEmitter, Input, OnInit, Output, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role, SettingsService, User } from '../../../../core/services/settings.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss'],
  
})
export class UserFormComponent implements OnInit, AfterViewInit {
  private settingsService = inject(SettingsService);

  @Input() user: User | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isEdit = false;
  isLoading = false;
  isLoadingRoles = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  // Scroll management
  showScrollProgress = true;
  scrollProgress = 0;
  showScrollTop = false;
  private scrollContainer!: HTMLElement;

  // Password visibility
  showPassword = false;

  roles: Role[] = [];
  selectedRoles: string[] = [];

  formData = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    department: '',
    position: '',
    is_active: true
  };

  departments = [
    'Direção Geral',
    'Direção Financeira',
    'Direção Técnica',
    'Direção de Engenharia',
    'Direção de Compras',
    'Direção de Planeamento',
    'Recursos Humanos',
    'Tecnologias de Informação',
    'Jurídico',
    'Auditoria',
    'Comercial',
    'Operações'
  ];

  ngOnInit(): void {
    this.loadRoles();
    if (this.user) {
      this.isEdit = true;
      this.loadUserData();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollContainer = document.querySelector('.form-scroll-container') as HTMLElement;
    });
  }

  // Scroll methods
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    
    this.scrollProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    this.showScrollTop = scrollTop > 200;
  }

  scrollToTop(): void {
    if (this.scrollContainer) {
      this.scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  // Password visibility toggle
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  loadRoles(): void {
    this.isLoadingRoles = true;
    this.settingsService.getRoles().subscribe({
      next: (response) => {
        this.roles = response.data;
        this.isLoadingRoles = false;
      },
      error: () => {
        this.isLoadingRoles = false;
        this.errorMessage = 'Erro ao carregar roles';
      }
    });
  }

  loadUserData(): void {
    if (!this.user) return;

    this.formData = {
      name: this.user.name,
      email: this.user.email,
      password: '',
      password_confirmation: '',
      phone: this.user.phone || '',
      department: this.user.department || '',
      position: this.user.position || '',
      is_active: this.user.is_active
    };

    this.selectedRoles = this.user.roles.map(r => r.name);
  }

  toggleRole(roleName: string): void {
    // Prevent removing admin role from existing user
    if (roleName === 'admin' && this.isEdit) return;

    const index = this.selectedRoles.indexOf(roleName);
    if (index >= 0) {
      this.selectedRoles.splice(index, 1);
    } else {
      this.selectedRoles.push(roleName);
    }
    this.successMessage = '';
  }

  isRoleSelected(roleName: string): boolean {
    return this.selectedRoles.includes(roleName);
  }

  getSelectedRolesNames(): string {
    return this.selectedRoles.join(', ');
  }

  // Email validation
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Password strength
  getPasswordStrength(): number {
    const password = this.formData.password;
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

    return Math.min(strength, 100);
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength <= 25) return 'weak';
    if (strength <= 50) return 'medium';
    if (strength <= 75) return 'strong';
    return 'very-strong';
  }

  getPasswordStrengthLabel(): string {
    const strength = this.getPasswordStrength();
    if (strength <= 25) return 'Fraca';
    if (strength <= 50) return 'Média';
    if (strength <= 75) return 'Forte';
    return 'Muito Forte';
  }

  // user-form.ts - Corrigir isFormValid
isFormValid(): boolean {
  // Name validation
  if (!this.formData.name || this.formData.name.trim().length < 3) {
    console.log('❌ Nome inválido');
    return false;
  }

  // Email validation
  if (!this.formData.email || !this.isValidEmail(this.formData.email)) {
    console.log('❌ Email inválido');
    return false;
  }

  // Password validation for new users
  if (!this.isEdit) {
    if (!this.formData.password || this.formData.password.length < 8) {
      console.log('❌ Password muito curta');
      return false;
    }
    if (this.formData.password !== this.formData.password_confirmation) {
      console.log('❌ Passwords não coincidem');
      return false;
    }
  }

  console.log('✅ Formulário válido');
  return true;
}

  onSubmit(): void {
  console.log('🚀🚀🚀 SUBMIT CHAMADO! 🚀🚀🚀');
  console.log('📝 isEdit:', this.isEdit);
  console.log('📝 user:', this.user);
  console.log('📝 formData:', this.formData);
  
  if (!this.isFormValid()) {
    console.log('❌ Formulário inválido');
    this.errorMessage = 'Por favor, corrija os campos com erro antes de continuar';
    this.scrollToTop();
    return;
  }

  console.log('✅ Formulário válido - continuando...');

  this.isSaving = true;
  this.errorMessage = '';
  this.successMessage = '';

  const payload: any = {
    name: this.formData.name.trim(),
    email: this.formData.email.trim(),
    phone: this.formData.phone || null,
    department: this.formData.department || null,
    position: this.formData.position || null,
    roles: this.selectedRoles,
    is_active: this.formData.is_active
  };

  console.log('📦 Payload a ser enviado:', payload);

    if (!this.isEdit) {
      payload.password = this.formData.password;
    }

    const operation = this.isEdit && this.user
      ? this.settingsService.updateUser(this.user.id, payload)
      : this.settingsService.createUser(payload);

    operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = this.isEdit ? 'Utilizador atualizado com sucesso!' : 'Utilizador criado com sucesso!';
        setTimeout(() => {
          this.saved.emit();
        }, 1500);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Erro ao guardar utilizador';
        this.scrollToTop();
      }
    });
  }
}
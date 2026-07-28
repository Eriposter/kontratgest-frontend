import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.html'
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  router = inject(Router);

  currentUser: any = (this.authService as any).currentUserSubject.value;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'home' },
    { label: 'PAC', route: '/pac', icon: 'calendar', badge: 0 },
    { label: 'Entidades', route: '/entities', icon: 'building' },
    { label: 'Contratos', route: '/contracts', icon: 'document', badge: 5 },
    { label: 'Autos de Medição', route: '/measurements', icon: 'measurement' },  // ← ADICIONAR
    { label: 'Cauções', route: '/guarantees', icon: 'shield' },
    { label: 'Pagamentos', route: '/payments', icon: 'money', badge: 2 },
    { label: 'Relatórios', route: '/reports', icon: 'chart' },
  ];

  get userInitials(): string {
    if (!this.currentUser) return 'U';
    return this.currentUser.name.split(' ').map((n: any[]) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  get gradientClass(): string {
    // Gradiente baseado no nome (para avatares consistentes)
    const gradients = [
      'from-primary-500 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-600',
    ];
    const index = this.currentUser?.name?.length ?? 0;
    return gradients[index % gradients.length];
  }

  get currentDate(): string {
  const now = new Date();
  return now.toLocaleDateString('pt-PT', { 
    weekday: 'short', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

  logout(): void {
    this.authService.logout();
  }
}
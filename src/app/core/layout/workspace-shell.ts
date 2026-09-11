import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NavItem } from '../../shared/models/domain';

@Component({
  selector: 'app-workspace-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="workspace-shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <aside class="sidebar">
        <a class="brand" routerLink="/app/dashboard" aria-label="VARETHON ASCEND home">
          <span class="brand-mark">V</span>
          <span class="brand-copy"><strong>VARETHON</strong><small>ASCEND OS</small></span>
        </a>
        <div class="sidebar-section-label">WORKSPACE</div>
        <nav class="main-nav" aria-label="Main navigation">
          @for (item of navItems; track item.route) {
            <a class="nav-item" [routerLink]="item.route" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact ?? false }">
              <span class="nav-icon">{{ item.icon }}</span><span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="sidebar-spacer"></div>
        <a class="nav-item" routerLink="/app/settings" routerLinkActive="active"><span class="nav-icon">⚙</span><span>Cài đặt</span></a>
        <button class="profile-chip" type="button" (click)="logout()">
          <span class="avatar">{{ initials }}</span><span class="profile-copy"><strong>{{ auth.username() || 'ASCEND user' }}</strong><small>Đăng xuất</small></span><span class="logout-arrow">↗</span>
        </button>
      </aside>

      <main class="main-panel">
        <header class="topbar">
          <button class="icon-button mobile-menu" type="button" (click)="sidebarCollapsed.set(!sidebarCollapsed())" aria-label="Mở menu">☰</button>
          <div class="breadcrumb"><span class="muted">VARETHON</span><span>/</span><strong>Hôm nay</strong></div>
          <div class="topbar-actions"><span class="status-dot"></span><span class="status-text">Hệ thống ổn định</span><button class="icon-button" type="button" aria-label="Thông báo">⌁</button></div>
        </header>
        <section class="page-frame"><router-outlet /></section>
      </main>
      <nav class="mobile-nav" aria-label="Mobile navigation">
        @for (item of mobileItems; track item.route) { <a [routerLink]="item.route" routerLinkActive="active"><span>{{ item.icon }}</span><small>{{ item.label }}</small></a> }
      </nav>
    </div>
  `,
})
export class WorkspaceShell {
  readonly sidebarCollapsed = signal(false);
  readonly navItems: NavItem[] = [
    { label: 'Tổng quan', icon: '⌂', route: '/app/dashboard', exact: true },
    { label: 'Mục tiêu', icon: '◎', route: '/app/goals' },
    { label: 'Kế hoạch tháng', icon: '▦', route: '/app/month' },
    { label: 'Nhiệm vụ', icon: '✓', route: '/app/tasks' },
    { label: 'Lịch', icon: '◷', route: '/app/calendar' },
    { label: 'Thói quen', icon: '✦', route: '/app/habits' },
    { label: 'Focus', icon: '◉', route: '/app/focus' },
    { label: 'Learning', icon: '⌁', route: '/app/learning' },
    { label: 'Reviews', icon: '↻', route: '/app/reviews' },
    { label: 'Analytics', icon: '↗', route: '/app/analytics' },
    { label: 'AI Coach', icon: '✧', route: '/app/ai' },
  ];
  readonly mobileItems = this.navItems.slice(0, 5);
  get initials(): string { return (this.auth.username() || 'VA').slice(0, 2).toUpperCase(); }

  constructor(readonly auth: AuthService) {}

  async logout(): Promise<void> { await this.auth.signOut(); }
}

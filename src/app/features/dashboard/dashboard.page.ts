import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/services/workspace-store.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header dashboard-header">
      <div><div class="eyebrow">THỨ SÁU · 11 THÁNG 9, 2026</div><h1>Chào buổi sáng, <em>Hùng.</em></h1><p class="page-subtitle">Tập trung vào một bước có ý nghĩa tiếp theo.</p></div>
      <a class="primary-button" routerLink="/app/ai">✧ Lập lịch bằng AI <span>→</span></a>
    </div>

    <div class="dashboard-grid">
      <section class="hero-card card-span-2">
        <div class="hero-glow"></div><div class="card-kicker">NEXT ACTION · 01</div>
        <div class="hero-main"><div><h2>{{ nextTask()?.title || 'Chọn một mục tiêu để bắt đầu' }}</h2><p>{{ nextTask()?.description || 'Mọi hành trình lớn đều bắt đầu bằng một phiên tập trung nhỏ.' }}</p></div><a class="round-action" [routerLink]="nextTask() ? '/app/focus' : '/app/goals'">→</a></div>
        <div class="hero-meta"><span class="tag tag-cyan">{{ nextTask() ? 'P0 · Ưu tiên cao' : 'Gợi ý' }}</span><span>◷ {{ nextTask()?.estimatedMinutes || 0 }} phút</span><span>⌁ {{ nextTask()?.lifeAreaId ? areaName(nextTask()!.lifeAreaId) : 'Workspace' }}</span></div>
      </section>

      <section class="metric-card"><div class="card-kicker">FOCUS HÔM NAY</div><div class="metric-value">{{ store.totalFocusMinutes() }}<small> phút</small></div><div class="metric-trend positive">↑ 18% <span>so với tuần trước</span></div><div class="mini-bars"><i style="height:35%"></i><i style="height:55%"></i><i style="height:48%"></i><i style="height:72%"></i><i style="height:58%"></i><i class="today" style="height:82%"></i><i style="height:28%"></i></div></section>
      <section class="metric-card"><div class="card-kicker">TASKS TUẦN NÀY</div><div class="metric-value">{{ completedCount() }}<small>/{{ weekTaskCount() }}</small></div><div class="progress-line"><span [style.width.%]="completionPercent()"></span></div><div class="metric-foot"><span>{{ completionPercent() }}% hoàn thành</span><span>→</span></div></section>

      <section class="panel timeline-panel card-span-2"><div class="panel-heading"><div><div class="card-kicker">TODAY TIMELINE</div><h3>Lịch thực thi</h3></div><a routerLink="/app/calendar">Xem lịch →</a></div><div class="timeline-list"><div class="timeline-time">09:00</div><div class="timeline-item done"><span class="timeline-dot"></span><div><strong>Daily reset & planning</strong><small>Daily ritual · 15 phút</small></div><span class="timeline-status">✓</span></div><div class="timeline-time">13:30</div><div class="timeline-item active"><span class="timeline-dot"></span><div><strong>Deep work · planning core</strong><small>VARETHON ASCEND · 90 phút</small></div><span class="timeline-status">NOW</span></div><div class="timeline-time">19:30</div><div class="timeline-item"><span class="timeline-dot"></span><div><strong>English listening shadowing</strong><small>Learning · 30 phút</small></div></div></div></section>

      <section class="panel focus-goal"><div class="panel-heading"><div><div class="card-kicker">FOCUS GOAL</div><h3>Ship VARETHON</h3></div><span class="circle-progress">64%</span></div><p>Hoàn thành hệ thống để mỗi ngày có một nhịp tiến bộ rõ ràng.</p><div class="progress-line large"><span style="width:64%"></span></div><div class="goal-stats"><span>8 milestones</span><span>·</span><span>Đến 31/12/2026</span></div></section>

      <section class="panel habits-panel"><div class="panel-heading"><div><div class="card-kicker">RHYTHM</div><h3>Thói quen hôm nay</h3></div><a routerLink="/app/habits">Tất cả →</a></div>@for (habit of store.habits(); track habit.id) {<div class="habit-row"><span class="habit-icon" [class]="habit.colorKey">{{ habit.completedToday ? '✓' : '○' }}</span><div><strong>{{ habit.title }}</strong><small>{{ habit.currentStreak }} ngày liên tiếp</small></div><span class="habit-state" [class.complete]="habit.completedToday">{{ habit.completedToday ? 'Đã xong' : 'Chờ' }}</span></div>}</section>

      <section class="panel monthly-panel card-span-2"><div class="panel-heading"><div><div class="card-kicker">SEPTEMBER 2026</div><h3>Nhịp tháng này</h3></div><a routerLink="/app/month">Mở kế hoạch →</a></div><div class="monthly-content"><div class="ring-wrap"><div class="big-ring"><strong>72%</strong><small>đã đi</small></div></div><div class="monthly-bars">@for (goal of monthlyGoals(); track goal.id) {<div class="bar-row"><div><span>{{ goal.title }}</span><strong>{{ goal.progress }}%</strong></div><div class="progress-line"><span [style.width.%]="goal.progress"></span></div></div>}</div></div></section>
    </div>
  `,
})
export class DashboardPage {
  readonly nextTask = computed(() => this.store.openTasks().find((task) => task.status === 'in_progress') ?? this.store.openTasks()[0]);
  readonly monthlyGoals = computed(() => this.store.monthlyPlans()[0]?.monthlyGoals ?? []);
  constructor(readonly store: WorkspaceStore) {}
  completedCount(): number { return this.store.completedTasks().length; }
  weekTaskCount(): number { return this.store.tasks().length; }
  completionPercent(): number { const total = this.weekTaskCount(); return total ? Math.round((this.completedCount() / total) * 100) : 0; }
  areaName(id?: string): string { return this.store.lifeAreas().find((area) => area.id === id)?.name ?? 'Workspace'; }
}

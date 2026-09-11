import { Component } from '@angular/core';
import { WorkspaceStore } from '../../core/services/workspace-store.service';

@Component({
  selector: 'app-habits-page',
  standalone: true,
  template: `
    <div class="page-header"><div><div class="eyebrow">CONSISTENCY ENGINE</div><h1>Thói quen <em>nhỏ, đều.</em></h1><p class="page-subtitle">Đừng theo đuổi streak hoàn hảo. Hãy xây một nhịp có thể quay lại.</p></div><button class="primary-button" type="button">+ Thói quen mới</button></div>
    <div class="habit-summary"><div><span>STREAK HIỆN TẠI</span><strong>6 <small>ngày</small></strong><em>↑ đang lên</em></div><div><span>TỶ LỆ 7 NGÀY</span><strong>86<small>%</small></strong><em>+12% tuần này</em></div><div><span>ĐÃ HOÀN THÀNH</span><strong>{{ completedToday() }}<small>/{{ store.habits().length }}</small></strong><em>hôm nay</em></div></div>
    <div class="section-title"><h2>Nhịp hôm nay</h2><span>{{ todayLabel }}</span></div>
    <div class="habits-grid">@for (habit of store.habits(); track habit.id) {<article class="habit-card" [class.completed]="habit.completedToday"><div class="habit-card-top"><span class="habit-icon large" [class]="habit.colorKey">{{ habit.completedToday ? '✓' : '✦' }}</span><button class="more-button" type="button">•••</button></div><h3>{{ habit.title }}</h3><p>{{ habit.frequency }} <span>·</span> {{ habit.targetMinutes }} phút</p><div class="habit-card-footer"><span class="streak"><strong>{{ habit.currentStreak }}</strong> ngày streak</span><button class="habit-check" type="button" (click)="store.toggleHabit(habit.id)">{{ habit.completedToday ? 'Đã xong' : 'Check in' }} <span>{{ habit.completedToday ? '✓' : '→' }}</span></button></div></article>}</div>
    <section class="panel trend-panel"><div class="panel-heading"><div><div class="card-kicker">30-DAY TREND</div><h3>Consistency, không phải perfection</h3></div><span class="tag tag-violet">86% trung bình</span></div><div class="habit-heatmap">@for (cell of heatmap; track $index) {<i [class]="cell"></i>}</div><div class="heatmap-labels"><span>Ít hoạt động</span><span>Nhiều hoạt động</span></div></section>
  `,
})
export class HabitsPage {
  readonly todayLabel = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  readonly heatmap = Array.from({ length: 42 }, (_, index) => index % 7 === 0 ? 'low' : index % 5 === 0 ? 'high' : index % 3 === 0 ? 'medium' : 'base');
  constructor(readonly store: WorkspaceStore) {}
  completedToday(): number { return this.store.habits().filter((habit) => habit.completedToday).length; }
}

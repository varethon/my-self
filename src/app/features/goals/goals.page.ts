import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { DateLabelPipe } from '../../shared/pipes/date-label.pipe';

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [ReactiveFormsModule, DateLabelPipe],
  template: `
    <div class="page-header"><div><div class="eyebrow">DIRECTION & INTENT</div><h1>Mục tiêu <em>dài hạn.</em></h1><p class="page-subtitle">Giữ hướng đi rõ ràng, rồi để hệ thống giúp bạn đi từng bước.</p></div><button class="primary-button" type="button" (click)="showForm.set(!showForm())">+ Mục tiêu mới</button></div>
    @if (showForm()) { <form class="inline-form panel" [formGroup]="form" (ngSubmit)="createGoal()"><div class="form-grid"><label>Tên mục tiêu<input formControlName="title" placeholder="Ví dụ: Đạt IELTS 6.0" /></label><label>Deadline<input type="date" formControlName="targetDate" /></label><label>Lĩnh vực<select formControlName="lifeAreaId">@for (area of store.lifeAreas(); track area.id) {<option [value]="area.id">{{ area.name }}</option>}</select></label></div><div class="form-actions"><button class="secondary-button" type="button" (click)="showForm.set(false)">Hủy</button><button class="primary-button" type="submit" [disabled]="form.invalid">Tạo mục tiêu</button></div></form> }
    <div class="goal-summary"><div class="summary-card"><span>ĐANG TIẾN HÀNH</span><strong>{{ activeGoals().length }}</strong><small>mục tiêu</small></div><div class="summary-card"><span>TIẾN ĐỘ TRUNG BÌNH</span><strong>{{ averageProgress() }}%</strong><small>trên các hướng đi</small></div><div class="summary-card accent"><span>THÁNG NÀY</span><strong>{{ monthlyProgress() }}%</strong><small>mục tiêu đã hoàn thành</small></div></div>
    <div class="section-title"><h2>Hành trình đang mở</h2><span>{{ store.goals().length }} mục tiêu</span></div>
    <div class="goal-list">@for (goal of store.goals(); track goal.id) {<article class="goal-card"><div class="goal-card-top"><div class="goal-icon" [class]="areaColor(goal.lifeAreaId)">{{ areaIcon(goal.lifeAreaId) }}</div><div class="goal-title"><span class="tag" [class]="priorityClass(goal.priority)">{{ priorityLabel(goal.priority) }}</span><h3>{{ goal.title }}</h3><p>{{ goal.description }}</p></div><button class="more-button" type="button" aria-label="Goal options">•••</button></div><div class="goal-card-bottom"><div class="goal-progress"><div class="progress-line large"><span [style.width.%]="goal.progress"></span></div><div><strong>{{ goal.progress }}%</strong><span>đến {{ goal.targetDate | dateLabel }}</span></div></div><div class="goal-linked"><span>{{ areaName(goal.lifeAreaId) }}</span><span>↗</span></div></div><div class="milestone-strip"><span>{{ goal.milestones.length }} milestone{{ goal.milestones.length === 1 ? '' : 's' }}</span><button class="ghost-button" type="button" (click)="addMilestone(goal.id)">+ Thêm milestone</button></div>@for (milestone of goal.milestones; track milestone.id) {<div class="milestone-row"><span class="node-marker" [class.done]="milestone.completed">{{ milestone.completed ? '✓' : '·' }}</span><span>{{ milestone.title }}</span><small>{{ milestone.targetDate | dateLabel }}</small></div>}</article>}</div>
  `,
})
export class GoalsPage {
  private readonly fb = inject(FormBuilder);
  readonly showForm = signal(false);
  readonly activeGoals = () => this.store.goals().filter((goal) => goal.status === 'active');
  readonly form = this.fb.nonNullable.group({ title: ['', Validators.required], targetDate: ['2027-06-30', Validators.required], lifeAreaId: ['area-learning', Validators.required] });
  constructor(readonly store: WorkspaceStore) {}
  createGoal(): void { if (this.form.invalid) return; const value = this.form.getRawValue(); this.store.addGoal({ title: value.title, description: 'Mục tiêu mới được tạo từ workspace.', targetDate: value.targetDate, lifeAreaId: value.lifeAreaId, priority: 1 }); this.form.reset({ title: '', targetDate: '2027-06-30', lifeAreaId: 'area-learning' }); this.showForm.set(false); }
  addMilestone(goalId: string): void { this.store.addMilestone(goalId, `Bước tiếp theo · ${new Date().toLocaleDateString('vi-VN')}`); }
  averageProgress(): number { const goals = this.activeGoals(); return goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0; }
  monthlyProgress(): number { const goals = this.store.monthlyPlans()[0]?.monthlyGoals ?? []; return goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0; }
  areaName(id: string): string { return this.store.lifeAreas().find((area) => area.id === id)?.name ?? 'Khác'; }
  areaIcon(id: string): string { return this.store.lifeAreas().find((area) => area.id === id)?.icon ?? '◎'; }
  areaColor(id: string): string { return this.store.lifeAreas().find((area) => area.id === id)?.colorKey ?? 'cyan'; }
  priorityClass(priority: number): string { return priority === 0 ? 'tag-cyan' : priority === 1 ? 'tag-violet' : 'tag-muted'; }
  priorityLabel(priority: number): string { return `P${priority} · ${priority === 0 ? 'Critical' : priority === 1 ? 'High' : 'Focus'}`; }
}

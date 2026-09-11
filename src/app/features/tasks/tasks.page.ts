import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { Task } from '../../shared/models/domain';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header"><div><div class="eyebrow">EXECUTION LAYER</div><h1>Nhiệm vụ <em>hôm nay.</em></h1><p class="page-subtitle">Chọn việc quan trọng nhất, rồi bắt đầu trước khi tối ưu.</p></div><button class="primary-button" type="button" (click)="showForm.set(!showForm())">+ Task mới</button></div>
    @if (showForm()) {<form class="inline-form panel" [formGroup]="form" (ngSubmit)="createTask()"><div class="form-grid"><label>Tên task<input formControlName="title" placeholder="Việc cần hoàn thành" /></label><label>Thời lượng (phút)<input type="number" formControlName="estimatedMinutes" /></label><label>Priority<select formControlName="priority"><option value="0">P0 · Critical</option><option value="1">P1 · High</option><option value="2">P2 · Medium</option><option value="3">P3 · Low</option></select></label></div><div class="form-actions"><button class="secondary-button" type="button" (click)="showForm.set(false)">Hủy</button><button class="primary-button" type="submit" [disabled]="form.invalid">Thêm vào backlog</button></div></form>}
    <div class="task-toolbar"><div class="filter-tabs"><button class="filter-tab active" type="button">Tất cả <span>{{ store.tasks().length }}</span></button><button class="filter-tab" type="button">Đang làm <span>{{ store.openTasks().length }}</span></button><button class="filter-tab" type="button">Đã xong <span>{{ store.completedTasks().length }}</span></button></div><div class="toolbar-note">{{ overdueCount() }} task cần chú ý · <span>Hôm nay</span></div></div>
    <section class="task-list">@for (task of store.tasks(); track task.id) {<article class="task-row" [class.task-done]="task.status === 'done'"><button class="check-button" type="button" [class.checked]="task.status === 'done'" (click)="toggle(task)">{{ task.status === 'done' ? '✓' : '' }}</button><div class="task-content"><div class="task-title-line"><strong>{{ task.title }}</strong><span class="priority-text" [class]="priorityClass(task.priority)">P{{ task.priority }}</span></div><p>{{ task.description || 'Chưa có mô tả · thêm context khi cần.' }}</p><div class="task-meta"><span>◷ {{ task.estimatedMinutes }} phút</span><span>⌁ {{ areaName(task.lifeAreaId) }}</span>@if (task.deadline) {<span [class.overdue]="isOverdue(task)">⌛ {{ dueLabel(task.deadline) }}</span>}</div></div><span class="task-status" [class]="task.status">{{ statusLabel(task.status) }}</span><a class="row-action" routerLink="/app/focus">Focus →</a></article>}</section>
  `,
})
export class TasksPage {
  private readonly fb = inject(FormBuilder);
  readonly showForm = signal(false);
  readonly form = this.fb.nonNullable.group({ title: ['', Validators.required], estimatedMinutes: [30, [Validators.required, Validators.min(5)]], priority: ['2', Validators.required] });
  constructor(readonly store: WorkspaceStore) {}
  createTask(): void { if (this.form.invalid) return; const value = this.form.getRawValue(); this.store.addTask({ title: value.title, estimatedMinutes: Number(value.estimatedMinutes), priority: Number(value.priority) as Task['priority'], lifeAreaId: 'area-learning' }); this.form.reset({ title: '', estimatedMinutes: 30, priority: '2' }); this.showForm.set(false); }
  toggle(task: Task): void { this.store.setTaskStatus(task.id, task.status === 'done' ? 'backlog' : 'done'); }
  areaName(id?: string): string { return this.store.lifeAreas().find((area) => area.id === id)?.name ?? 'General'; }
  priorityClass(priority: number): string { return priority === 0 ? 'p0' : priority === 1 ? 'p1' : 'p2'; }
  statusLabel(status: Task['status']): string { return ({ backlog: 'Backlog', planned: 'Đã xếp', in_progress: 'Đang làm', done: 'Hoàn tất', skipped: 'Bỏ qua', cancelled: 'Đã hủy' })[status]; }
  isOverdue(task: Task): boolean { return Boolean(task.deadline && Date.parse(task.deadline) < Date.now() && task.status !== 'done'); }
  dueLabel(deadline: string): string { return this.isOverdue({ deadline, status: 'backlog' } as Task) ? 'Quá hạn' : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(deadline)); }
  overdueCount(): number { return this.store.openTasks().filter((task) => this.isOverdue(task)).length; }
}

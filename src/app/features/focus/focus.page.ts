import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { FocusSession, Task } from '../../shared/models/domain';

@Component({
  selector: 'app-focus-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header"><div><div class="eyebrow">DEEP WORK MODE</div><h1>Focus <em>một việc.</em></h1><p class="page-subtitle">Tạo không gian để việc quan trọng được hoàn thành.</p></div><span class="mode-pill">{{ activeSession() ? '● ĐANG CHẠY' : 'IDLE' }}</span></div>
    <div class="focus-layout"><section class="focus-timer panel"><div class="timer-orbit"><div class="timer-core"><span>{{ formattedTime() }}</span><small>{{ activeTask()?.title || 'Chọn task để bắt đầu' }}</small></div></div><div class="timer-modes"><button class="timer-mode active" type="button">25 / 5</button><button class="timer-mode" type="button">50 / 10</button><button class="timer-mode" type="button">Custom</button></div><div class="timer-actions">@if (!activeSession()) {<button class="primary-button timer-start" type="button" (click)="start()">Bắt đầu session <span>→</span></button>} @else {<button class="primary-button timer-start" type="button" (click)="stop()">Kết thúc session <span>✓</span></button>}</div><p class="timer-note">Thời lượng cuối cùng được xác minh từ timestamp server.</p></section><section class="focus-queue"><div class="card-kicker">FOCUS QUEUE</div><h3>Việc tiếp theo</h3>@for (task of focusTasks(); track task.id) {<button class="focus-task" type="button" [class.selected]="activeTask()?.id === task.id" (click)="selectedTaskId.set(task.id)"><span class="priority-text" [class]="'p' + task.priority">P{{ task.priority }}</span><span><strong>{{ task.title }}</strong><small>{{ task.estimatedMinutes - task.actualMinutes }} phút còn lại</small></span><span>→</span></button>}<a class="text-link" routerLink="/app/tasks">Quản lý task →</a></section></div>
  `,
})
export class FocusPage implements OnDestroy {
  readonly selectedTaskId = signal('task-rpc');
  readonly activeSession = signal<FocusSession | undefined>(undefined);
  readonly elapsedSeconds = signal(0);
  private interval?: ReturnType<typeof setInterval>;
  constructor(readonly store: WorkspaceStore) {}
  focusTasks(): Task[] { return this.store.openTasks().slice(0, 4); }
  activeTask(): Task | undefined { return this.store.tasks().find((task) => task.id === this.selectedTaskId()); }
  formattedTime(): string { const seconds = this.elapsedSeconds(); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  start(): void { const session = this.store.startFocus(this.selectedTaskId()); this.activeSession.set(session); this.elapsedSeconds.set(0); this.interval = setInterval(() => this.elapsedSeconds.update((value) => value + 1), 1000); }
  stop(): void { const session = this.activeSession(); if (!session) return; this.store.completeFocus(session.id); this.activeSession.set(undefined); if (this.interval) clearInterval(this.interval); }
  ngOnDestroy(): void { if (this.interval) clearInterval(this.interval); }
}

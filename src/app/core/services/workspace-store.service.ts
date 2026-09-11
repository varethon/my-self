import { Injectable, computed, signal } from '@angular/core';
import { CalendarEvent, FocusSession, Goal, Habit, LifeArea, Milestone, MonthlyPlan, Task, WorkspaceSnapshot } from '../../shared/models/domain';
import { overlaps } from '../../shared/utils/scheduler';

const STORAGE_KEY = 'varethon_ascend_workspace_v1';

const uid = (): string => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialState: WorkspaceSnapshot = {
  lifeAreas: [
    { id: 'area-learning', name: 'Học tập', description: 'Kỹ năng và kiến thức dài hạn', icon: '◈', colorKey: 'violet', priority: 1, isActive: true },
    { id: 'area-cyber', name: 'Cybersecurity', description: 'Labs, nền tảng và thực chiến', icon: '⌁', colorKey: 'cyan', priority: 0, isActive: true },
    { id: 'area-health', name: 'Sức khỏe', description: 'Năng lượng cho hành trình dài', icon: '✦', colorKey: 'lime', priority: 2, isActive: true },
  ],
  goals: [
    { id: 'goal-ship', title: 'Ship VARETHON ASCEND', description: 'Xây hệ thống goal → plan → schedule → review.', why: 'Tạo một workspace thực sự giúp mình tiến bộ.', lifeAreaId: 'area-cyber', startDate: '2026-09-01', targetDate: '2026-12-31', priority: 0, status: 'active', progress: 64, milestones: [] },
    { id: 'goal-english', title: 'Nâng English lên mức làm việc tự tin', description: 'Duy trì nhịp học nhỏ nhưng đều.', why: 'Mở rộng cơ hội học và làm việc.', lifeAreaId: 'area-learning', startDate: '2026-08-01', targetDate: '2027-06-30', priority: 1, status: 'active', progress: 38, milestones: [] },
  ],
  monthlyPlans: [{ id: 'plan-2026-09', year: 2026, month: 9, status: 'open', monthlyGoals: [{ id: 'mg-focus', title: 'Hoàn thành nền tảng planning core', goalId: 'goal-ship', estimatedMinutes: 1200, progress: 72, priority: 0 }, { id: 'mg-english', title: 'Duy trì 20 giờ English', goalId: 'goal-english', targetValue: 20, unit: 'giờ', estimatedMinutes: 1200, progress: 42, priority: 1 }] }],
  tasks: [
    { id: 'task-rpc', title: 'Review atomic approval RPC', description: 'Kiểm tra ownership, conflict và rollback.', goalId: 'goal-ship', monthlyGoalId: 'mg-focus', lifeAreaId: 'area-cyber', priority: 0, deadline: '2026-09-12T17:00:00+07:00', estimatedMinutes: 90, actualMinutes: 30, difficulty: 4, energyRequired: 3, status: 'in_progress', isSplittable: false, minSessionMinutes: 45, maxSessionMinutes: 120 },
    { id: 'task-ui', title: 'Polish mobile calendar', description: 'Giảm friction trên màn hình 360px.', goalId: 'goal-ship', monthlyGoalId: 'mg-focus', lifeAreaId: 'area-cyber', priority: 1, deadline: '2026-09-15T18:00:00+07:00', estimatedMinutes: 120, actualMinutes: 0, difficulty: 3, energyRequired: 2, status: 'planned', isSplittable: true, minSessionMinutes: 30, maxSessionMinutes: 60 },
    { id: 'task-english', title: 'English listening shadowing', description: 'Một session 30 phút, tập trung vào nhịp nói.', goalId: 'goal-english', monthlyGoalId: 'mg-english', lifeAreaId: 'area-learning', priority: 2, deadline: '2026-09-13T21:00:00+07:00', estimatedMinutes: 30, actualMinutes: 0, difficulty: 2, energyRequired: 1, status: 'backlog', isSplittable: false, minSessionMinutes: 30, maxSessionMinutes: 30 },
    { id: 'task-done', title: 'Define domain model', description: '', goalId: 'goal-ship', monthlyGoalId: 'mg-focus', lifeAreaId: 'area-cyber', priority: 1, estimatedMinutes: 60, actualMinutes: 60, difficulty: 2, energyRequired: 2, status: 'done', isSplittable: false, minSessionMinutes: 30, maxSessionMinutes: 60 },
  ],
  events: [
    { id: 'event-deep-work', title: 'Deep work · planning core', description: 'Locked focus block', eventType: 'study', source: 'manual', startAt: '2026-09-11T13:30:00+07:00', endAt: '2026-09-11T15:00:00+07:00', isLocked: true, isFlexible: false, blocksTime: true, status: 'active' },
    { id: 'event-sleep', title: 'Ngủ', eventType: 'sleep', source: 'system', startAt: '2026-09-11T23:00:00+07:00', endAt: '2026-09-12T06:30:00+07:00', isLocked: true, isFlexible: false, blocksTime: true, status: 'active' },
  ],
  habits: [
    { id: 'habit-reading', title: 'Đọc / học 30 phút', frequency: 'Mỗi ngày', targetMinutes: 30, currentStreak: 6, completedToday: true, colorKey: 'violet' },
    { id: 'habit-health', title: 'Vận động nhẹ', frequency: '5 ngày / tuần', targetMinutes: 20, currentStreak: 3, completedToday: false, colorKey: 'lime' },
  ],
  focusSessions: [],
};

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  readonly lifeAreas = signal<LifeArea[]>([]);
  readonly goals = signal<Goal[]>([]);
  readonly monthlyPlans = signal<MonthlyPlan[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly events = signal<CalendarEvent[]>([]);
  readonly habits = signal<Habit[]>([]);
  readonly focusSessions = signal<FocusSession[]>([]);
  readonly openTasks = computed(() => this.tasks().filter((task) => !['done', 'cancelled', 'skipped'].includes(task.status)));
  readonly completedTasks = computed(() => this.tasks().filter((task) => task.status === 'done'));
  readonly totalFocusMinutes = computed(() => Math.round(this.focusSessions().reduce((total, session) => total + session.durationSeconds, 0) / 60));

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const state = stored ? this.parse(stored) : initialState;
    this.setState(state);
  }

  addGoal(input: Pick<Goal, 'title' | 'description' | 'targetDate' | 'lifeAreaId' | 'priority'>): Goal {
    const goal: Goal = { ...input, id: uid(), why: '', startDate: new Date().toISOString().slice(0, 10), status: 'active', progress: 0, milestones: [] };
    this.goals.update((items) => [goal, ...items]);
    this.persist();
    return goal;
  }

  addMilestone(goalId: string, title = 'Milestone mới'): Milestone | undefined {
    const goal = this.goals().find((item) => item.id === goalId);
    if (!goal) return undefined;
    const milestone: Milestone = { id: uid(), goalId, title, targetDate: goal.targetDate, weight: 1, completed: false };
    this.goals.update((items) => items.map((item) => item.id === goalId ? { ...item, milestones: [...item.milestones, milestone] } : item));
    this.persist();
    return milestone;
  }

  addTask(input: Pick<Task, 'title' | 'estimatedMinutes' | 'priority' | 'lifeAreaId'>): Task {
    const task: Task = { ...input, id: uid(), description: '', actualMinutes: 0, difficulty: 3, energyRequired: 2, status: 'backlog', isSplittable: true, minSessionMinutes: 25, maxSessionMinutes: 90 };
    this.tasks.update((items) => [task, ...items]);
    this.persist();
    return task;
  }

  setTaskStatus(id: string, status: Task['status']): void {
    this.tasks.update((items) => items.map((task) => task.id === id ? { ...task, status } : task));
    this.persist();
  }

  addEvent(input: Omit<CalendarEvent, 'id' | 'status'>): { event?: CalendarEvent; conflict?: CalendarEvent } {
    const conflict = this.events().find((event) => event.status === 'active' && event.blocksTime && input.blocksTime && overlaps(input, event));
    if (conflict) return { conflict };
    const event: CalendarEvent = { ...input, id: uid(), status: 'active' };
    this.events.update((items) => [event, ...items]);
    this.persist();
    return { event };
  }

  removeEvent(id: string): void {
    this.events.update((items) => items.map((event) => event.id === id ? { ...event, status: 'cancelled' } : event));
    this.persist();
  }

  toggleHabit(id: string): void {
    this.habits.update((items) => items.map((habit) => habit.id === id ? { ...habit, completedToday: !habit.completedToday, currentStreak: habit.completedToday ? Math.max(habit.currentStreak - 1, 0) : habit.currentStreak + 1 } : habit));
    this.persist();
  }

  startFocus(taskId?: string): FocusSession {
    const session: FocusSession = { id: uid(), taskId, startedAt: new Date().toISOString(), status: 'running', durationSeconds: 0 };
    this.focusSessions.update((items) => [session, ...items]);
    this.persist();
    return session;
  }

  completeFocus(id: string): void {
    this.focusSessions.update((items) => items.map((session) => session.id === id ? { ...session, endedAt: new Date().toISOString(), status: 'completed', durationSeconds: Math.max(Math.round((Date.now() - Date.parse(session.startedAt)) / 1000), 60) } : session));
    this.persist();
  }

  refresh(): void {
    this.persist();
  }

  private setState(state: WorkspaceSnapshot): void {
    this.lifeAreas.set(state.lifeAreas); this.goals.set(state.goals); this.monthlyPlans.set(state.monthlyPlans); this.tasks.set(state.tasks); this.events.set(state.events); this.habits.set(state.habits); this.focusSessions.set(state.focusSessions);
  }

  private persist(): void {
    const snapshot: WorkspaceSnapshot = { lifeAreas: this.lifeAreas(), goals: this.goals(), monthlyPlans: this.monthlyPlans(), tasks: this.tasks(), events: this.events(), habits: this.habits(), focusSessions: this.focusSessions() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  private parse(value: string): WorkspaceSnapshot {
    try {
      const parsed = JSON.parse(value) as WorkspaceSnapshot;
      return parsed.lifeAreas && parsed.tasks && parsed.events ? parsed : initialState;
    } catch {
      return initialState;
    }
  }

}

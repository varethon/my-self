import { Injectable, computed, signal } from '@angular/core';
import { CalendarEvent, FocusSession, Goal, Habit, LifeArea, Milestone, MonthlyPlan, Task, WorkspaceSnapshot } from '../../shared/models/domain';
import { overlaps } from '../../shared/utils/scheduler';
import { getSupabaseClient } from '../../data-access/supabase/supabase.client';

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

const emptyState: WorkspaceSnapshot = { lifeAreas: [], goals: [], monthlyPlans: [], tasks: [], events: [], habits: [], focusSessions: [] };

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly remote = getSupabaseClient();
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
    if (this.remote) {
      this.setState(emptyState);
      void this.hydrateRemote();
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    const state = stored ? this.parse(stored) : initialState;
    this.setState(state);
  }

  addGoal(input: Pick<Goal, 'title' | 'description' | 'targetDate' | 'lifeAreaId' | 'priority'>): Goal {
    const goal: Goal = { ...input, id: uid(), why: '', startDate: new Date().toISOString().slice(0, 10), status: 'active', progress: 0, milestones: [] };
    this.goals.update((items) => [goal, ...items]);
    if (this.remote) void this.remote.from('goals').insert({ id: goal.id, life_area_id: goal.lifeAreaId, title: goal.title, description: goal.description, why: goal.why, start_date: goal.startDate, target_date: goal.targetDate, priority: goal.priority, status: goal.status, progress: goal.progress });
    this.persist();
    return goal;
  }

  addMilestone(goalId: string, title = 'Milestone mới'): Milestone | undefined {
    const goal = this.goals().find((item) => item.id === goalId);
    if (!goal) return undefined;
    const milestone: Milestone = { id: uid(), goalId, title, targetDate: goal.targetDate, weight: 1, completed: false };
    this.goals.update((items) => items.map((item) => item.id === goalId ? { ...item, milestones: [...item.milestones, milestone] } : item));
    if (this.remote) void this.remote.from('goal_milestones').insert({ id: milestone.id, goal_id: milestone.goalId, title: milestone.title, due_date: milestone.targetDate, sort_order: goal.milestones.length });
    this.persist();
    return milestone;
  }

  addTask(input: Pick<Task, 'title' | 'estimatedMinutes' | 'priority' | 'lifeAreaId'>): Task {
    const task: Task = { ...input, id: uid(), description: '', actualMinutes: 0, difficulty: 3, energyRequired: 2, status: 'backlog', isSplittable: true, minSessionMinutes: 25, maxSessionMinutes: 90 };
    this.tasks.update((items) => [task, ...items]);
    if (this.remote) void this.remote.from('tasks').insert({ id: task.id, goal_id: task.goalId, monthly_goal_id: task.monthlyGoalId, life_area_id: task.lifeAreaId, title: task.title, description: task.description, priority: task.priority, estimated_minutes: task.estimatedMinutes, actual_minutes: task.actualMinutes, difficulty: task.difficulty, energy_required: task.energyRequired, status: task.status, is_splittable: task.isSplittable, min_session_minutes: task.minSessionMinutes, max_session_minutes: task.maxSessionMinutes });
    this.persist();
    return task;
  }

  setTaskStatus(id: string, status: Task['status']): void {
    this.tasks.update((items) => items.map((task) => task.id === id ? { ...task, status } : task));
    if (this.remote) void this.remote.from('tasks').update({ status }).eq('id', id);
    this.persist();
  }

  addEvent(input: Omit<CalendarEvent, 'id' | 'status'>): { event?: CalendarEvent; conflict?: CalendarEvent } {
    const conflict = this.events().find((event) => event.status === 'active' && event.blocksTime && input.blocksTime && overlaps(input, event));
    if (conflict) return { conflict };
    const event: CalendarEvent = { ...input, id: uid(), status: 'active' };
    this.events.update((items) => [event, ...items]);
    if (this.remote) void this.remote.from('calendar_events').insert({ id: event.id, task_id: event.taskId, title: event.title, description: event.description ?? '', event_type: event.eventType, source: event.source, start_at: event.startAt, end_at: event.endAt, is_locked: event.isLocked, is_flexible: event.isFlexible, blocks_time: event.blocksTime, status: event.status });
    this.persist();
    return { event };
  }

  removeEvent(id: string): void {
    this.events.update((items) => items.map((event) => event.id === id ? { ...event, status: 'cancelled' } : event));
    if (this.remote) void this.remote.from('calendar_events').update({ status: 'cancelled' }).eq('id', id);
    this.persist();
  }

  toggleHabit(id: string): void {
    this.habits.update((items) => items.map((habit) => habit.id === id ? { ...habit, completedToday: !habit.completedToday, currentStreak: habit.completedToday ? Math.max(habit.currentStreak - 1, 0) : habit.currentStreak + 1 } : habit));
    if (this.remote) void this.remote.from('habit_logs').upsert({ habit_id: id, log_date: new Date().toISOString().slice(0, 10), completed: true }, { onConflict: 'habit_id,log_date' });
    this.persist();
  }

  startFocus(taskId?: string): FocusSession {
    const session: FocusSession = { id: uid(), taskId, startedAt: new Date().toISOString(), status: 'running', durationSeconds: 0 };
    this.focusSessions.update((items) => [session, ...items]);
    if (this.remote) void this.remote.from('focus_sessions').insert({ id: session.id, task_id: taskId, started_at: session.startedAt, status: session.status });
    this.persist();
    return session;
  }

  completeFocus(id: string): void {
    this.focusSessions.update((items) => items.map((session) => session.id === id ? { ...session, endedAt: new Date().toISOString(), status: 'completed', durationSeconds: Math.max(Math.round((Date.now() - Date.parse(session.startedAt)) / 1000), 60) } : session));
    if (this.remote) void this.remote.rpc('complete_focus_session', { p_session_id: id });
    this.persist();
  }

  async refresh(): Promise<void> {
    await this.hydrateRemote();
  }

  private setState(state: WorkspaceSnapshot): void {
    this.lifeAreas.set(state.lifeAreas); this.goals.set(state.goals); this.monthlyPlans.set(state.monthlyPlans); this.tasks.set(state.tasks); this.events.set(state.events); this.habits.set(state.habits); this.focusSessions.set(state.focusSessions);
  }

  private persist(): void {
    if (this.remote) return;
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

  private async hydrateRemote(): Promise<void> {
    if (!this.remote) return;
    const [areas, goals, milestones, plans, monthlyGoals, tasks, events, habits, sessions] = await Promise.all([
      this.remote.from('life_areas').select('*').eq('is_active', true).order('priority'),
      this.remote.from('goals').select('*').order('priority').order('target_date'),
      this.remote.from('goal_milestones').select('*').order('sort_order'),
      this.remote.from('monthly_plans').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
      this.remote.from('monthly_goals').select('*').order('priority'),
      this.remote.from('tasks').select('*').order('priority').order('deadline', { ascending: true, nullsFirst: false }),
      this.remote.from('calendar_events').select('*').eq('status', 'active').order('start_at'),
      this.remote.from('habits').select('*').eq('is_active', true),
      this.remote.from('focus_sessions').select('*').order('started_at', { ascending: false }).limit(100),
    ]);
    type Row = { [key: string]: unknown };
    const areaRows = (areas.data ?? []) as unknown as Row[];
    const milestoneRows = (milestones.data ?? []) as unknown as Row[];
    const goalRows = (goals.data ?? []) as unknown as Row[];
    const planRows = (plans.data ?? []) as unknown as Row[];
    const monthlyGoalRows = (monthlyGoals.data ?? []) as unknown as Row[];
    const taskRows = (tasks.data ?? []) as unknown as Row[];
    const eventRows = (events.data ?? []) as unknown as Row[];
    const habitRows = (habits.data ?? []) as unknown as Row[];
    const sessionRows = (sessions.data ?? []) as unknown as Row[];
    const value = (row: Row, key: string): unknown => row[key];
    const text = (row: Row, key: string, fallback = ''): string => String(value(row, key) ?? fallback);
    const number = (row: Row, key: string, fallback = 0): number => Number(value(row, key) ?? fallback);
    const bool = (row: Row, key: string, fallback = false): boolean => Boolean(value(row, key) ?? fallback);
    const mappedAreas: LifeArea[] = areaRows.map((row) => ({ id: text(row, 'id'), name: text(row, 'name'), description: text(row, 'description'), icon: text(row, 'icon', '◎'), colorKey: text(row, 'color_key', 'cyan'), priority: number(row, 'priority') as LifeArea['priority'], isActive: bool(row, 'is_active', true) }));
    const mappedMilestones = (goalId: string): Milestone[] => milestoneRows.filter((row) => text(row, 'goal_id') === goalId).map((row) => ({ id: text(row, 'id'), goalId, title: text(row, 'title'), targetDate: text(row, 'due_date'), weight: 1, completed: text(row, 'status') === 'done' }));
    const mappedGoals: Goal[] = goalRows.map((row) => ({ id: text(row, 'id'), title: text(row, 'title'), description: text(row, 'description'), why: text(row, 'why'), lifeAreaId: text(row, 'life_area_id'), startDate: text(row, 'start_date'), targetDate: text(row, 'target_date'), priority: number(row, 'priority') as Goal['priority'], status: text(row, 'status') as Goal['status'], progress: number(row, 'progress'), milestones: mappedMilestones(text(row, 'id')) }));
    const mappedPlans: MonthlyPlan[] = planRows.map((row) => ({ id: text(row, 'id'), year: number(row, 'year'), month: number(row, 'month'), status: text(row, 'status') as MonthlyPlan['status'], monthlyGoals: monthlyGoalRows.filter((goal) => text(goal, 'monthly_plan_id') === text(row, 'id')).map((goal) => ({ id: text(goal, 'id'), title: text(goal, 'title'), goalId: text(goal, 'goal_id') || undefined, targetValue: value(goal, 'target_value') as number | undefined, unit: value(goal, 'unit') as string | undefined, estimatedMinutes: number(goal, 'estimated_minutes'), progress: number(goal, 'progress'), priority: number(goal, 'priority') as Task['priority'] })) }));
    const mappedTasks: Task[] = taskRows.map((row) => ({ id: text(row, 'id'), title: text(row, 'title'), description: text(row, 'description'), goalId: text(row, 'goal_id') || undefined, monthlyGoalId: text(row, 'monthly_goal_id') || undefined, lifeAreaId: text(row, 'life_area_id') || undefined, priority: number(row, 'priority') as Task['priority'], deadline: text(row, 'deadline') || undefined, estimatedMinutes: number(row, 'estimated_minutes'), actualMinutes: number(row, 'actual_minutes'), difficulty: number(row, 'difficulty') as Task['difficulty'], energyRequired: number(row, 'energy_required') as Task['energyRequired'], status: text(row, 'status') as Task['status'], isSplittable: bool(row, 'is_splittable', true), minSessionMinutes: number(row, 'min_session_minutes', 25), maxSessionMinutes: number(row, 'max_session_minutes', 90) }));
    const mappedEvents: CalendarEvent[] = eventRows.map((row) => ({ id: text(row, 'id'), taskId: text(row, 'task_id') || undefined, title: text(row, 'title'), description: text(row, 'description'), eventType: text(row, 'event_type') as CalendarEvent['eventType'], source: text(row, 'source') as CalendarEvent['source'], startAt: text(row, 'start_at'), endAt: text(row, 'end_at'), isLocked: bool(row, 'is_locked'), isFlexible: bool(row, 'is_flexible', true), blocksTime: bool(row, 'blocks_time', true), status: text(row, 'status') as CalendarEvent['status'] }));
    const mappedHabits: Habit[] = habitRows.map((row) => ({ id: text(row, 'id'), title: text(row, 'title'), frequency: text(row, 'frequency'), targetMinutes: number(row, 'target_minutes'), currentStreak: 0, completedToday: false, colorKey: text(row, 'color_key', 'cyan') }));
    const mappedSessions: FocusSession[] = sessionRows.map((row) => ({ id: text(row, 'id'), taskId: text(row, 'task_id') || undefined, startedAt: text(row, 'started_at'), endedAt: text(row, 'ended_at') || undefined, status: text(row, 'status') as FocusSession['status'], durationSeconds: number(row, 'duration_seconds') }));
    this.setState({ lifeAreas: mappedAreas, goals: mappedGoals, monthlyPlans: mappedPlans, tasks: mappedTasks, events: mappedEvents, habits: mappedHabits, focusSessions: mappedSessions });
  }
}

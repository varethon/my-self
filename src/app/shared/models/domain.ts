export type Priority = 0 | 1 | 2 | 3;
export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type TaskStatus = 'backlog' | 'planned' | 'in_progress' | 'done' | 'skipped' | 'cancelled';
export type EventType = 'fixed_commitment' | 'study' | 'work' | 'personal' | 'sleep' | 'focus' | 'break' | 'other';
export type EventSource = 'manual' | 'ai' | 'recurrence' | 'system';

export interface LifeArea {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorKey: string;
  priority: Priority;
  isActive: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  why: string;
  lifeAreaId: string;
  startDate: string;
  targetDate: string;
  priority: Priority;
  status: GoalStatus;
  progress: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetDate: string;
  weight: number;
  completed: boolean;
}

export interface MonthlyGoal {
  id: string;
  title: string;
  goalId?: string;
  targetValue?: number;
  unit?: string;
  estimatedMinutes: number;
  progress: number;
  priority: Priority;
}

export interface MonthlyPlan {
  id: string;
  year: number;
  month: number;
  status: 'open' | 'closed';
  monthlyGoals: MonthlyGoal[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  goalId?: string;
  monthlyGoalId?: string;
  lifeAreaId?: string;
  priority: Priority;
  deadline?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  energyRequired: 1 | 2 | 3;
  status: TaskStatus;
  isSplittable: boolean;
  minSessionMinutes: number;
  maxSessionMinutes: number;
}

export interface CalendarEvent {
  id: string;
  taskId?: string;
  title: string;
  description?: string;
  eventType: EventType;
  source: EventSource;
  startAt: string;
  endAt: string;
  isLocked: boolean;
  isFlexible: boolean;
  blocksTime: boolean;
  status: 'active' | 'cancelled';
  proposalId?: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: string;
  targetMinutes?: number;
  currentStreak: number;
  completedToday: boolean;
  colorKey: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  durationSeconds: number;
}

export interface WorkspaceSnapshot {
  lifeAreas: LifeArea[];
  goals: Goal[];
  monthlyPlans: MonthlyPlan[];
  tasks: Task[];
  events: CalendarEvent[];
  habits: Habit[];
  focusSessions: FocusSession[];
}

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

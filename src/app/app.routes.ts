import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginPage } from './features/auth/login.page';
import { WorkspaceShell } from './core/layout/workspace-shell';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { GoalsPage } from './features/goals/goals.page';
import { PlanningPage } from './features/monthly-plan/planning.page';
import { TasksPage } from './features/tasks/tasks.page';
import { CalendarPage } from './features/calendar/calendar.page';
import { HabitsPage } from './features/habits/habits.page';
import { FocusPage } from './features/focus/focus.page';
import { LearningPage } from './features/learning/learning.page';
import { CoursesPage } from './features/courses/courses.page';
import { ReviewsPage } from './features/reviews/reviews.page';
import { AnalyticsPage } from './features/analytics/analytics.page';
import { AiPage } from './features/ai-coach/ai.page';
import { SettingsPage } from './features/settings/settings.page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'onboarding', redirectTo: 'app/dashboard', pathMatch: 'full' },
  {
    path: 'app', component: WorkspaceShell, canActivate: [authGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPage },
      { path: 'goals', component: GoalsPage },
      { path: 'month', component: PlanningPage },
      { path: 'tasks', component: TasksPage },
      { path: 'calendar', component: CalendarPage },
      { path: 'habits', component: HabitsPage },
      { path: 'focus', component: FocusPage },
      { path: 'learning', component: LearningPage },
      { path: 'courses', component: CoursesPage },
      { path: 'reviews', component: ReviewsPage },
      { path: 'analytics', component: AnalyticsPage },
      { path: 'ai', component: AiPage },
      { path: 'settings', component: SettingsPage },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app/dashboard' },
  { path: '**', redirectTo: 'app/dashboard' },
];

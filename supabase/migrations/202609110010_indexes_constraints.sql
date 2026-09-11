alter table public.calendar_events drop constraint if exists calendar_events_no_overlap;
alter table public.calendar_events add constraint calendar_events_no_overlap
  exclude using gist (
    user_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status = 'active' and blocks_time);

create index if not exists life_areas_user_active_idx on public.life_areas (user_id, is_active, priority);
create index if not exists goals_user_status_idx on public.goals (user_id, status, priority, target_date);
create index if not exists milestones_goal_order_idx on public.goal_milestones (goal_id, sort_order);
create index if not exists monthly_plans_user_period_idx on public.monthly_plans (user_id, year, month);
create index if not exists monthly_goals_plan_priority_idx on public.monthly_goals (monthly_plan_id, priority);
create index if not exists tasks_user_status_deadline_idx on public.tasks (user_id, status, deadline);
create index if not exists tasks_goal_idx on public.tasks (goal_id, monthly_goal_id);
create index if not exists calendar_events_user_start_idx on public.calendar_events (user_id, start_at) where status = 'active';
create index if not exists recurrence_event_idx on public.recurrence_rules (event_id);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, log_date desc);
create index if not exists focus_sessions_user_started_idx on public.focus_sessions (user_id, started_at desc);
create index if not exists roadmap_nodes_roadmap_order_idx on public.roadmap_nodes (roadmap_id, sort_order);
create index if not exists resources_node_idx on public.resources (node_id);
create index if not exists ai_requests_user_created_idx on public.ai_requests (user_id, created_at desc);
create index if not exists ai_batches_user_status_idx on public.ai_schedule_batches (user_id, status, created_at desc);
create index if not exists ai_proposals_batch_idx on public.ai_schedule_proposals (batch_id, status, start_at);
create index if not exists audit_events_user_created_idx on public.audit_events (user_id, created_at desc);

create or replace function public.mark_milestone_completed()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'done' and old.status <> 'done' then new.completed_at = coalesce(new.completed_at, timezone('utc', now())); end if;
  if new.status <> 'done' then new.completed_at = null; end if;
  return new;
end;
$$;

drop trigger if exists milestone_completion on public.goal_milestones;
create trigger milestone_completion before update on public.goal_milestones for each row execute function public.mark_milestone_completed();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists profiles_owner on public.profiles;
create policy profiles_owner on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists preferences_owner on public.user_preferences;
create policy preferences_owner on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'life_areas', 'goals', 'goal_milestones', 'monthly_plans', 'monthly_goals',
    'tasks', 'calendar_events', 'recurrence_rules', 'habits', 'habit_logs',
    'focus_sessions', 'learning_roadmaps', 'roadmap_nodes', 'resources',
    'weekly_reviews', 'monthly_reviews', 'ai_requests', 'ai_schedule_batches',
    'ai_schedule_proposals', 'audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I_owner on public.%I', table_name, table_name);
    execute format('create policy %I_owner on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', table_name, table_name);
  end loop;
end $$;

create or replace function public.guard_relationship_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referenced_user uuid;
begin
  if tg_table_name = 'goals' and new.life_area_id is not null then
    select user_id into referenced_user from public.life_areas where id = new.life_area_id;
  elsif tg_table_name = 'goal_milestones' then
    select user_id into referenced_user from public.goals where id = new.goal_id;
  elsif tg_table_name = 'monthly_goals' then
    select user_id into referenced_user from public.monthly_plans where id = new.monthly_plan_id;
  elsif tg_table_name = 'tasks' then
    select user_id into referenced_user from public.goals where id = new.goal_id;
    if referenced_user is null and new.monthly_goal_id is not null then
      select user_id into referenced_user from public.monthly_goals where id = new.monthly_goal_id;
    end if;
    if referenced_user is null and new.life_area_id is not null then
      select user_id into referenced_user from public.life_areas where id = new.life_area_id;
    end if;
    if referenced_user is null and new.parent_task_id is not null then
      select user_id into referenced_user from public.tasks where id = new.parent_task_id;
    end if;
  elsif tg_table_name = 'calendar_events' and new.task_id is not null then
    select user_id into referenced_user from public.tasks where id = new.task_id;
  elsif tg_table_name = 'recurrence_rules' then
    select user_id into referenced_user from public.calendar_events where id = new.event_id;
  elsif tg_table_name = 'habit_logs' then
    select user_id into referenced_user from public.habits where id = new.habit_id;
  elsif tg_table_name = 'focus_sessions' and new.task_id is not null then
    select user_id into referenced_user from public.tasks where id = new.task_id;
  elsif tg_table_name = 'roadmap_nodes' then
    select user_id into referenced_user from public.learning_roadmaps where id = new.roadmap_id;
  elsif tg_table_name = 'resources' then
    select user_id into referenced_user from public.learning_roadmaps where id = new.roadmap_id;
    if referenced_user is null and new.node_id is not null then
      select user_id into referenced_user from public.roadmap_nodes where id = new.node_id;
    end if;
  elsif tg_table_name = 'ai_schedule_batches' and new.request_id is not null then
    select user_id into referenced_user from public.ai_requests where id = new.request_id;
  elsif tg_table_name = 'ai_schedule_proposals' then
    select user_id into referenced_user from public.ai_schedule_batches where id = new.batch_id;
    if referenced_user is null then
      select user_id into referenced_user from public.tasks where id = new.task_id;
    end if;
  end if;
  if referenced_user is not null and referenced_user <> new.user_id then
    raise exception 'referenced row belongs to another user';
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['goals', 'goal_milestones', 'monthly_goals', 'tasks', 'calendar_events', 'recurrence_rules', 'habit_logs', 'focus_sessions', 'roadmap_nodes', 'resources', 'ai_schedule_batches', 'ai_schedule_proposals'] loop
    execute format('drop trigger if exists %I_relationship_guard on public.%I', table_name, table_name);
    execute format('create trigger %I_relationship_guard before insert or update on public.%I for each row execute function public.guard_relationship_owner()', table_name, table_name);
  end loop;
end $$;

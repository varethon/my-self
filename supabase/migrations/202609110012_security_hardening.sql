create schema if not exists extensions;
create schema if not exists private;

alter extension btree_gist set schema extensions;

alter function public.set_updated_at() set schema private;
alter function public.guard_user_id() set schema private;
alter function public.handle_new_user() set schema private;
alter function public.guard_relationship_owner() set schema private;
alter function public.mark_milestone_completed() set schema private;

alter function public.create_default_workspace(uuid) security invoker;
revoke all on function public.create_default_workspace(uuid) from public;
grant execute on function public.create_default_workspace(uuid) to authenticated;

drop policy if exists profiles_owner on public.profiles;
create policy profiles_owner on public.profiles for all using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists preferences_owner on public.user_preferences;
create policy preferences_owner on public.user_preferences for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

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
    execute format('drop policy if exists %I_owner on public.%I', table_name, table_name);
    execute format('create policy %I_owner on public.%I for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', table_name, table_name);
  end loop;
end $$;

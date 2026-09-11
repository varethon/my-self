create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  monthly_goal_id uuid references public.monthly_goals(id) on delete set null,
  life_area_id uuid references public.life_areas(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null default '',
  priority smallint not null default 2 check (priority between 0 and 3),
  deadline timestamptz,
  estimated_minutes integer not null default 30 check (estimated_minutes between 1 and 10080),
  actual_minutes integer not null default 0 check (actual_minutes >= 0),
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  energy_required smallint not null default 2 check (energy_required between 1 and 5),
  status text not null default 'backlog' check (status in ('backlog', 'planned', 'in_progress', 'done', 'skipped', 'cancelled')),
  is_splittable boolean not null default true,
  min_session_minutes integer not null default 25 check (min_session_minutes between 5 and 1440),
  max_session_minutes integer not null default 90 check (max_session_minutes >= min_session_minutes),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null default '',
  event_type text not null default 'study' check (event_type in ('fixed_commitment', 'study', 'focus', 'habit', 'sleep', 'review', 'other')),
  source text not null default 'manual' check (source in ('manual', 'ai', 'system')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_locked boolean not null default false,
  is_flexible boolean not null default true,
  blocks_time boolean not null default true,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_at > start_at)
);

create table if not exists public.recurrence_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  interval_count smallint not null default 1 check (interval_count > 0),
  by_weekday smallint[] not null default '{}',
  until_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists tasks_user_guard on public.tasks;
create trigger tasks_user_guard before insert or update on public.tasks for each row execute function public.guard_user_id();
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists events_user_guard on public.calendar_events;
create trigger events_user_guard before insert or update on public.calendar_events for each row execute function public.guard_user_id();
drop trigger if exists events_updated_at on public.calendar_events;
create trigger events_updated_at before update on public.calendar_events for each row execute function public.set_updated_at();
drop trigger if exists recurrence_user_guard on public.recurrence_rules;
create trigger recurrence_user_guard before insert or update on public.recurrence_rules for each row execute function public.guard_user_id();
drop trigger if exists recurrence_updated_at on public.recurrence_rules;
create trigger recurrence_updated_at before update on public.recurrence_rules for each row execute function public.set_updated_at();

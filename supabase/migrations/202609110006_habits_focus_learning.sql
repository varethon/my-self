create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  frequency text not null default 'daily',
  target_minutes integer not null default 0 check (target_minutes >= 0),
  color_key text not null default 'cyan',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  value numeric,
  created_at timestamptz not null default timezone('utc', now()),
  unique (habit_id, log_date)
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  status text not null default 'running' check (status in ('running', 'completed', 'cancelled')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.learning_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null default '',
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.roadmap_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null references public.learning_roadmaps(id) on delete cascade,
  parent_node_id uuid references public.roadmap_nodes(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null default '',
  sort_order integer not null default 0,
  status text not null default 'next' check (status in ('next', 'current', 'done', 'skipped')),
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid references public.learning_roadmaps(id) on delete set null,
  node_id uuid references public.roadmap_nodes(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  url text not null check (url ~* '^https?://'),
  kind text not null default 'article',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['habits', 'focus_sessions', 'learning_roadmaps', 'roadmap_nodes', 'resources'] loop
    execute format('drop trigger if exists %I_user_guard on public.%I', table_name, table_name);
    execute format('create trigger %I_user_guard before insert or update on public.%I for each row execute function public.guard_user_id()', table_name, table_name);
    execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

drop trigger if exists habit_logs_user_guard on public.habit_logs;
create trigger habit_logs_user_guard before insert or update on public.habit_logs for each row execute function public.guard_user_id();

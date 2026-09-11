create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  life_area_id uuid references public.life_areas(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null default '',
  why text not null default '',
  start_date date not null default current_date,
  target_date date,
  priority smallint not null default 2 check (priority between 0 and 3),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (target_date is null or target_date >= start_date)
);

create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  due_date date,
  sort_order integer not null default 0,
  status text not null default 'open' check (status in ('open', 'done', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists goals_user_guard on public.goals;
create trigger goals_user_guard before insert or update on public.goals for each row execute function public.guard_user_id();
drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at before update on public.goals for each row execute function public.set_updated_at();
drop trigger if exists milestones_user_guard on public.goal_milestones;
create trigger milestones_user_guard before insert or update on public.goal_milestones for each row execute function public.guard_user_id();
drop trigger if exists milestones_updated_at on public.goal_milestones;
create trigger milestones_updated_at before update on public.goal_milestones for each row execute function public.set_updated_at();

create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year smallint not null check (year between 2000 and 2200),
  month smallint not null check (month between 1 and 12),
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  capacity_minutes integer not null default 0 check (capacity_minutes >= 0),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, year, month)
);

create table if not exists public.monthly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monthly_plan_id uuid not null references public.monthly_plans(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  target_value numeric,
  unit text,
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  priority smallint not null default 2 check (priority between 0 and 3),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists monthly_plans_user_guard on public.monthly_plans;
create trigger monthly_plans_user_guard before insert or update on public.monthly_plans for each row execute function public.guard_user_id();
drop trigger if exists monthly_plans_updated_at on public.monthly_plans;
create trigger monthly_plans_updated_at before update on public.monthly_plans for each row execute function public.set_updated_at();
drop trigger if exists monthly_goals_user_guard on public.monthly_goals;
create trigger monthly_goals_user_guard before insert or update on public.monthly_goals for each row execute function public.guard_user_id();
drop trigger if exists monthly_goals_updated_at on public.monthly_goals;
create trigger monthly_goals_updated_at before update on public.monthly_goals for each row execute function public.set_updated_at();

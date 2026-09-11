create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  wins text not null default '',
  adjustments text not null default '',
  completion_percent numeric(5,2) not null default 0 check (completion_percent between 0 and 100),
  focus_minutes integer not null default 0 check (focus_minutes >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, week_start)
);

create table if not exists public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year smallint not null,
  month smallint not null check (month between 1 and 12),
  wins text not null default '',
  adjustments text not null default '',
  completion_percent numeric(5,2) not null default 0 check (completion_percent between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, year, month)
);

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('schedule', 'breakdown', 'review', 'reschedule')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table if not exists public.ai_schedule_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.ai_requests(id) on delete set null,
  status text not null default 'preview' check (status in ('preview', 'accepted', 'rejected', 'stale')),
  generated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '30 minutes',
  input_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_schedule_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references public.ai_schedule_batches(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  candidate_id text not null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  score numeric(7,3) not null default 0,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'rejected', 'conflict')),
  created_at timestamptz not null default timezone('utc', now()),
  check (end_at > start_at),
  unique (batch_id, candidate_id)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['weekly_reviews', 'monthly_reviews', 'ai_schedule_batches'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

drop trigger if exists ai_request_user_guard on public.ai_requests;
create trigger ai_request_user_guard before insert or update on public.ai_requests for each row execute function public.guard_user_id();
drop trigger if exists ai_batch_user_guard on public.ai_schedule_batches;
create trigger ai_batch_user_guard before insert or update on public.ai_schedule_batches for each row execute function public.guard_user_id();
drop trigger if exists ai_proposal_user_guard on public.ai_schedule_proposals;
create trigger ai_proposal_user_guard before insert or update on public.ai_schedule_proposals for each row execute function public.guard_user_id();
drop trigger if exists audit_user_guard on public.audit_events;
create trigger audit_user_guard before insert or update on public.audit_events for each row execute function public.guard_user_id();

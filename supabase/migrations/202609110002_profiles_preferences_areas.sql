create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  day_start time not null default '08:00',
  day_end time not null default '20:00',
  planning_buffer_percent smallint not null default 20 check (planning_buffer_percent between 0 and 80),
  default_session_minutes smallint not null default 50 check (default_session_minutes between 15 and 240),
  ai_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.life_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text not null default '',
  icon text not null default '◎',
  color_key text not null default 'cyan',
  priority smallint not null default 2 check (priority between 0 and 3),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists preferences_updated_at on public.user_preferences;
create trigger preferences_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();
drop trigger if exists life_areas_user_guard on public.life_areas;
create trigger life_areas_user_guard before insert or update on public.life_areas for each row execute function public.guard_user_id();
drop trigger if exists life_areas_updated_at on public.life_areas;
create trigger life_areas_updated_at before update on public.life_areas for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

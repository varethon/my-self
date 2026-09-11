create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.guard_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;
  if auth.uid() is not null and new.user_id <> auth.uid() then
    raise exception 'user_id must match the authenticated user';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data ->> 'timezone', 'Asia/Ho_Chi_Minh'))
  on conflict (id) do nothing;
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

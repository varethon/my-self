create or replace function public.create_default_workspace(p_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or (auth.uid() is not null and p_user_id <> auth.uid()) then
    raise exception 'invalid workspace owner';
  end if;
  insert into public.profiles (id) values (p_user_id) on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (p_user_id) on conflict (user_id) do nothing;
  insert into public.life_areas (user_id, name, description, icon, color_key, priority)
  values
    (p_user_id, 'Học tập', 'Kỹ năng và kiến thức dài hạn', '◈', 'violet', 1),
    (p_user_id, 'Công việc', 'Những kết quả quan trọng', '⌁', 'cyan', 0),
    (p_user_id, 'Sức khỏe', 'Năng lượng cho hành trình dài', '✦', 'lime', 2)
  on conflict (user_id, name) do nothing;
end;
$$;

revoke all on function public.create_default_workspace(uuid) from public;
grant execute on function public.create_default_workspace(uuid) to authenticated;

create or replace function public.accept_ai_schedule_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  batch_row public.ai_schedule_batches%rowtype;
  proposal_row public.ai_schedule_proposals%rowtype;
  inserted_count integer := 0;
  event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':calendar', 0));
  select * into batch_row from public.ai_schedule_batches where id = p_batch_id and user_id = auth.uid() for update;
  if not found then raise exception 'schedule batch not found'; end if;
  if batch_row.status <> 'preview' then raise exception 'schedule batch is no longer previewable'; end if;
  if batch_row.expires_at <= timezone('utc', now()) then
    update public.ai_schedule_batches set status = 'stale' where id = p_batch_id;
    raise exception 'schedule proposal expired';
  end if;

  for proposal_row in select * from public.ai_schedule_proposals where batch_id = p_batch_id and user_id = auth.uid() and status = 'proposed' order by start_at for update loop
    if exists (
      select 1 from public.calendar_events event
      where event.user_id = auth.uid() and event.status = 'active' and event.blocks_time
        and tstzrange(event.start_at, event.end_at, '[)') && tstzrange(proposal_row.start_at, proposal_row.end_at, '[)')
    ) then
      update public.ai_schedule_proposals set status = 'conflict' where id = proposal_row.id;
      raise exception 'schedule proposal conflicts with an existing event';
    end if;
    insert into public.calendar_events (user_id, task_id, title, event_type, source, start_at, end_at, is_locked, is_flexible, blocks_time)
    values (auth.uid(), proposal_row.task_id, proposal_row.title, 'study', 'ai', proposal_row.start_at, proposal_row.end_at, false, true, true)
    returning id into event_id;
    update public.ai_schedule_proposals set status = 'accepted' where id = proposal_row.id;
    inserted_count := inserted_count + 1;
  end loop;
  update public.ai_schedule_batches set status = 'accepted' where id = p_batch_id;
  insert into public.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'accepted', 'ai_schedule_batch', p_batch_id, jsonb_build_object('inserted_count', inserted_count));
  return jsonb_build_object('batch_id', p_batch_id, 'inserted_count', inserted_count, 'status', 'accepted');
end;
$$;

create or replace function public.complete_focus_session(p_session_id uuid)
returns public.focus_sessions
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.focus_sessions;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '28000'; end if;
  update public.focus_sessions
  set ended_at = coalesce(ended_at, timezone('utc', now())),
      duration_seconds = greatest(extract(epoch from (coalesce(ended_at, timezone('utc', now())) - started_at))::integer, 0),
      status = 'completed',
      updated_at = timezone('utc', now())
  where id = p_session_id and user_id = auth.uid() and status = 'running'
  returning * into result;
  if not found then raise exception 'running focus session not found'; end if;
  return result;
end;
$$;

revoke all on function public.accept_ai_schedule_batch(uuid) from public;
grant execute on function public.accept_ai_schedule_batch(uuid) to authenticated;
revoke all on function public.complete_focus_session(uuid) from public;
grant execute on function public.complete_focus_session(uuid) to authenticated;

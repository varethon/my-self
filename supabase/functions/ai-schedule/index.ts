import { isAuthContext, json, options, readJson, requireAuth } from '../_shared/http.ts';
import { chooseCandidates } from '../_shared/gemini.ts';
import { scheduleInput } from '../_shared/schemas.ts';
import { generateCandidates, type EventRow, type TaskRow } from '../_shared/scheduler.ts';

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const parsed = scheduleInput.safeParse(await readJson(request));
  if (!parsed.success) return json({ error: 'Invalid schedule payload', issues: parsed.error.issues }, 400);
  const fromDate = parsed.data.fromDate ?? new Date().toISOString().slice(0, 10);
  const taskQuery = auth.client.from('tasks').select('id,title,priority,estimated_minutes,actual_minutes,is_splittable,min_session_minutes,max_session_minutes,status,deadline').not('status', 'in', '(done,cancelled,skipped)');
  const { data: taskData, error: taskError } = parsed.data.taskIds?.length ? await taskQuery.in('id', parsed.data.taskIds) : await taskQuery;
  if (taskError) return json({ error: taskError.message }, 400);
  const { data: eventData, error: eventError } = await auth.client.from('calendar_events').select('id,start_at,end_at,status,blocks_time').eq('status', 'active').eq('blocks_time', true);
  if (eventError) return json({ error: eventError.message }, 400);
  const tasks = (taskData ?? []) as unknown as TaskRow[];
  const events = (eventData ?? []) as unknown as EventRow[];
  const candidates = generateCandidates(tasks, events, fromDate, parsed.data.days);
  const selection = await chooseCandidates(candidates);
  const selected = candidates.filter((candidate) => selection.ids.includes(candidate.candidateId)).slice(0, 8);
  const { data: requestRow, error: requestError } = await auth.client.from('ai_requests').insert({ user_id: auth.user.id, request_type: 'schedule', status: 'completed', input: parsed.data, output: { model: selection.model, candidate_count: candidates.length }, completed_at: new Date().toISOString() }).select('id').single();
  if (requestError) return json({ error: requestError.message }, 400);
  const { data: batch, error: batchError } = await auth.client.from('ai_schedule_batches').insert({ user_id: auth.user.id, request_id: requestRow.id, input_snapshot: { fromDate, days: parsed.data.days, candidateCount: candidates.length } }).select('id,status,expires_at').single();
  if (batchError) return json({ error: batchError.message }, 400);
  if (selected.length) {
    const { error: proposalError } = await auth.client.from('ai_schedule_proposals').insert(selected.map((candidate) => ({ user_id: auth.user.id, batch_id: batch.id, task_id: candidate.taskId, candidate_id: candidate.candidateId, title: candidate.title, start_at: candidate.startAt, end_at: candidate.endAt, score: candidate.score })));
    if (proposalError) return json({ error: proposalError.message }, 400);
  }
  return json({ batchId: batch.id, status: batch.status, expiresAt: batch.expires_at, proposals: selected, model: selection.model, deterministicFallback: selection.fallback });
});

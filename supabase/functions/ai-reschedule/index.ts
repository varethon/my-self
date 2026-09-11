import { isAuthContext, json, options, readJson, requireAuth } from '../_shared/http.ts';
import { rescheduleInput } from '../_shared/schemas.ts';
import { generateCandidates, type EventRow, type TaskRow } from '../_shared/scheduler.ts';

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const parsed = rescheduleInput.safeParse(await readJson(request));
  if (!parsed.success) return json({ error: 'Invalid reschedule payload', issues: parsed.error.issues }, 400);
  const { data: task, error: taskError } = await auth.client.from('tasks').select('id,title,priority,estimated_minutes,actual_minutes,is_splittable,min_session_minutes,max_session_minutes,status,deadline').eq('id', parsed.data.taskId).single();
  if (taskError || !task) return json({ error: taskError?.message ?? 'Task not found' }, 404);
  const { data: events, error: eventError } = await auth.client.from('calendar_events').select('id,start_at,end_at,status,blocks_time').eq('status', 'active').eq('blocks_time', true);
  if (eventError) return json({ error: eventError.message }, 400);
  const candidates = generateCandidates([task as unknown as TaskRow], (events ?? []) as unknown as EventRow[], parsed.data.fromDate ?? new Date().toISOString().slice(0, 10), 7);
  return json({ taskId: task.id, proposals: candidates.slice(0, 8), mode: 'deterministic-candidate-preview' });
});

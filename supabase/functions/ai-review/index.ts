import { isAuthContext, json, options, readJson, requireAuth } from '../_shared/http.ts';
import { reviewInput } from '../_shared/schemas.ts';

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const parsed = reviewInput.safeParse(await readJson(request));
  if (!parsed.success) return json({ error: 'Invalid review payload', issues: parsed.error.issues }, 400);
  const start = parsed.data.weekStart ?? new Date().toISOString().slice(0, 10);
  const end = new Date(`${start}T00:00:00.000Z`); end.setUTCDate(end.getUTCDate() + 7);
  const [{ data: tasks, error: taskError }, { data: sessions, error: sessionError }] = await Promise.all([
    auth.client.from('tasks').select('status,estimated_minutes,actual_minutes').gte('created_at', `${start}T00:00:00.000Z`).lt('created_at', end.toISOString()),
    auth.client.from('focus_sessions').select('duration_seconds').eq('status', 'completed').gte('started_at', `${start}T00:00:00.000Z`).lt('started_at', end.toISOString()),
  ]);
  if (taskError || sessionError) return json({ error: taskError?.message ?? sessionError?.message }, 400);
  const taskRows = tasks ?? [];
  const completed = taskRows.filter((task) => task.status === 'done').length;
  const focusMinutes = Math.round((sessions ?? []).reduce((total, session) => total + session.duration_seconds, 0) / 60);
  return json({ weekStart: start, summary: { completedTasks: completed, totalTasks: taskRows.length, completionPercent: taskRows.length ? Math.round(completed / taskRows.length * 100) : 0, focusMinutes }, insights: [
    focusMinutes > 0 ? 'Focus sessions đang tạo ra tín hiệu tiến bộ rõ ràng.' : 'Hãy bảo vệ một session focus ngắn trong ngày mai.',
    completed < taskRows.length ? 'Chọn một task còn mở để giảm carry-over trước tuần mới.' : 'Nhịp hoàn thành tuần này đang ổn định.',
  ] });
});

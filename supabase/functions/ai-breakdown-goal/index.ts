import { isAuthContext, json, options, readJson, requireAuth } from '../_shared/http.ts';
import { goalInput } from '../_shared/schemas.ts';

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const parsed = goalInput.safeParse(await readJson(request));
  if (!parsed.success) return json({ error: 'Invalid goal payload', issues: parsed.error.issues }, 400);
  const { data: goal, error } = await auth.client.from('goals').select('id,title,description,target_date,priority').eq('id', parsed.data.goalId).single();
  if (error || !goal) return json({ error: error?.message ?? 'Goal not found' }, 404);
  return json({ goal, milestones: [
    { title: `Define success criteria for ${goal.title}`, estimatedMinutes: 30 },
    { title: `Build the first small proof for ${goal.title}`, estimatedMinutes: 90 },
    { title: `Review progress and choose the next constraint`, estimatedMinutes: 45 },
  ], mode: 'structured-deterministic' });
});

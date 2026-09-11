import { isAuthContext, json, options, readJson, requireAuth } from '../_shared/http.ts';
import { acceptInput } from '../_shared/schemas.ts';

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const parsed = acceptInput.safeParse(await readJson(request));
  if (!parsed.success) return json({ error: 'Invalid approval payload', issues: parsed.error.issues }, 400);
  const { data, error } = await auth.client.rpc('accept_ai_schedule_batch', { p_batch_id: parsed.data.batchId });
  if (error) return json({ error: error.message }, error.message.includes('conflict') ? 409 : 400);
  return json(data);
});

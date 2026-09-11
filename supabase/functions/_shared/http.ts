import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.116.0';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

export function options(request: Request): Response | null {
  return request.method === 'OPTIONS' ? new Response('ok', { headers: corsHeaders }) : null;
}

export interface AuthContext {
  client: SupabaseClient;
  user: User;
}

export async function requireAuth(request: Request): Promise<AuthContext | Response> {
  const authorization = request.headers.get('Authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!token || !supabaseUrl || !publishableKey) return json({ error: 'Authentication required' }, 401);
  const client = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return json({ error: 'Invalid authentication token' }, 401);
  return { client, user: data.user };
}

export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

export function isAuthContext(value: AuthContext | Response): value is AuthContext {
  return 'client' in value && 'user' in value;
}

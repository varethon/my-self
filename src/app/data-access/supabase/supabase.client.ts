/**
 * Supabase is intentionally disabled for the static local-only build.
 * Migrations and Edge Functions remain backend artifacts, but this app never
 * creates a client or opens an authentication session.
 */
export function getSupabaseClient(): null {
  return null;
}

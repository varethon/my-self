import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appConfig, isSupabaseConfigured } from '../../core/config/app-config';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  client ??= createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

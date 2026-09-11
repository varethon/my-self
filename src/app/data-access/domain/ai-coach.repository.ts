import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase/supabase.client';
import { CandidateSlot } from '../../shared/utils/scheduler';

export interface AiScheduleResponse {
  batchId: string;
  status: 'preview' | 'accepted';
  expiresAt: string;
  proposals: CandidateSlot[];
  model: string;
  deterministicFallback: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiCoachRepository {
  private readonly client: SupabaseClient | null = getSupabaseClient();
  readonly available = Boolean(this.client);

  async schedule(days = 7): Promise<{ data?: AiScheduleResponse; error?: string }> {
    if (!this.client) return { error: 'AI gateway is not configured.' };
    const result = await this.client.functions.invoke('ai-schedule', { body: { days } });
    if (result.error) return { error: result.error.message };
    return { data: result.data as AiScheduleResponse };
  }

  async accept(batchId: string): Promise<{ data?: { status: string; inserted_count: number }; error?: string }> {
    if (!this.client) return { error: 'AI gateway is not configured.' };
    const result = await this.client.functions.invoke('accept-ai-schedule', { body: { batchId } });
    if (result.error) return { error: result.error.message };
    return { data: result.data as { status: string; inserted_count: number } };
  }
}

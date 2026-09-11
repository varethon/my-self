import { Injectable } from '@angular/core';
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
  readonly available = false;

  async schedule(days = 7): Promise<{ data?: AiScheduleResponse; error?: string }> {
    void days;
    return { error: 'AI gateway is disabled in local-only mode.' };
  }

  async accept(batchId: string): Promise<{ data?: { status: string; inserted_count: number }; error?: string }> {
    void batchId;
    return { error: 'AI gateway is disabled in local-only mode.' };
  }
}

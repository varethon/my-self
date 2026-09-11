import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase/supabase.client';
import { CalendarEvent } from '../../shared/models/domain';

export interface CalendarEventDto {
  id: string;
  task_id: string | null;
  title: string;
  description: string;
  event_type: CalendarEvent['eventType'];
  source: CalendarEvent['source'];
  start_at: string;
  end_at: string;
  is_locked: boolean;
  is_flexible: boolean;
  blocks_time: boolean;
  status: CalendarEvent['status'];
}

export function mapCalendarEventDto(dto: CalendarEventDto): CalendarEvent {
  return { id: dto.id, taskId: dto.task_id ?? undefined, title: dto.title, description: dto.description, eventType: dto.event_type, source: dto.source, startAt: dto.start_at, endAt: dto.end_at, isLocked: dto.is_locked, isFlexible: dto.is_flexible, blocksTime: dto.blocks_time, status: dto.status };
}

export class CalendarRepository {
  private readonly client: SupabaseClient | null = getSupabaseClient();

  async listActive(from: string, to: string): Promise<{ data: CalendarEvent[]; error?: string }> {
    if (!this.client) return { data: [] };
    const result = await this.client.from('calendar_events').select('*').eq('status', 'active').lt('start_at', to).gt('end_at', from).order('start_at');
    if (result.error) return { data: [], error: result.error.message };
    return { data: (result.data as unknown as CalendarEventDto[]).map(mapCalendarEventDto) };
  }
}

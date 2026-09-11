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
  async listActive(from: string, to: string): Promise<{ data: CalendarEvent[]; error?: string }> {
    void from;
    void to;
    return { data: [] };
  }
}

import { CalendarEvent, Task } from '../models/domain';

export interface Interval {
  startAt: string;
  endAt: string;
}

export interface CandidateSlot extends Interval {
  candidateId: string;
  taskId: string;
  score: number;
}

export function overlaps(a: Interval, b: Interval): boolean {
  const aStart = Date.parse(a.startAt);
  const aEnd = Date.parse(a.endAt);
  const bStart = Date.parse(b.startAt);
  const bEnd = Date.parse(b.endAt);
  return aStart < bEnd && aEnd > bStart;
}

export function subtractBusyIntervals(window: Interval, busy: Interval[]): Interval[] {
  const start = Date.parse(window.startAt);
  const end = Date.parse(window.endAt);
  const sorted = busy
    .filter((interval) => overlaps(window, interval))
    .map((interval) => ({ start: Math.max(start, Date.parse(interval.startAt)), end: Math.min(end, Date.parse(interval.endAt)) }))
    .sort((a, b) => a.start - b.start);

  const result: Interval[] = [];
  let cursor = start;
  for (const interval of sorted) {
    if (interval.start > cursor) {
      result.push({ startAt: new Date(cursor).toISOString(), endAt: new Date(interval.start).toISOString() });
    }
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < end) {
    result.push({ startAt: new Date(cursor).toISOString(), endAt: new Date(end).toISOString() });
  }
  return result;
}

export function splitTask(task: Task, sessionMinutes = 60): number[] {
  const remaining = Math.max(task.estimatedMinutes - task.actualMinutes, 0);
  if (remaining === 0) return [];
  if (!task.isSplittable) return [remaining];
  const min = Math.max(task.minSessionMinutes, 15);
  const max = Math.max(task.maxSessionMinutes, min);
  const size = Math.min(Math.max(sessionMinutes, min), max);
  const chunks: number[] = [];
  let rest = remaining;
  while (rest > 0) {
    const chunk = Math.min(size, rest);
    if (rest > size && rest - chunk < min) {
      chunks.push(rest);
      break;
    }
    chunks.push(chunk);
    rest -= chunk;
  }
  return chunks;
}

export function generateCandidateSlots(tasks: Task[], events: CalendarEvent[], from: Date, days = 7): CandidateSlot[] {
  const candidates: CandidateSlot[] = [];
  const busy = events.filter((event) => event.status === 'active' && event.blocksTime);
  for (let day = 0; day < days; day += 1) {
    const date = new Date(from);
    date.setDate(date.getDate() + day);
    const windowStart = new Date(date);
    windowStart.setHours(8, 0, 0, 0);
    const windowEnd = new Date(date);
    windowEnd.setHours(20, 0, 0, 0);
    const available = subtractBusyIntervals(
      { startAt: windowStart.toISOString(), endAt: windowEnd.toISOString() },
      busy,
    );
    for (const task of tasks.filter((item) => item.status !== 'done' && item.status !== 'cancelled')) {
      const duration = splitTask(task)[0] ?? 0;
      if (!duration) continue;
      for (const slot of available) {
        const slotMinutes = (Date.parse(slot.endAt) - Date.parse(slot.startAt)) / 60000;
        if (slotMinutes < duration) continue;
        const end = new Date(Date.parse(slot.startAt) + duration * 60000).toISOString();
        const candidateId = `${task.id}-${day}-${Date.parse(slot.startAt)}`;
        candidates.push({ candidateId, taskId: task.id, startAt: slot.startAt, endAt: end, score: (4 - task.priority) + day * 0.1 });
      }
    }
  }
  return candidates;
}

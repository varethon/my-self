export interface TaskRow {
  id: string;
  title: string;
  priority: number;
  estimated_minutes: number;
  actual_minutes: number;
  is_splittable: boolean;
  min_session_minutes: number;
  max_session_minutes: number;
  status: string;
  deadline: string | null;
}

export interface EventRow {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  blocks_time: boolean;
}

export interface Candidate {
  candidateId: string;
  taskId: string;
  title: string;
  startAt: string;
  endAt: string;
  score: number;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function chunks(task: TaskRow): number[] {
  const remaining = Math.max(task.estimated_minutes - task.actual_minutes, 0);
  if (!remaining) return [];
  if (!task.is_splittable) return [remaining];
  const min = Math.max(task.min_session_minutes, 15);
  const max = Math.max(task.max_session_minutes, min);
  const size = Math.min(50, max);
  const result: number[] = [];
  let rest = remaining;
  while (rest > 0) {
    const duration = Math.min(size, rest);
    if (rest > size && rest - duration < min) { result.push(rest); break; }
    result.push(duration);
    rest -= duration;
  }
  return result;
}

export function generateCandidates(tasks: TaskRow[], events: EventRow[], fromDate: string, days: number): Candidate[] {
  const busy = events.filter((event) => event.status === 'active' && event.blocks_time).map((event) => [Date.parse(event.start_at), Date.parse(event.end_at)] as const);
  const result: Candidate[] = [];
  for (let day = 0; day < days; day += 1) {
    const cursorDate = new Date(`${fromDate}T00:00:00.000Z`);
    cursorDate.setUTCDate(cursorDate.getUTCDate() + day);
    const dayStart = Date.UTC(cursorDate.getUTCFullYear(), cursorDate.getUTCMonth(), cursorDate.getUTCDate(), 8);
    const dayEnd = Date.UTC(cursorDate.getUTCFullYear(), cursorDate.getUTCMonth(), cursorDate.getUTCDate(), 20);
    for (const task of tasks.filter((item) => !['done', 'cancelled', 'skipped'].includes(item.status))) {
      const duration = chunks(task)[0] ?? 0;
      if (!duration) continue;
      for (let start = dayStart; start + duration * 60000 <= dayEnd; start += 30 * 60000) {
        const end = start + duration * 60000;
        if (busy.some(([busyStart, busyEnd]) => overlaps(start, end, busyStart, busyEnd))) continue;
        if (task.deadline && end > Date.parse(task.deadline)) continue;
        result.push({ candidateId: `${task.id}-${start}`, taskId: task.id, title: `Focus · ${task.title}`, startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString(), score: Math.max(0, 4 - task.priority - day * 0.1) });
      }
    }
  }
  return result.sort((a, b) => b.score - a.score || a.startAt.localeCompare(b.startAt));
}

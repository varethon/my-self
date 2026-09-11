import { describe, expect, it } from 'vitest';
import { CalendarEvent, Task } from '../models/domain';
import { generateCandidateSlots, overlaps, splitTask, subtractBusyIntervals } from './scheduler';

const interval = (startAt: string, endAt: string) => ({ startAt, endAt });

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-test', title: 'Test task', description: '', priority: 1, estimatedMinutes: 125, actualMinutes: 0,
  difficulty: 3, energyRequired: 2, status: 'backlog', isSplittable: true, minSessionMinutes: 25, maxSessionMinutes: 60,
  ...overrides,
});

const event = (startAt: string, endAt: string, blocksTime = true): CalendarEvent => ({
  id: `${startAt}-${endAt}`, title: 'busy', eventType: 'fixed_commitment', source: 'manual', startAt, endAt,
  isLocked: true, isFlexible: false, blocksTime, status: 'active',
});

describe('scheduler primitives', () => {
  it('treats touching half-open intervals as non-overlapping', () => {
    expect(overlaps(interval('2026-09-11T09:00:00Z', '2026-09-11T10:00:00Z'), interval('2026-09-11T10:00:00Z', '2026-09-11T11:00:00Z'))).toBe(false);
    expect(overlaps(interval('2026-09-11T09:00:00Z', '2026-09-11T10:00:00Z'), interval('2026-09-11T09:59:00Z', '2026-09-11T11:00:00Z'))).toBe(true);
    expect(overlaps(interval('2026-09-11T09:00:00Z', '2026-09-11T12:00:00Z'), interval('2026-09-11T10:00:00Z', '2026-09-11T11:00:00Z'))).toBe(true);
  });

  it('subtracts nested and adjacent busy intervals correctly', () => {
    const free = subtractBusyIntervals(interval('2026-09-11T08:00:00Z', '2026-09-11T18:00:00Z'), [
      interval('2026-09-11T10:00:00Z', '2026-09-11T12:00:00Z'),
      interval('2026-09-11T11:00:00Z', '2026-09-11T14:00:00Z'),
    ]);
    expect(free).toEqual([
      interval('2026-09-11T08:00:00.000Z', '2026-09-11T10:00:00.000Z'),
      interval('2026-09-11T14:00:00.000Z', '2026-09-11T18:00:00.000Z'),
    ]);
  });

  it('splits work while respecting minimum and maximum session sizes', () => {
    expect(splitTask(task(), 50)).toEqual([50, 50, 25]);
    expect(splitTask(task({ estimatedMinutes: 10, isSplittable: false }), 50)).toEqual([10]);
    expect(splitTask(task({ estimatedMinutes: 0 }), 50)).toEqual([]);
  });

  it('does not generate candidates inside a locked event or after a deadline', () => {
    const from = new Date('2026-09-11T00:00:00+07:00');
    const candidates = generateCandidateSlots([task({ estimatedMinutes: 60, deadline: '2026-09-11T10:30:00+07:00' })], [event('2026-09-11T08:00:00+07:00', '2026-09-11T09:00:00+07:00')], from, 1);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => !overlaps(candidate, event('2026-09-11T08:00:00+07:00', '2026-09-11T09:00:00+07:00')))).toBe(true);
    expect(candidates.every((candidate) => Date.parse(candidate.endAt) <= Date.parse('2026-09-11T10:30:00+07:00'))).toBe(true);
  });
});

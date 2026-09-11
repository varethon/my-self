import { describe, expect, it } from 'vitest';
import { mapTaskDto } from './task.repository';

describe('task DTO mapper', () => {
  it('maps snake_case persistence fields to the domain model', () => {
    const result = mapTaskDto({
      id: 'task-1', user_id: 'user-1', goal_id: null, monthly_goal_id: 'month-1', life_area_id: 'area-1', title: 'Ship', description: 'Do it',
      priority: 0, deadline: null, estimated_minutes: 60, actual_minutes: 15, difficulty: 4, energy_required: 3, status: 'in_progress', is_splittable: false, min_session_minutes: 45, max_session_minutes: 120,
    });
    expect(result).toMatchObject({ id: 'task-1', monthlyGoalId: 'month-1', priority: 0, estimatedMinutes: 60, actualMinutes: 15, status: 'in_progress' });
    expect(result.goalId).toBeUndefined();
  });
});

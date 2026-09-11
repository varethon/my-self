import { Task } from '../../shared/models/domain';

export interface TaskDto {
  id: string;
  user_id: string;
  goal_id: string | null;
  monthly_goal_id: string | null;
  life_area_id: string | null;
  title: string;
  description: string;
  priority: number;
  deadline: string | null;
  estimated_minutes: number;
  actual_minutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  energy_required: 1 | 2 | 3;
  status: Task['status'];
  is_splittable: boolean;
  min_session_minutes: number;
  max_session_minutes: number;
}

export function mapTaskDto(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    goalId: dto.goal_id ?? undefined,
    monthlyGoalId: dto.monthly_goal_id ?? undefined,
    lifeAreaId: dto.life_area_id ?? undefined,
    priority: dto.priority as Task['priority'],
    deadline: dto.deadline ?? undefined,
    estimatedMinutes: dto.estimated_minutes,
    actualMinutes: dto.actual_minutes,
    difficulty: dto.difficulty,
    energyRequired: dto.energy_required,
    status: dto.status,
    isSplittable: dto.is_splittable,
    minSessionMinutes: dto.min_session_minutes,
    maxSessionMinutes: dto.max_session_minutes,
  };
}

export class TaskRepository {
  async listOpen(): Promise<{ data: Task[]; error?: string }> {
    return { data: [] };
  }
}

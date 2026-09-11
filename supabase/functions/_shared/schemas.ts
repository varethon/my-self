import { z } from 'https://esm.sh/zod@4.6.2';

export const scheduleInput = z.object({
  taskIds: z.array(z.string().uuid()).max(50).optional(),
  fromDate: z.string().date().optional(),
  days: z.number().int().min(1).max(14).default(7),
});

export const acceptInput = z.object({ batchId: z.string().uuid() });
export const goalInput = z.object({ goalId: z.string().uuid() });
export const reviewInput = z.object({ weekStart: z.string().date().optional() });
export const rescheduleInput = z.object({ taskId: z.string().uuid(), fromDate: z.string().date().optional() });

export const geminiSelection = z.object({ candidateIds: z.array(z.string()).max(50) });

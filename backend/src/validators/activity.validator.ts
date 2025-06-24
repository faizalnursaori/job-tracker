import { z } from 'zod';

export const createActivitySchema = z.object({
  jobApplicationId: z.string().cuid('Invalid job application ID'),
  activity: z.string()
    .min(1, 'Activity description is required')
    .max(500, 'Activity description must be less than 500 characters'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  metadata: z.record(z.any()).optional()
});

export const updateActivitySchema = z.object({
  activity: z.string()
    .min(1, 'Activity description is required')
    .max(500, 'Activity description must be less than 500 characters')
    .optional(),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  metadata: z.record(z.any()).optional()
});

export const getActivitiesQuerySchema = z.object({
  jobApplicationId: z.string().cuid().optional(),
  limit: z.coerce.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
  offset: z.coerce.number()
    .int()
    .min(0, 'Offset must be non-negative')
    .default(0)
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type GetActivitiesQuery = z.infer<typeof getActivitiesQuerySchema>; 
import { z } from 'zod';

// Define enums
const JobLevel = z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR']);
const EmploymentType = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']);
const StatusType = z.enum(['APPLIED', 'PHONE_SCREEN', 'FINAL_INTERVIEW', 'TECHNICAL_TEST', 'OFFER', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'ON_HOLD']);

// Job Application creation schema
export const createJobApplicationSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  status: StatusType.default('APPLIED'),
  jobTitle: z.string().min(1, 'Job title is required').max(255),
  jobLevel: JobLevel.optional(),
  employmentType: EmploymentType.optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().default('IDR'),
  location: z.string().optional(),
  isRemote: z.boolean().default(false),
  jobUrl: z.string().url().optional().or(z.literal('')),
  jobDescription: z.string().optional(),
  requirements: z.string().optional(),
  appliedDate: z.string().datetime(),
  responseDeadline: z.string().datetime().optional(),
  personalNotes: z.string().optional(),
  priority: z.number().int().min(1).max(3).default(3),
  isFavorite: z.boolean().default(false),
  source: z.string().optional()
}).refine(data => {
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMin <= data.salaryMax;
  }
  return true;
}, {
  message: 'Minimum salary must be less than or equal to maximum salary',
  path: ['salaryMax']
});

// Job Application update schema (all fields optional except for validation)
export const updateJobApplicationSchema = z.object({
  companyId: z.string().min(1, 'Company is required').optional(),
  status: StatusType.optional(),
  jobTitle: z.string().min(1, 'Job title is required').max(255).optional(),
  jobLevel: JobLevel.optional(),
  employmentType: EmploymentType.optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  jobUrl: z.string().url().optional().or(z.literal('')),
  jobDescription: z.string().optional(),
  requirements: z.string().optional(),
  appliedDate: z.string().datetime().optional(),
  responseDeadline: z.string().datetime().optional(),
  personalNotes: z.string().optional(),
  priority: z.number().int().min(1).max(3).optional(),
  isFavorite: z.boolean().optional(),
  source: z.string().optional()
}).refine(data => {
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMin <= data.salaryMax;
  }
  return true;
}, {
  message: 'Minimum salary must be less than or equal to maximum salary',
  path: ['salaryMax']
});

// Query parameters schema
export const jobApplicationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: StatusType.optional(),
  company: z.string().optional(),
  priority: z.string().regex(/^[1-3]$/).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'appliedDate', 'jobTitle', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isFavorite: z.string().transform(val => val === 'true').optional(),
  isRemote: z.string().transform(val => val === 'true').optional()
});

// Export types
export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>;
export type UpdateJobApplicationInput = z.infer<typeof updateJobApplicationSchema>;
export type JobApplicationQuery = z.infer<typeof jobApplicationQuerySchema>; 
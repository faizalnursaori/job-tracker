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

// Enhanced query parameters schema with advanced filters
export const jobApplicationQuerySchema = z.object({
  // Pagination
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  
  // Basic filters
  status: z.union([StatusType, z.array(StatusType)]).optional(),
  company: z.string().optional(),
  priority: z.union([
    z.string().regex(/^[1-3]$/).transform(Number),
    z.array(z.string().regex(/^[1-3]$/).transform(Number))
  ]).optional(),
  
  // Advanced filters
  jobLevel: z.union([JobLevel, z.array(JobLevel)]).optional(),
  employmentType: z.union([EmploymentType, z.array(EmploymentType)]).optional(),
  location: z.string().optional(),
  isRemote: z.string().transform(val => val === 'true').optional(),
  isFavorite: z.string().transform(val => val === 'true').optional(),
  source: z.string().optional(),
  
  // Date range filters
  appliedDateFrom: z.string().datetime().optional(),
  appliedDateTo: z.string().datetime().optional(),
  responseDeadlineFrom: z.string().datetime().optional(),
  responseDeadlineTo: z.string().datetime().optional(),
  
  // Salary range filters
  salaryMin: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  salaryMax: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  currency: z.string().optional(),
  
  // Search options
  search: z.string().optional(),
  searchFields: z.array(z.enum(['jobTitle', 'companyName', 'personalNotes', 'jobDescription', 'requirements', 'location'])).optional(),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'appliedDate', 'jobTitle', 'priority', 'salaryMin', 'salaryMax', 'companyName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Advanced options
  hasNotes: z.string().transform(val => val === 'true').optional(),
  hasDeadline: z.string().transform(val => val === 'true').optional(),
  isOverdue: z.string().transform(val => val === 'true').optional()
});

// Filter options schema for getting available filter values
export const filterOptionsSchema = z.object({
  includeCompanies: z.string().transform(val => val === 'true').default('true'),
  includeStatuses: z.string().transform(val => val === 'true').default('true'),
  includeJobLevels: z.string().transform(val => val === 'true').default('true'),
  includeEmploymentTypes: z.string().transform(val => val === 'true').default('true'),
  includeSources: z.string().transform(val => val === 'true').default('true'),
  includeLocations: z.string().transform(val => val === 'true').default('true')
});

// Export types
export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>;
export type UpdateJobApplicationInput = z.infer<typeof updateJobApplicationSchema>;
export type JobApplicationQuery = z.infer<typeof jobApplicationQuerySchema>;
export type FilterOptionsQuery = z.infer<typeof filterOptionsSchema>; 
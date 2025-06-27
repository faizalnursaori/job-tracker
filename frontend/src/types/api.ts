// API Types - Core data models used throughout the application

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  location?: string;
  description?: string;
  logoUrl?: string;
  size?: string;
}

export type StatusType = 
  | 'APPLIED'
  | 'PHONE_SCREEN'
  | 'FINAL_INTERVIEW'
  | 'TECHNICAL_TEST'
  | 'OFFER'
  | 'NEGOTIATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ON_HOLD';

export type JobLevelType = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';

export type NoteType = 'INTERVIEW' | 'FOLLOW_UP' | 'FEEDBACK' | 'RESEARCH' | 'REMINDER' | 'OTHER';

export interface Status {
  id: string;
  name: string;
  value: StatusType;
  sortOrder: number;
  isActive: boolean;
}

export interface JobApplication {
  id: string;
  userId: string;
  companyId: string;
  status: StatusType;
  jobTitle: string;
  jobLevel?: JobLevelType;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  location?: string;
  isRemote: boolean;
  jobUrl?: string;
  jobDescription?: string;
  requirements?: string;
  appliedDate: string;
  responseDeadline?: string;
  personalNotes?: string;
  priority: number;
  isFavorite: boolean;
  source?: string;
  createdAt: string;
  updatedAt: string;
  company: Company;
  _count?: {
    notes: number;
  };
}

export interface ApplicationNote {
  id: string;
  jobApplicationId: string;
  title: string;
  content: string;
  noteType: NoteType;
  noteDate: string;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationActivity {
  id: string;
  jobApplicationId: string;
  activity: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  jobApplication?: {
    id: string;
    jobTitle: string;
    company: {
      name: string;
    };
  };
}

// Filter and Query Types
export interface JobApplicationFilters {
  // Pagination
  page?: number;
  limit?: number;
  
  // Basic filters
  status?: StatusType | StatusType[];
  company?: string;
  priority?: number | number[];
  
  // Advanced filters
  jobLevel?: JobLevelType | JobLevelType[];
  employmentType?: EmploymentType | EmploymentType[];
  location?: string;
  isRemote?: boolean;
  isFavorite?: boolean;
  source?: string;
  
  // Date range filters
  appliedDateFrom?: string;
  appliedDateTo?: string;
  responseDeadlineFrom?: string;
  responseDeadlineTo?: string;
  
  // Salary range filters
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  
  // Search options
  search?: string;
  searchFields?: ('jobTitle' | 'companyName' | 'personalNotes' | 'jobDescription' | 'requirements' | 'location')[];
  
  // Sorting
  sortBy?: 'createdAt' | 'appliedDate' | 'jobTitle' | 'priority' | 'salaryMin' | 'salaryMax' | 'companyName';
  sortOrder?: 'asc' | 'desc';
  
  // Advanced options
  hasNotes?: boolean;
  hasDeadline?: boolean;
  isOverdue?: boolean;
}

export interface FilterOptions {
  companies?: { id: string; name: string }[];
  statuses?: StatusType[];
  jobLevels?: JobLevelType[];
  employmentTypes?: EmploymentType[];
  sources?: string[];
  locations?: string[];
  priorities: { value: number; label: string }[];
  currencies: string[];
  searchFields: { value: string; label: string }[];
}

export interface FilterOptionsQuery {
  includeCompanies?: boolean;
  includeStatuses?: boolean;
  includeJobLevels?: boolean;
  includeEmploymentTypes?: boolean;
  includeSources?: boolean;
  includeLocations?: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  recentActivities: ApplicationActivity[];
  statusBreakdown: {
    status: StatusType;
    count: number;
    percentage: number;
  }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} 
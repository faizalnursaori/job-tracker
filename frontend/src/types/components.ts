import { type ApplicationActivity } from './api';

// Form Data Interfaces
export interface JobApplicationFormData {
  jobTitle: string;
  companyName: string;
  status: string;
  jobLevel: string;
  employmentType: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  location: string;
  isRemote: boolean;
  jobUrl: string;
  jobDescription: string;
  requirements: string;
  appliedDate: string;
  responseDeadline: string;
  personalNotes: string;
  priority: string;
  source: string;
  isFavorite: boolean;
}

// Activity Components
export interface ActivityFormProps {
  activity?: ApplicationActivity;
  jobApplicationId: string;
  onSuccess: () => void;
  onCancel: () => void;
  hideHeader?: boolean;
}

export interface ActivityListProps {
  jobApplicationId: string;
  activities: ApplicationActivity[];
  onEdit: (activity: ApplicationActivity) => void;
  onDelete: (activityId: string) => void;
  isLoading?: boolean;
}

export interface MetadataItem {
  key: string;
  value: string;
}

// Timeline Components
export interface ActivityItem {
  id: string;
  type: 'status' | 'note' | 'interview' | 'follow_up' | 'other';
  title: string;
  description?: string;
  date: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
}

// Filter Components
export interface AdvancedFiltersProps {
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

// Profile Components
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

// Provider Props
export interface SessionProviderProps {
  children: React.ReactNode;
}

export interface QueryProviderProps {
  children: React.ReactNode;
} 
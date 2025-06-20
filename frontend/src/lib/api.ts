import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove invalid token
      localStorage.removeItem('authToken');
      // Redirect to login page
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

// API Types based on backend
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

export interface Status {
  id: string;
  name: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface JobApplication {
  id: string;
  userId: string;
  companyId: string;
  statusId: string;
  jobTitle: string;
  jobLevel?: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR';
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';
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
  status: Status;
  _count?: {
    notes: number;
    documents: number;
  };
}

export interface ApplicationNote {
  id: string;
  jobApplicationId: string;
  title: string;
  content: string;
  noteType: 'INTERVIEW' | 'FOLLOW_UP' | 'FEEDBACK' | 'RESEARCH' | 'REMINDER' | 'OTHER';
  noteDate: string;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getProfile: () => api.get('/auth/profile'),
};

// Job Applications API
export const jobApplicationsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    company?: string;
    priority?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/job-applications', { params }),

  getById: (id: string) => api.get(`/job-applications/${id}`),

  create: (data: Partial<JobApplication>) => 
    api.post('/job-applications', data),

  update: (id: string, data: Partial<JobApplication>) =>
    api.put(`/job-applications/${id}`, data),

  delete: (id: string) => api.delete(`/job-applications/${id}`),

  getStats: () => api.get('/job-applications/stats'),
};

// Companies API
export const companiesApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/companies', { params }),

  getById: (id: string) => api.get(`/companies/${id}`),

  getSuggestions: (query: string) =>
    api.get('/companies/suggestions', { params: { q: query } }),

  create: (data: Partial<Company>) => api.post('/companies', data),

  update: (id: string, data: Partial<Company>) =>
    api.put(`/companies/${id}`, data),

  delete: (id: string) => api.delete(`/companies/${id}`),
};

// Statuses API
export const statusesApi = {
  getAll: () => api.get('/statuses'),

  getById: (id: string) => api.get(`/statuses/${id}`),

  create: (data: { name: string; color?: string; sortOrder: number }) =>
    api.post('/statuses', data),

  update: (id: string, data: Partial<Status>) =>
    api.put(`/statuses/${id}`, data),

  delete: (id: string) => api.delete(`/statuses/${id}`),

  reorder: (statusIds: string[]) =>
    api.post('/statuses/reorder', { statusIds }),
};

// Notes API
export const notesApi = {
  getAll: (jobApplicationId: string) =>
    api.get(`/job-applications/${jobApplicationId}/notes`),

  create: (data: Partial<ApplicationNote>) => api.post('/notes', data),

  update: (id: string, data: Partial<ApplicationNote>) =>
    api.put(`/notes/${id}`, data),

  delete: (id: string) => api.delete(`/notes/${id}`),
}; 
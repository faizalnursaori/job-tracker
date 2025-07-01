import axios from 'axios';
import {
  type Company,
  type Status,
  type JobApplication,
  type ApplicationNote,
  type JobApplicationFilters,
  type FilterOptionsQuery,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

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

// Types are now imported from @/types

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

// Filter types are now imported from @/types

// Job Applications API
export const jobApplicationsApi = {
  getAll: (filters?: JobApplicationFilters) => 
    api.get('/job-applications', { params: filters }),

  getFilterOptions: (query?: FilterOptionsQuery) =>
    api.get('/job-applications/filter-options', { params: query }),

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

// Activities API
export const activitiesApi = {
  getAll: (params?: {
    jobApplicationId?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/activities', { params }),

  getById: (id: string) => api.get(`/activities/${id}`),

  getByJobApplication: (jobApplicationId: string, params?: {
    limit?: number;
    offset?: number;
  }) => api.get(`/activities/job-application/${jobApplicationId}`, { params }),

  create: (data: {
    jobApplicationId: string;
    activity: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) => api.post('/activities', data),

  update: (id: string, data: {
    activity?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) => api.put(`/activities/${id}`, data),

  delete: (id: string) => api.delete(`/activities/${id}`),
}; 

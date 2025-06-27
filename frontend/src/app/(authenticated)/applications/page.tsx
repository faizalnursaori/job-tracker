'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { jobApplicationsApi } from '@/lib/api';
import { type JobApplication, type JobApplicationFilters } from '@/types';
import { formatStatusName, getStatusColor, getPriorityInfo, formatSalary } from '@/lib/status-utils';
import { AdvancedFilters } from '@/components/applications/advanced-filters';

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<JobApplicationFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['job-applications', filters],
    queryFn: async () => {
      const response = await jobApplicationsApi.getAll(filters);
      return response.data.data;
    },
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: (applicationId: string) => jobApplicationsApi.delete(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Application deleted successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to delete application';
      toast.error(errorMessage || 'Failed to delete application');
    },
  });

  const handleFiltersChange = (newFilters: JobApplicationFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDelete = (applicationId: string, jobTitle: string, companyName: string) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Delete Application</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the application for <strong>{jobTitle}</strong> at <strong>{companyName}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteApplicationMutation.mutate(applicationId);
            }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  };

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Job Applications</h2>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Error loading applications</h3>
              <p className="text-sm text-red-600">Failed to fetch job applications</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="border-red-300 text-red-600 hover:bg-red-100"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const applications = data?.jobApplications || [];
  const pagination = data?.pagination;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Job Applications</h2>
        <div className="flex items-center space-x-2">
          <Link href="/applications/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Applications ({isLoading ? '...' : pagination?.total || 0})
          </CardTitle>
          <CardDescription>
            Manage your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded ml-auto"></div>
                </div>
              ))}
            </div>
          ) : applications.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app: JobApplication) => {
                    const priority = getPriorityInfo(app.priority);
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {app.jobTitle}
                              {app.isFavorite && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  ★
                                </Badge>
                              )}
                            </div>
                            {app.jobUrl && (
                              <a 
                                href={app.jobUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center"
                              >
                                View Job Posting
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{app.company.name}</div>
                            {app.company.industry && (
                              <div className="text-sm text-muted-foreground">
                                {app.company.industry}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.status)}>
                            {formatStatusName(app.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priority.variant}>
                            {priority.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{new Date(app.appliedDate).toLocaleDateString()}</div>
                            {app.responseDeadline && (
                              <div className="text-xs text-muted-foreground">
                                Deadline: {new Date(app.responseDeadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {app.salaryMin || app.salaryMax ? (
                            <div className="space-y-1">
                              <div>{formatSalary(app.salaryMin, app.salaryMax, app.currency)}</div>
                              {app.jobLevel && (
                                <div className="text-xs text-muted-foreground">
                                  {app.jobLevel}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{app.location || 'Not specified'}</div>
                            {app.isRemote && (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                Remote
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/applications/${app.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/applications/${app.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(app.id, app.jobTitle, app.company.name)}
                              disabled={deleteApplicationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} applications
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={pagination.page === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                No job applications found.
              </div>
              <Link href="/applications/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Application
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
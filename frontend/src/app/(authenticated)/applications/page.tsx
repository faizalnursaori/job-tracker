'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { jobApplicationsApi, type JobApplication } from '@/lib/api';
import { formatStatusName, getStatusColor, getPriorityInfo, formatSalary } from '@/lib/status-utils';

export default function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['job-applications', { 
      page: currentPage, 
      limit: pageSize, 
      search: searchTerm 
    }],
    queryFn: async () => {
      const response = await jobApplicationsApi.getAll({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      return response.data.data;
    },
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
          <CardDescription>
            Search and filter your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by job title, company, or notes..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

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
                            <div>{app.jobTitle}</div>
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
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: getStatusColor(app.status) || '#6B7280',
                              color: getStatusColor(app.status) || '#6B7280'
                            }}
                          >
                            {formatStatusName(app.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priority.color as any}>
                            {priority.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(app.appliedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {app.salaryMin || app.salaryMax 
                            ? formatSalary(app.salaryMin || 0, app.salaryMax || 0, app.currency)
                            : 'Not specified'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{app.isRemote ? "Remote" : app.location || 'Not specified'}</div>
                            {app.isRemote && app.location && (
                              <div className="text-xs text-muted-foreground">
                                {app.location}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
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
                            <Button variant="ghost" size="sm">
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
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} applications
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {pagination.pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                      disabled={currentPage >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No applications found
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ? `No applications match "${searchTerm}"` : 'Get started by adding your first job application'}
              </p>
              <Link href="/applications/new">
                <Button>
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
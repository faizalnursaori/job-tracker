'use client'

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock,
  Plus,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { jobApplicationsApi } from '@/lib/api';

interface DashboardStats {
  totalApplications: number;
  statusBreakdown: Array<{
    status: string;
    color?: string;
    count: number;
  }>;
  priorityBreakdown: Array<{
    priority: number;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    jobTitle: string;
    company: { name: string };
    status: { name: string; color?: string };
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await jobApplicationsApi.getStats();
      return response.data.data as DashboardStats;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Error loading dashboard</h3>
              <p className="text-sm text-red-600">Failed to fetch dashboard statistics</p>
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

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Content */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-gray-200 animate-pulse rounded-full"></div>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-8 bg-gray-200 animate-pulse rounded ml-auto"></div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = statsData || {
    totalApplications: 0,
    statusBreakdown: [],
    priorityBreakdown: [],
    recentActivity: []
  };

  // Calculate active applications (non-rejected)
  const activeApplications = stats.statusBreakdown
    .filter(s => s.status.toLowerCase() !== 'rejected')
    .reduce((sum, s) => sum + s.count, 0);

  // Calculate unique companies (this would be better from a separate API call)
  const uniqueCompanies = new Set(stats.recentActivity.map(app => app.company.name)).size;

  // Calculate response rate (placeholder calculation)
  const responseRate = stats.totalApplications > 0 
    ? Math.round(((activeApplications / stats.totalApplications) * 100)) 
    : 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href="/applications/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              All time applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Applications
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApplications}</div>
            <p className="text-xs text-muted-foreground">
              Non-rejected applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Companies
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Unique companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Response Rate
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              Application success rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Status Breakdown */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {stats.statusBreakdown.length > 0 ? (
              <div className="space-y-3">
                {stats.statusBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: item.color || '#6B7280' }}
                    />
                    <div className="flex-1 text-sm font-medium">
                      {item.status}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No applications yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>
              Your latest job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((app) => (
                  <div key={app.id} className="flex items-center">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {app.jobTitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {app.company.name}
                      </p>
                    </div>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: app.status.color || '#6B7280',
                        color: app.status.color || '#6B7280'
                      }}
                    >
                      {app.status.name}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
            <div className="mt-4">
              <Link href="/applications">
                <Button variant="outline" className="w-full">
                  View All Applications
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
          <CardDescription>
            Applications by priority level
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.priorityBreakdown.length > 0 ? (
            <div className="flex space-x-6">
              {stats.priorityBreakdown.map((item) => (
                <div key={item.priority} className="text-center">
                  <div className="text-2xl font-bold">
                    {item.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.priority === 1 ? "High" : item.priority === 2 ? "Medium" : "Low"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No applications to analyze</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
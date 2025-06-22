'use client'

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Users, Clock, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { jobApplicationsApi } from '@/lib/api';
import { formatStatusName, getStatusColor } from '@/lib/status-utils';

interface DashboardStats {
  totalApplications: number;
  statusBreakdown: Array<{
    status: string;
    _count: number;
  }>;
  priorityBreakdown: Array<{
    priority: number;
    _count: number;
  }>;
  recentApplications: Array<{
    id: string;
    jobTitle: string;
    company: { name: string; logoUrl?: string };
    status: string;
    createdAt: string;
  }>;
  successRate: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await jobApplicationsApi.getStats();
      return response.data.data as DashboardStats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading dashboard data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Provide default values if stats is undefined
  const safeStats = stats || {
    totalApplications: 0,
    statusBreakdown: [],
    priorityBreakdown: [],
    recentApplications: [],
    successRate: 0
  };

  // Calculate active applications (non-rejected)
  const activeApplications = safeStats.statusBreakdown
    .filter(s => s.status.toLowerCase() !== 'rejected')
    .reduce((sum, s) => sum + s._count, 0);

  // Calculate unique companies (this would be better from a separate API call)
  const uniqueCompanies = new Set(safeStats.recentApplications.map(app => app.company.name)).size;

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
            <div className="text-2xl font-bold">{safeStats.totalApplications}</div>
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
              Success Rate
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Offers received rate
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
            {safeStats.statusBreakdown.length > 0 ? (
              <div className="space-y-3">
                {safeStats.statusBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: getStatusColor(item.status) }}
                    />
                    <div className="flex-1 text-sm font-medium">
                      {formatStatusName(item.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item._count}
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
            {safeStats.recentApplications.length > 0 ? (
              <div className="space-y-3">
                {safeStats.recentApplications.map((app) => (
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
                        borderColor: getStatusColor(app.status),
                        color: getStatusColor(app.status)
                      }}
                    >
                      {formatStatusName(app.status)}
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
          {safeStats.priorityBreakdown.length > 0 ? (
            <div className="flex space-x-6">
              {safeStats.priorityBreakdown.map((item) => (
                <div key={item.priority} className="text-center">
                  <div className="text-2xl font-bold">
                    {item._count}
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
'use client'

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityList } from "@/components/activities";
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Building2, 
  MapPin, 
  Calendar,
  DollarSign,
  Flag,
  Star,
  Loader2
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { jobApplicationsApi } from '@/lib/api';
import { type JobApplication } from '@/types';
import { formatStatusName, getStatusColor, getPriorityInfo, formatSalary } from '@/lib/status-utils';
import { formatDistanceToNow } from 'date-fns';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const applicationId = params.id as string;

  const { data: applicationData, isLoading, error } = useQuery({
    queryKey: ['job-application', applicationId],
    queryFn: async () => {
      const response = await jobApplicationsApi.getById(applicationId);
      return response.data.data.jobApplication;
    },
    enabled: !!applicationId,
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: () => jobApplicationsApi.delete(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success('Application deleted successfully');
      router.push('/applications');
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Failed to delete application';
      toast.error(errorMessage || 'Failed to delete application');
    },
  });

  const handleDelete = () => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Delete Application</h3>
            <p className="text-sm text-gray-600">Are you sure you want to delete this application? This action cannot be undone.</p>
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
              deleteApplicationMutation.mutate();
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

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !applicationData) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center space-x-2">
          <Link href="/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Application Not Found</CardTitle>
            <CardDescription>
              The job application you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const application = applicationData as JobApplication;
  const priority = getPriorityInfo(application.priority);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/applications/${application.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteApplicationMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteApplicationMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Application Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{application.jobTitle}</CardTitle>
                    {application.isFavorite && (
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-lg text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {application.company.name}
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className="text-sm"
                  style={{ 
                    borderColor: getStatusColor(application.status) || '#6B7280',
                    color: getStatusColor(application.status) || '#6B7280'
                  }}
                >
                  {formatStatusName(application.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Priority</div>
                  <Badge variant={priority.variant}>{priority.label}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Applied</div>
                  <div className="text-sm font-medium">
                    {new Date(application.appliedDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Job Level</div>
                  <div className="text-sm font-medium">
                    {application.jobLevel || 'Not specified'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="text-sm font-medium">
                    {application.employmentType?.replace('_', ' ') || 'Not specified'}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-4">
                {application.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {application.isRemote ? 'Remote' : application.location}
                      {application.isRemote && application.location && ` (${application.location})`}
                    </span>
                  </div>
                )}

                {(application.salaryMin || application.salaryMax) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatSalary(application.salaryMin || 0, application.salaryMax || 0, application.currency)}
                    </span>
                  </div>
                )}

                {application.responseDeadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Response deadline: {new Date(application.responseDeadline).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {application.source && (
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Source: {application.source}</span>
                  </div>
                )}

                {application.jobUrl && (
                  <div>
                    <a 
                      href={application.jobUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Job Posting
                    </a>
                  </div>
                )}
              </div>

              {/* Job Description */}
              {application.jobDescription && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Job Description</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.jobDescription}
                    </div>
                  </div>
                </>
              )}

              {/* Requirements */}
              {application.requirements && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Requirements</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.requirements}
                    </div>
                  </div>
                </>
              )}

              {/* Personal Notes */}
              {application.personalNotes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Personal Notes</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.personalNotes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Company Info */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">{application.company.name}</h4>
                {application.company.industry && (
                  <p className="text-sm text-muted-foreground">{application.company.industry}</p>
                )}
                {application.company.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{application.company.location}</span>
                  </div>
                )}
                {application.company.website && (
                  <div>
                    <a 
                      href={application.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Company Website
                    </a>
                  </div>
                )}
              </div>

              {application.company.description && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">About</h4>
                    <p className="text-sm text-muted-foreground">
                      {application.company.description}
                    </p>
                  </div>
                </>
              )}

              <Separator />
              <div className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Timeline */}
      <ActivityList jobApplicationId={application.id} />
    </div>
  );
} 
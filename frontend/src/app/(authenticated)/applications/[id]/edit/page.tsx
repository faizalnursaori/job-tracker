'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { jobApplicationsApi, companiesApi } from '@/lib/api';
import { type JobApplication, type JobApplicationFormData } from '@/types';

export default function EditApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const applicationId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<JobApplicationFormData>>({});
  
  const [formData, setFormData] = useState<JobApplicationFormData>({
    jobTitle: '',
    companyName: '',
    status: 'APPLIED',
    jobLevel: '',
    employmentType: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    location: '',
    isRemote: false,
    jobUrl: '',
    jobDescription: '',
    requirements: '',
    appliedDate: '',
    responseDeadline: '',
    personalNotes: '',
    priority: '2',
    source: '',
    isFavorite: false,
  });

  // Fetch application data
  const { data: applicationData, isLoading: applicationLoading, error: applicationError } = useQuery({
    queryKey: ['job-application', applicationId],
    queryFn: async () => {
      const response = await jobApplicationsApi.getById(applicationId);
      return response.data.data.jobApplication;
    },
    enabled: !!applicationId,
  });



  // Fetch companies
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await companiesApi.getAll({ limit: 100 });
      return response.data.data;
    },
  });

  // Fetch statuses - for future use
  // const { data: statusesData } = useQuery({
  //   queryKey: ['statuses'],
  //   queryFn: async () => {
  //     const response = await statusesApi.getAll();
  //     return response.data.data;
  //   },
  // });

  // Populate form when data is loaded
  useEffect(() => {
    if (applicationData) {
      const app = applicationData as JobApplication;
      setFormData({
        jobTitle: app.jobTitle || '',
        companyName: app.company?.name || '',
        status: app.status || 'APPLIED',
        jobLevel: app.jobLevel || '',
        employmentType: app.employmentType || '',
        salaryMin: app.salaryMin ? app.salaryMin.toString() : '',
        salaryMax: app.salaryMax ? app.salaryMax.toString() : '',
        currency: app.currency || 'USD',
        location: app.location || '',
        isRemote: app.isRemote || false,
        jobUrl: app.jobUrl || '',
        jobDescription: app.jobDescription || '',
        requirements: app.requirements || '',
        appliedDate: app.appliedDate ? new Date(app.appliedDate).toISOString().split('T')[0] : '',
        responseDeadline: app.responseDeadline ? new Date(app.responseDeadline).toISOString().split('T')[0] : '',
        personalNotes: app.personalNotes || '',
        priority: app.priority ? app.priority.toString() : '2',
        source: app.source || '',
        isFavorite: app.isFavorite || false,
      });
    }
  }, [applicationData]);

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async (data: Partial<JobApplicationFormData>) => {
      // Handle company creation/lookup if needed
      let companyId;
      
      if (data.companyName) {
        // First, try to find existing company by name
        const existingCompany = companies.find(
          (company: { id: string; name: string }) => company.name.toLowerCase() === data.companyName!.toLowerCase()
        );
        
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create new company if it doesn't exist
          try {
            const companyResponse = await companiesApi.create({
              name: data.companyName,
            });
            companyId = companyResponse.data.data.company.id;
          } catch (error: unknown) {
            // If company already exists, try to find it by refetching companies
            const errorObj = error as { response?: { status?: number; data?: { error?: { message?: string } } } };
            if (errorObj.response?.status === 400 && errorObj.response?.data?.error?.message?.includes('already exists')) {
              try {
                // Refetch companies to get the latest list
                const companiesResponse = await companiesApi.getAll({ limit: 100 });
                const updatedCompanies = companiesResponse.data.data.companies || [];
                
                const existingCompany = updatedCompanies.find(
                  (company: { id: string; name: string }) => company.name.toLowerCase() === data.companyName!.toLowerCase()
                );
                
                if (existingCompany) {
                  companyId = existingCompany.id;
                } else {
                  throw error;
                }
              } catch {
                throw error;
              }
            } else {
              throw error;
            }
          }
        }
      }
      
      const payload = {
        ...data,
        companyId,
        status: data.status as 'APPLIED' | 'PHONE_SCREEN' | 'TECHNICAL_TEST' | 'FINAL_INTERVIEW' | 'OFFER' | 'NEGOTIATION' | 'ACCEPTED' | 'REJECTED' | 'ON_HOLD',
        salaryMin: data.salaryMin ? parseFloat(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? parseFloat(data.salaryMax) : undefined,
        priority: parseInt(data.priority || '2'),
        appliedDate: data.appliedDate ? new Date(data.appliedDate).toISOString() : undefined,
        responseDeadline: data.responseDeadline 
          ? new Date(data.responseDeadline).toISOString() 
          : undefined,
        jobLevel: (data.jobLevel || undefined) as 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR' | undefined,
        employmentType: (data.employmentType || undefined) as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE' | undefined,
      };
      
      // Remove companyName from payload as backend expects companyId
      delete payload.companyName;
      
      const response = await jobApplicationsApi.update(applicationId, payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success('Application updated successfully!');
      router.push(`/applications/${applicationId}`);
    },
    onError: (error: unknown) => {
      const errorObj = error as { response?: { data?: { error?: { message?: string }; errors?: Partial<JobApplicationFormData> } } };
      const errorMessage = errorObj.response?.data?.error?.message || 'Failed to update application';
      toast.error(errorMessage);
      
      // Handle validation errors
      if (errorObj.response?.data?.errors) {
        setErrors(errorObj.response.data.errors);
      }
    },
  });

  const handleInputChange = (field: keyof JobApplicationFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<JobApplicationFormData> = {};
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    
    if (!formData.appliedDate) {
      newErrors.appliedDate = 'Applied date is required';
    }
    
    if (formData.salaryMin && formData.salaryMax) {
      const min = parseFloat(formData.salaryMin);
      const max = parseFloat(formData.salaryMax);
      if (min > max) {
        newErrors.salaryMax = 'Maximum salary must be greater than minimum salary';
      }
    }

    if (formData.jobUrl && !isValidUrl(formData.jobUrl)) {
      newErrors.jobUrl = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors below');
      return;
    }

    setIsLoading(true);
    try {
      await updateApplicationMutation.mutateAsync(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const companies = companiesData?.companies || [];

  if (applicationLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (applicationError || !applicationData) {
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
              The job application you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have permission to edit it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Link href={`/applications/${applicationId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Application
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Edit Application</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details about the job position
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="e.g., Senior Frontend Developer"
                className={errors.jobTitle ? 'border-red-500' : ''}
              />
              {errors.jobTitle && (
                <p className="text-sm text-red-500">{errors.jobTitle}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="e.g., Google, Microsoft, Apple"
                className={errors.companyName ? 'border-red-500' : ''}
                disabled={true} 
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="PHONE_SCREEN">Phone Screen</SelectItem>
                  <SelectItem value="FINAL_INTERVIEW">Final Interview</SelectItem>
                  <SelectItem value="TECHNICAL_TEST">Technical Test</SelectItem>
                  <SelectItem value="OFFER">Offer</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Additional information about the position
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobLevel">Job Level</Label>
              <Select 
                value={formData.jobLevel} 
                onValueChange={(value) => handleInputChange('jobLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRY">Entry Level</SelectItem>
                  <SelectItem value="MID">Mid Level</SelectItem>
                  <SelectItem value="SENIOR">Senior Level</SelectItem>
                  <SelectItem value="LEAD">Lead</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="DIRECTOR">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select 
                value={formData.employmentType} 
                onValueChange={(value) => handleInputChange('employmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="FREELANCE">Freelance</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isRemote">Remote Work</Label>
              <Select 
                value={formData.isRemote.toString()} 
                onValueChange={(value) => handleInputChange('isRemote', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">On-site</SelectItem>
                  <SelectItem value="true">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
            <CardDescription>
              Salary and compensation details
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Minimum Salary</Label>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                placeholder="e.g., 100000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMax">Maximum Salary</Label>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                placeholder="e.g., 150000"
                className={errors.salaryMax ? 'border-red-500' : ''}
              />
              {errors.salaryMax && (
                <p className="text-sm text-red-500">{errors.salaryMax}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="IDR">IDR (Rp)</SelectItem>
                  <SelectItem value="SGD">SGD (S$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>
              Important dates and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appliedDate">Applied Date *</Label>
              <Input
                id="appliedDate"
                type="date"
                value={formData.appliedDate}
                onChange={(e) => handleInputChange('appliedDate', e.target.value)}
                className={errors.appliedDate ? 'border-red-500' : ''}
              />
              {errors.appliedDate && (
                <p className="text-sm text-red-500">{errors.appliedDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseDeadline">Response Deadline</Label>
              <Input
                id="responseDeadline"
                type="date"
                value={formData.responseDeadline}
                onChange={(e) => handleInputChange('responseDeadline', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Extra details and notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobUrl">Job Posting URL</Label>
              <Input
                id="jobUrl"
                type="url"
                value={formData.jobUrl}
                onChange={(e) => handleInputChange('jobUrl', e.target.value)}
                placeholder="https://company.com/careers/job-id"
                className={errors.jobUrl ? 'border-red-500' : ''}
              />
              {errors.jobUrl && (
                <p className="text-sm text-red-500">{errors.jobUrl}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="e.g., LinkedIn, Company Website, Referral"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                placeholder="Paste the job description here..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Key requirements and qualifications..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalNotes">Personal Notes</Label>
              <Textarea
                id="personalNotes"
                value={formData.personalNotes}
                onChange={(e) => handleInputChange('personalNotes', e.target.value)}
                placeholder="Your thoughts, impressions, or follow-up actions..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFavorite"
                checked={formData.isFavorite}
                onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <Label htmlFor="isFavorite">Mark as favorite</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link href={`/applications/${applicationId}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isLoading || updateApplicationMutation.isPending}
            className="min-w-32"
          >
            {(isLoading || updateApplicationMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 
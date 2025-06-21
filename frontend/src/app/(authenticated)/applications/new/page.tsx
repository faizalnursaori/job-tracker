'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { jobApplicationsApi, companiesApi, statusesApi } from '@/lib/api';

interface FormData {
  jobTitle: string;
  companyId: string;
  statusId: string;
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
  companyName: string;
}

export default function NewApplicationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const [formData, setFormData] = useState<FormData>({
    jobTitle: '',
    companyId: '',
    statusId: '',
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
    appliedDate: new Date().toISOString().split('T')[0],
    responseDeadline: '',
    personalNotes: '',
    priority: '2',
    source: '',
    companyName: '',
  });

  // Fetch companies
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await companiesApi.getAll({ limit: 100 });
      return response.data.data;
    },
  });

  // Fetch statuses
  const { data: statusesData, isLoading: statusesLoading } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const response = await statusesApi.getAll();
      return response.data.data;
    },
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      // Handle company creation if needed
      let companyId = data.companyId;
      
      if (!companyId && data.companyName) {
        // Create new company
        try {
          const companyResponse = await companiesApi.create({
            name: data.companyName,
          });
          companyId = companyResponse.data.data.company.id;
        } catch (error: any) {
          // If company already exists, try to find it
          if (error.response?.status === 400) {
            const existingCompany = companies.find(
              (company: any) => company.name.toLowerCase() === data.companyName!.toLowerCase()
            );
            if (existingCompany) {
              companyId = existingCompany.id;
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }
      
      const payload = {
        ...data,
        companyId,
        salaryMin: data.salaryMin ? parseFloat(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? parseFloat(data.salaryMax) : undefined,
        priority: parseInt(data.priority || '2'),
        appliedDate: new Date(data.appliedDate!).toISOString(),
        responseDeadline: data.responseDeadline 
          ? new Date(data.responseDeadline).toISOString() 
          : undefined,
        jobLevel: (data.jobLevel || undefined) as any,
        employmentType: (data.employmentType || undefined) as any,
      };
      
      // Remove companyName from payload as backend expects companyId
      delete payload.companyName;
      
      const response = await jobApplicationsApi.create(payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch applications list
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success('Application created successfully!');
      router.push('/applications');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create application';
      toast.error(errorMessage);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
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
    const newErrors: Partial<FormData> = {};
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company is required';
    }
    
    if (!formData.statusId) {
      newErrors.statusId = 'Status is required';
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
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }
    
    setIsLoading(true);
    try {
      await createApplicationMutation.mutateAsync(formData);
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsLoading(false);
    }
  };

  const companies = companiesData?.companies || [];
  const statuses = statusesData?.statuses || [];

  if (companiesLoading || statusesLoading) {
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

        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Add New Application</h2>
        </div>

        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-64 bg-gray-200 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Add New Application</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details about the job position
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className={errors.jobTitle ? 'border-red-500' : ''}
              />
              {errors.jobTitle && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.jobTitle}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <div className="relative">
                <Input
                  id="company"
                  value={formData.companyName || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('companyName', value);
                    
                    // Auto-search for existing companies
                    if (value.length >= 2) {
                      // Find matching company
                      const matchingCompany = companies.find(
                        (company: any) => company.name.toLowerCase().includes(value.toLowerCase())
                      );
                      if (matchingCompany) {
                        handleInputChange('companyId', matchingCompany.id);
                      } else {
                        handleInputChange('companyId', '');
                      }
                    }
                  }}
                  placeholder="e.g. Google, Microsoft, Netflix..."
                  className={errors.companyName ? 'border-red-500' : ''}
                  autoComplete="organization"
                />
                
                {/* Autocomplete suggestions */}
                {formData.companyName && formData.companyName.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {companies
                      .filter((company: any) => 
                        company.name.toLowerCase().includes(formData.companyName.toLowerCase()) &&
                        company.name.toLowerCase() !== formData.companyName.toLowerCase()
                      )
                      .slice(0, 5)
                      .map((company: any) => (
                        <button
                          key={company.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => {
                            handleInputChange('companyName', company.name);
                            handleInputChange('companyId', company.id);
                          }}
                        >
                          <div className="font-medium">{company.name}</div>
                          {company.industry && (
                            <div className="text-sm text-gray-500">{company.industry}</div>
                          )}
                        </button>
                      ))
                    }
                    
                    {/* Show "Create new company" option if no exact match */}
                    {formData.companyName && 
                     !companies.some((company: any) => 
                       company.name.toLowerCase() === formData.companyName.toLowerCase()
                     ) && (
                      <div className="px-3 py-2 border-t border-gray-100">
                        <div className="text-sm text-gray-600">
                          Create new company: <span className="font-medium">"{formData.companyName}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {errors.companyName && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.companyName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.statusId} 
                onValueChange={(value) => handleInputChange('statusId', value)}
              >
                <SelectTrigger className={errors.statusId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status: any) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.statusId && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.statusId}
                </p>
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
                placeholder="e.g. San Francisco, CA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="e.g. LinkedIn, Company Website"
              />
            </div>
          </CardContent>
        </Card>

        {/* Salary & Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Salary & Dates</CardTitle>
            <CardDescription>
              Salary expectations and important dates
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Minimum Salary</Label>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                placeholder="e.g. 100000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMax">Maximum Salary</Label>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                placeholder="e.g. 120000"
                className={errors.salaryMax ? 'border-red-500' : ''}
              />
              {errors.salaryMax && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.salaryMax}
                </p>
              )}
            </div>

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
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.appliedDate}
                </p>
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
              Job description, requirements, and personal notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobUrl">Job URL</Label>
              <Input
                id="jobUrl"
                type="url"
                value={formData.jobUrl}
                onChange={(e) => handleInputChange('jobUrl', e.target.value)}
                placeholder="https://company.com/jobs/123"
                className={errors.jobUrl ? 'border-red-500' : ''}
              />
              {errors.jobUrl && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.jobUrl}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                placeholder="Copy and paste the job description here..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Key requirements and skills needed..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalNotes">Personal Notes</Label>
              <Textarea
                id="personalNotes"
                value={formData.personalNotes}
                onChange={(e) => handleInputChange('personalNotes', e.target.value)}
                placeholder="Your thoughts, research, or other notes about this opportunity..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link href="/applications">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isLoading || createApplicationMutation.isPending}
          >
            {isLoading || createApplicationMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 
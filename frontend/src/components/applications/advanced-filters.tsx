'use client'

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Filter,
  CalendarIcon,
  DollarSign,
  Search,
  SlidersHorizontal,
  Check,
  ChevronDown
} from "lucide-react";
import { jobApplicationsApi, type JobApplicationFilters, type FilterOptions } from '@/lib/api';
import { cn } from "@/lib/utils";

interface AdvancedFiltersProps {
  filters: JobApplicationFilters;
  onFiltersChange: (filters: JobApplicationFilters) => void;
  onReset: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, onReset }: AdvancedFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tempFilters, setTempFilters] = useState<JobApplicationFilters>(filters);

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const response = await jobApplicationsApi.getFilterOptions();
      return response.data.data as FilterOptions;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateFilter = (key: keyof JobApplicationFilters, value: any) => {
    const newFilters = { ...tempFilters, [key]: value };
    setTempFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (key: keyof JobApplicationFilters) => {
    const newFilters = { ...tempFilters };
    delete newFilters[key];
    setTempFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setTempFilters({
      page: tempFilters.page,
      limit: tempFilters.limit,
      sortBy: tempFilters.sortBy,
      sortOrder: tempFilters.sortOrder
    });
    onReset();
    setShowAdvanced(false);
  };

  const handleReset = () => {
    clearAllFilters();
  };

  const activeFiltersCount = Object.keys(filters).filter(key => 
    key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder' && filters[key as keyof JobApplicationFilters]
  ).length;

  // Keyboard shortcut to clear all filters
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'Backspace' && activeFiltersCount > 0) {
        event.preventDefault();
        clearAllFilters();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeFiltersCount, clearAllFilters]);

  const formatFilterLabel = (key: string, value: any): string => {
    switch (key) {
      case 'status':
        return Array.isArray(value) ? `Status: ${value.join(', ')}` : `Status: ${value}`;
      case 'priority':
        const priorityLabels = { 1: 'High', 2: 'Medium', 3: 'Low' };
        return Array.isArray(value) 
          ? `Priority: ${value.map(p => priorityLabels[p as keyof typeof priorityLabels]).join(', ')}`
          : `Priority: ${priorityLabels[value as keyof typeof priorityLabels]}`;
      case 'jobLevel':
        return Array.isArray(value) ? `Level: ${value.join(', ')}` : `Level: ${value}`;
      case 'employmentType':
        return Array.isArray(value) ? `Type: ${value.join(', ')}` : `Type: ${value}`;
      case 'isRemote':
        return value ? 'Remote: Yes' : 'Remote: No';
      case 'isFavorite':
        return value ? 'Favorites Only' : 'Not Favorites';
      case 'salaryMin':
        return `Min Salary: ${new Intl.NumberFormat().format(value)}`;
      case 'salaryMax':
        return `Max Salary: ${new Intl.NumberFormat().format(value)}`;
      case 'appliedDateFrom':
        return `Applied From: ${new Date(value).toLocaleDateString()}`;
      case 'appliedDateTo':
        return `Applied To: ${new Date(value).toLocaleDateString()}`;
      case 'location':
        return `Location: ${value}`;
      case 'source':
        return `Source: ${value}`;
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Filter and search your job applications
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Advanced
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
              </Button>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title, company, or notes..."
                value={tempFilters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value || undefined)}
                className="pl-8"
              />
            </div>
            <Select
              value={tempFilters.searchFields?.join(',') || 'all'}
              onValueChange={(value) => updateFilter('searchFields', value === 'all' ? undefined : value.split(','))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Search in..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {filterOptions?.searchFields?.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
                <SelectItem value="jobTitle,companyName,personalNotes">Custom Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Quick actions:</span>
              <div className="flex flex-wrap gap-1">
                {tempFilters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter('search')}
                    className="h-6 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Clear search
                  </Button>
                )}
                {tempFilters.status && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter('status')}
                    className="h-6 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Clear status
                  </Button>
                )}
                {(tempFilters.salaryMin || tempFilters.salaryMax) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeFilter('salaryMin');
                      removeFilter('salaryMax');
                    }}
                    className="h-6 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Clear salary
                  </Button>
                )}
                {(tempFilters.appliedDateFrom || tempFilters.appliedDateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeFilter('appliedDateFrom');
                      removeFilter('appliedDateTo');
                    }}
                    className="h-6 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Clear dates
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Quick Status Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={Array.isArray(tempFilters.status) ? 'all' : tempFilters.status || 'all'}
                onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {filterOptions?.statuses?.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Company</Label>
              <Select
                value={tempFilters.company || 'all'}
                onValueChange={(value) => updateFilter('company', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {filterOptions?.companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={Array.isArray(tempFilters.priority) ? 'all' : tempFilters.priority?.toString() || 'all'}
                onValueChange={(value) => updateFilter('priority', value === 'all' ? undefined : Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {filterOptions?.priorities?.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value.toString()}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Job Level */}
                <div>
                  <Label>Job Level</Label>
                  <Select
                    value={Array.isArray(tempFilters.jobLevel) ? 'all' : tempFilters.jobLevel || 'all'}
                    onValueChange={(value) => updateFilter('jobLevel', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      {filterOptions?.jobLevels?.map((level) => (
                        <SelectItem key={level} value={level!}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employment Type */}
                <div>
                  <Label>Employment Type</Label>
                  <Select
                    value={Array.isArray(tempFilters.employmentType) ? 'all' : tempFilters.employmentType || 'all'}
                    onValueChange={(value) => updateFilter('employmentType', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {filterOptions?.employmentTypes?.map((type) => (
                        <SelectItem key={type} value={type!}>
                          {type?.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Remote Work */}
                <div>
                  <Label>Remote Work</Label>
                  <Select
                    value={tempFilters.isRemote === true ? 'true' : tempFilters.isRemote === false ? 'false' : 'all'}
                    onValueChange={(value) => updateFilter('isRemote', value === 'all' ? undefined : value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      <SelectItem value="true">Remote only</SelectItem>
                      <SelectItem value="false">On-site only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="Filter by location..."
                    value={tempFilters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value || undefined)}
                  />
                </div>

                {/* Source */}
                <div>
                  <Label>Source</Label>
                  <Input
                    placeholder="Filter by source..."
                    value={tempFilters.source || ''}
                    onChange={(e) => updateFilter('source', e.target.value || undefined)}
                  />
                </div>

                {/* Favorites */}
                <div>
                  <Label>Favorites</Label>
                  <Select
                    value={tempFilters.isFavorite === true ? 'true' : tempFilters.isFavorite === false ? 'false' : 'all'}
                    onValueChange={(value) => updateFilter('isFavorite', value === 'all' ? undefined : value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All applications" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All applications</SelectItem>
                      <SelectItem value="true">Favorites only</SelectItem>
                      <SelectItem value="false">Non-favorites only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Salary Range */}
              <div className="space-y-2">
                <Label>Salary Range</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Min salary"
                    value={tempFilters.salaryMin || ''}
                    onChange={(e) => updateFilter('salaryMin', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Max salary"
                    value={tempFilters.salaryMax || ''}
                    onChange={(e) => updateFilter('salaryMax', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Select
                    value={tempFilters.currency || 'IDR'}
                    onValueChange={(value) => updateFilter('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions?.currencies?.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Applied Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={tempFilters.appliedDateFrom?.split('T')[0] || ''}
                      onChange={(e) => updateFilter('appliedDateFrom', e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined)}
                    />
                    <Input
                      type="date"
                      value={tempFilters.appliedDateTo?.split('T')[0] || ''}
                      onChange={(e) => updateFilter('appliedDateTo', e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Response Deadline Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={tempFilters.responseDeadlineFrom?.split('T')[0] || ''}
                      onChange={(e) => updateFilter('responseDeadlineFrom', e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined)}
                    />
                    <Input
                      type="date"
                      value={tempFilters.responseDeadlineTo?.split('T')[0] || ''}
                      onChange={(e) => updateFilter('responseDeadlineTo', e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Active Filters ({activeFiltersCount})</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') return null;
                  return (
                    <Badge 
                      key={key} 
                      variant="secondary" 
                      className="gap-1 pr-1 hover:bg-secondary/80 transition-colors group"
                    >
                      <span className="text-xs">{formatFilterLabel(key, value)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(key as keyof JobApplicationFilters)}
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${key} filter`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                Click the × on any filter to remove it, or use "Clear all" to reset all filters.
                <br />
                <kbd className="px-1 py-0.5 text-xs bg-muted border rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 text-xs bg-muted border rounded">Backspace</kbd> to clear all filters quickly.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
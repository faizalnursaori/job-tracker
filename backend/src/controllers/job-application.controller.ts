import { Response } from 'express';
import { prisma } from '../app';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError, asyncHandler } from '../middlewares/error.middleware';
import { StatusType } from '@prisma/client';

// Get all job applications for user with advanced filtering
export const getJobApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    page = 1,
    limit = 10,
    status,
    company,
    priority,
    jobLevel,
    employmentType,
    location,
    isRemote,
    isFavorite,
    source,
    appliedDateFrom,
    appliedDateTo,
    responseDeadlineFrom,
    responseDeadlineTo,
    salaryMin,
    salaryMax,
    currency,
    search,
    searchFields,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    hasNotes,
    hasDeadline,
    isOverdue
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build where clause
  const where: any = { userId };

  // Status filters (single or array)
  if (status) {
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else {
      where.status = status;
    }
  }

  // Company filter
  if (company) {
    where.companyId = company;
  }

  // Priority filters (single or array)
  if (priority) {
    if (Array.isArray(priority)) {
      where.priority = { in: priority.map(Number) };
    } else {
      where.priority = Number(priority);
    }
  }

  // Job level filters (single or array)
  if (jobLevel) {
    if (Array.isArray(jobLevel)) {
      where.jobLevel = { in: jobLevel };
    } else {
      where.jobLevel = jobLevel;
    }
  }

  // Employment type filters (single or array)
  if (employmentType) {
    if (Array.isArray(employmentType)) {
      where.employmentType = { in: employmentType };
    } else {
      where.employmentType = employmentType;
    }
  }

  // Location filter (partial match)
  if (location) {
    where.location = { contains: location as string };
  }

  // Boolean filters
  if (isRemote !== undefined) where.isRemote = isRemote;
  if (isFavorite !== undefined) where.isFavorite = isFavorite;

  // Source filter
  if (source) {
    where.source = { contains: source as string };
  }

  // Date range filters
  if (appliedDateFrom || appliedDateTo) {
    where.appliedDate = {};
    if (appliedDateFrom) where.appliedDate.gte = new Date(appliedDateFrom as string);
    if (appliedDateTo) where.appliedDate.lte = new Date(appliedDateTo as string);
  }

  if (responseDeadlineFrom || responseDeadlineTo) {
    where.responseDeadline = {};
    if (responseDeadlineFrom) where.responseDeadline.gte = new Date(responseDeadlineFrom as string);
    if (responseDeadlineTo) where.responseDeadline.lte = new Date(responseDeadlineTo as string);
  }

  // Salary range filters
  if (salaryMin !== undefined || salaryMax !== undefined) {
    where.AND = where.AND || [];
    if (salaryMin !== undefined) {
      where.AND.push({
        OR: [
          { salaryMin: { gte: Number(salaryMin) } },
          { salaryMax: { gte: Number(salaryMin) } }
        ]
      });
    }
    if (salaryMax !== undefined) {
      where.AND.push({
        OR: [
          { salaryMin: { lte: Number(salaryMax) } },
          { salaryMax: { lte: Number(salaryMax) } }
        ]
      });
    }
  }

  // Currency filter
  if (currency) {
    where.currency = currency;
  }

  // Advanced boolean filters
  if (hasNotes !== undefined) {
    if (hasNotes) {
      where.notes = { some: {} };
    } else {
      where.notes = { none: {} };
    }
  }

  if (hasDeadline !== undefined) {
    if (hasDeadline) {
      where.responseDeadline = { not: null };
    } else {
      where.responseDeadline = null;
    }
  }

  if (isOverdue !== undefined && isOverdue) {
    where.responseDeadline = { 
      not: null,
      lt: new Date()
    };
  }

  // Search functionality with configurable fields
  if (search) {
    const searchConditions: any[] = [];
    const defaultSearchFields = ['jobTitle', 'companyName', 'personalNotes'];
    const fieldsArray = Array.isArray(searchFields) ? searchFields : [];
    const fieldsToSearch = fieldsArray.length > 0 ? fieldsArray : defaultSearchFields;

    fieldsToSearch.forEach((field) => {
      switch (field) {
        case 'jobTitle':
          searchConditions.push({ jobTitle: { contains: search as string } });
          break;
        case 'companyName':
          searchConditions.push({ company: { name: { contains: search as string } } });
          break;
        case 'personalNotes':
          searchConditions.push({ personalNotes: { contains: search as string } });
          break;
        case 'jobDescription':
          searchConditions.push({ jobDescription: { contains: search as string } });
          break;
        case 'requirements':
          searchConditions.push({ requirements: { contains: search as string } });
          break;
        case 'location':
          searchConditions.push({ location: { contains: search as string } });
          break;
      }
    });

    if (searchConditions.length > 0) {
      where.OR = searchConditions;
    }
  }

  // Handle sorting
  let orderBy: any = {};
  switch (sortBy) {
    case 'companyName':
      orderBy = { company: { name: sortOrder } };
      break;
    default:
      orderBy = { [sortBy as string]: sortOrder };
  }

  // Get total count and data
  const [total, jobApplications] = await Promise.all([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            location: true,
            logoUrl: true
          }
        },
        _count: {
          select: {
            notes: true,
            activities: true
          }
        }
      },
      orderBy,
      skip,
      take: Number(limit)
    })
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  res.status(200).json({
    success: true,
    data: {
      jobApplications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: totalPages
      }
    }
  });
});

// Get available filter options
export const getFilterOptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    includeCompanies = true,
    includeStatuses = true,
    includeJobLevels = true,
    includeEmploymentTypes = true,
    includeSources = true,
    includeLocations = true
  } = req.query;

  const results: any = {};

  // Get all unique values from user's job applications
  const promises = [];

  if (includeCompanies) {
    promises.push(
      prisma.jobApplication.findMany({
        where: { userId },
        select: { company: { select: { id: true, name: true } } },
        distinct: ['companyId']
      }).then(data => {
        results.companies = data.map(item => item.company);
      })
    );
  }

  if (includeStatuses) {
    promises.push(
      prisma.jobApplication.findMany({
        where: { userId },
        select: { status: true },
        distinct: ['status']
      }).then(data => {
        results.statuses = data.map(item => item.status);
      })
    );
  }

  if (includeJobLevels) {
    promises.push(
      prisma.jobApplication.findMany({
        where: { userId, jobLevel: { not: null } },
        select: { jobLevel: true },
        distinct: ['jobLevel']
      }).then(data => {
        results.jobLevels = data.map(item => item.jobLevel).filter(Boolean);
      })
    );
  }

  if (includeEmploymentTypes) {
    promises.push(
      prisma.jobApplication.findMany({
        where: { userId, employmentType: { not: null } },
        select: { employmentType: true },
        distinct: ['employmentType']
      }).then(data => {
        results.employmentTypes = data.map(item => item.employmentType).filter(Boolean);
      })
    );
  }

  if (includeSources) {
    promises.push(
      prisma.jobApplication.findMany({
        where: { userId, source: { not: null } },
        select: { source: true },
        distinct: ['source']
      }).then(data => {
        results.sources = data.map(item => item.source).filter(Boolean);
      })
    );
  }

  if (includeLocations) {
    promises.push(
      prisma.jobApplication.findMany({
        where: { userId, location: { not: null } },
        select: { location: true },
        distinct: ['location']
      }).then(data => {
        results.locations = data.map(item => item.location).filter(Boolean);
      })
    );
  }

  await Promise.all(promises);

  // Add static enum options
  results.priorities = [
    { value: 1, label: 'High' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'Low' }
  ];

  results.currencies = ['IDR', 'USD', 'EUR', 'GBP', 'SGD', 'AUD'];

  results.searchFields = [
    { value: 'jobTitle', label: 'Job Title' },
    { value: 'companyName', label: 'Company Name' },
    { value: 'personalNotes', label: 'Personal Notes' },
    { value: 'jobDescription', label: 'Job Description' },
    { value: 'requirements', label: 'Requirements' },
    { value: 'location', label: 'Location' }
  ];

  res.status(200).json({
    success: true,
    data: results
  });
});

// Get single job application
export const getJobApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const jobApplication = await prisma.jobApplication.findFirst({
    where: { id, userId },
    include: {
      company: true,
      notes: {
        orderBy: { noteDate: 'desc' }
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  if (!jobApplication) {
    throw createError('Job application not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { jobApplication }
  });
});

// Create job application
export const createJobApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const data = req.body;

  // Verify company exists and status is valid
  const company = await prisma.company.findUnique({ where: { id: data.companyId } });
  if (!company) throw createError('Company not found', 404);

  // Validate status enum
  if (data.status && !Object.values(StatusType).includes(data.status)) {
    throw createError('Invalid status', 400);
  }

  const jobApplication = await prisma.jobApplication.create({
    data: {
      ...data,
      userId,
      status: data.status || StatusType.APPLIED,
      appliedDate: new Date(data.appliedDate),
      responseDeadline: data.responseDeadline ? new Date(data.responseDeadline) : null
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          industry: true,
          location: true,
          logoUrl: true
        }
      }
    }
  });

  // Create activity log
  await prisma.applicationActivity.create({
    data: {
      jobApplicationId: jobApplication.id,
      activity: 'Job application created',
      description: `Applied for ${data.jobTitle} at ${company.name}`,
      metadata: { source: data.source || 'Direct' }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Job application created successfully',
    data: { jobApplication }
  });
});

// Update job application
export const updateJobApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const data = req.body;

  // Check if job application exists and belongs to user
  const existingJobApp = await prisma.jobApplication.findFirst({
    where: { id, userId }
  });

  if (!existingJobApp) {
    throw createError('Job application not found', 404);
  }

  // Verify new company if provided
  if (data.companyId) {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) throw createError('Company not found', 404);
  }

  // Validate status enum if provided
  if (data.status && !Object.values(StatusType).includes(data.status)) {
    throw createError('Invalid status', 400);
  }

  // Track status change for activity log
  const statusChanged = data.status && data.status !== existingJobApp.status;
  const oldStatus = existingJobApp.status;

  const updatedJobApp = await prisma.jobApplication.update({
    where: { id },
    data: {
      ...data,
      appliedDate: data.appliedDate ? new Date(data.appliedDate) : undefined,
      responseDeadline: data.responseDeadline ? new Date(data.responseDeadline) : undefined
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          industry: true,
          location: true,
          logoUrl: true
        }
      }
    }
  });

  // Create activity log for status change
  if (statusChanged) {
    await prisma.applicationActivity.create({
      data: {
        jobApplicationId: id,
        activity: 'Status changed',
        description: `Status changed from ${oldStatus} to ${data.status}`,
        metadata: { oldStatus, newStatus: data.status }
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Job application updated successfully',
    data: { jobApplication: updatedJobApp }
  });
});

// Delete job application
export const deleteJobApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const jobApplication = await prisma.jobApplication.findFirst({
    where: { id, userId }
  });

  if (!jobApplication) {
    throw createError('Job application not found', 404);
  }

  await prisma.jobApplication.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Job application deleted successfully'
  });
});

// Get job application statistics
export const getJobApplicationStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [
    totalApplications,
    statusBreakdown,
    priorityBreakdown,
    recentApplications
  ] = await Promise.all([
    prisma.jobApplication.count({ where: { userId } }),
    
    prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: true
    }),
    
    prisma.jobApplication.groupBy({
      by: ['priority'],
      where: { userId },
      _count: true
    }),
    
    prisma.jobApplication.findMany({
      where: { userId },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  // Calculate success rate (offers / total applications)
  const offers = statusBreakdown.find(s => s.status === StatusType.OFFER)?._count || 0;
  const accepted = statusBreakdown.find(s => s.status === StatusType.ACCEPTED)?._count || 0;
  const successRate = totalApplications > 0 ? ((offers + accepted) / totalApplications) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      totalApplications,
      statusBreakdown,
      priorityBreakdown,
      recentApplications,
      successRate: Math.round(successRate * 100) / 100
    }
  });
}); 
import { Response } from 'express';
import { prisma } from '../app';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError, asyncHandler } from '../middlewares/error.middleware';
import { StatusType } from '@prisma/client';

// Get all job applications for user
export const getJobApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { 
    page = '1', 
    limit = '10', 
    status, 
    company, 
    priority, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build where clause
  const where: any = { userId };
  
  if (status) where.status = status;
  if (company) where.companyId = company;
  if (priority) where.priority = Number(priority);
  if (search) {
    where.OR = [
      { jobTitle: { contains: search as string } },
      { company: { name: { contains: search as string } } },
      { personalNotes: { contains: search as string } }
    ];
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
            notes: true
          }
        }
      },
      orderBy: {
        [sortBy as string]: sortOrder
      },
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
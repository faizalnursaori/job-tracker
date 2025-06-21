import { Response } from 'express';
import { prisma } from '../app';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError, asyncHandler } from '../middlewares/error.middleware';

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
  
  if (status) where.statusId = status;
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
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            sortOrder: true
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
      status: true,
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

  // Verify company and status exist
  const [company, status] = await Promise.all([
    prisma.company.findUnique({ where: { id: data.companyId } }),
    prisma.status.findUnique({ where: { id: data.statusId } })
  ]);

  if (!company) throw createError('Company not found', 404);
  if (!status) throw createError('Status not found', 404);

  const jobApplication = await prisma.jobApplication.create({
    data: {
      ...data,
      userId,
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
      },
      status: {
        select: {
          id: true,
          name: true,
          color: true
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
    where: { id, userId },
    include: { status: true }
  });

  if (!existingJobApp) {
    throw createError('Job application not found', 404);
  }

  // Verify new company and status if provided
  if (data.companyId) {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) throw createError('Company not found', 404);
  }

  if (data.statusId) {
    const status = await prisma.status.findUnique({ where: { id: data.statusId } });
    if (!status) throw createError('Status not found', 404);
  }

  const updatedJobApplication = await prisma.jobApplication.update({
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
      },
      status: {
        select: {
          id: true,
          name: true,
          color: true
        }
      }
    }
  });

  // Create activity log for status change
  if (data.statusId && data.statusId !== existingJobApp.statusId) {
    await prisma.applicationActivity.create({
      data: {
        jobApplicationId: id,
        activity: 'Status changed',
        description: `Status changed from ${existingJobApp.status.name} to ${updatedJobApplication.status.name}`,
        metadata: { 
          previousStatus: existingJobApp.status.name,
          newStatus: updatedJobApplication.status.name
        }
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Job application updated successfully',
    data: { jobApplication: updatedJobApplication }
  });
});

// Delete job application
export const deleteJobApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const jobApplication = await prisma.jobApplication.findFirst({
    where: { id, userId },
    include: { company: true }
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
    recentActivity
  ] = await Promise.all([
    prisma.jobApplication.count({ where: { userId } }),
    
    prisma.jobApplication.groupBy({
      by: ['statusId'],
      where: { userId },
      _count: { statusId: true },
      orderBy: { _count: { statusId: 'desc' } }
    }),
    
    prisma.jobApplication.groupBy({
      by: ['priority'],
      where: { userId },
      _count: { priority: true }
    }),

    prisma.jobApplication.findMany({
      where: { userId },
      include: {
        company: { select: { name: true } },
        status: { select: { name: true, color: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  // Get status names
  const statusIds = statusBreakdown.map((s: any) => s.statusId);
  const statuses = await prisma.status.findMany({
    where: { id: { in: statusIds } },
    select: { id: true, name: true, color: true }
  });

  const statusStats = statusBreakdown.map((stat: any) => {
    const status = statuses.find((s: any) => s.id === stat.statusId);
    return {
      status: status?.name || 'Unknown',
      color: status?.color,
      count: stat._count.statusId
    };
  });

  res.status(200).json({
    success: true,
    data: {
      totalApplications,
      statusBreakdown: statusStats,
      priorityBreakdown,
      recentActivity
    }
  });
}); 
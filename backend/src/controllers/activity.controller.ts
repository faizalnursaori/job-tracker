import { Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { 
  createActivitySchema, 
  updateActivitySchema, 
  getActivitiesQuerySchema 
} from '../validators/activity.validator';

export const getActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = getActivitiesQuerySchema.safeParse(req.query);
  
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: validation.error.errors
    });
  }

  const { jobApplicationId, limit = 50, offset = 0 } = validation.data;

  const whereClause = jobApplicationId ? { jobApplicationId } : {};

  const [activities, total] = await Promise.all([
    prisma.applicationActivity.findMany({
      where: whereClause,
      include: {
        jobApplication: {
          select: {
            id: true,
            jobTitle: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    }),
    prisma.applicationActivity.count({
      where: whereClause
    })
  ]);

  res.status(200).json({
    success: true,
    data: {
      activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  });
});

export const getActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const activity = await prisma.applicationActivity.findUnique({
    where: { id },
    include: {
      jobApplication: {
        select: {
          id: true,
          jobTitle: true,
          company: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!activity) {
    return res.status(404).json({
      success: false,
      message: 'Activity not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { activity }
  });
});

export const createActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = createActivitySchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input data',
      errors: validation.error.errors
    });
  }

  const { jobApplicationId, activity: activityText, description, metadata } = validation.data;

  // Verify job application exists and belongs to user
  const jobApplication = await prisma.jobApplication.findFirst({
    where: {
      id: jobApplicationId,
      userId: req.user!.id
    }
  });

  if (!jobApplication) {
    return res.status(404).json({
      success: false,
      message: 'Job application not found or unauthorized'
    });
  }

  const activity = await prisma.applicationActivity.create({
    data: {
      jobApplicationId,
      activity: activityText,
      description,
      metadata
    },
    include: {
      jobApplication: {
        select: {
          id: true,
          jobTitle: true,
          company: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Activity created successfully',
    data: { activity }
  });
});

export const updateActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const validation = updateActivitySchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input data',
      errors: validation.error.errors
    });
  }

  // Verify activity exists and user owns the related job application
  const existingActivity = await prisma.applicationActivity.findFirst({
    where: {
      id,
      jobApplication: {
        userId: req.user!.id
      }
    }
  });

  if (!existingActivity) {
    return res.status(404).json({
      success: false,
      message: 'Activity not found or unauthorized'
    });
  }

  const activity = await prisma.applicationActivity.update({
    where: { id },
    data: validation.data,
    include: {
      jobApplication: {
        select: {
          id: true,
          jobTitle: true,
          company: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Activity updated successfully',
    data: { activity }
  });
});

export const deleteActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Verify activity exists and user owns the related job application
  const existingActivity = await prisma.applicationActivity.findFirst({
    where: {
      id,
      jobApplication: {
        userId: req.user!.id
      }
    }
  });

  if (!existingActivity) {
    return res.status(404).json({
      success: false,
      message: 'Activity not found or unauthorized'
    });
  }

  await prisma.applicationActivity.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Activity deleted successfully'
  });
});

export const getActivitiesByJobApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobApplicationId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  // Verify job application exists and belongs to user
  const jobApplication = await prisma.jobApplication.findFirst({
    where: {
      id: jobApplicationId,
      userId: req.user!.id
    }
  });

  if (!jobApplication) {
    return res.status(404).json({
      success: false,
      message: 'Job application not found or unauthorized'
    });
  }

  const [activities, total] = await Promise.all([
    prisma.applicationActivity.findMany({
      where: { jobApplicationId },
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    }),
    prisma.applicationActivity.count({
      where: { jobApplicationId }
    })
  ]);

  res.status(200).json({
    success: true,
    data: {
      activities,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      }
    }
  });
}); 
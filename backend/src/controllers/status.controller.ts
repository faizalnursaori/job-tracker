import { Request, Response } from 'express';
import { prisma } from '../app';
import { createError, asyncHandler } from '../middlewares/error.middleware';

// Get all statuses
export const getStatuses = asyncHandler(async (req: Request, res: Response) => {
  const { includeInactive = 'false' } = req.query;

  const where: any = {};
  
  if (includeInactive !== 'true') {
    where.isActive = true;
  }

  const statuses = await prisma.status.findMany({
    where,
    include: {
      _count: {
        select: {
          jobApplications: true
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });

  res.status(200).json({
    success: true,
    data: { statuses }
  });
});

// Get single status
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const status = await prisma.status.findUnique({
    where: { id },
    include: {
      jobApplications: {
        select: {
          id: true,
          jobTitle: true,
          company: {
            select: {
              name: true,
              logoUrl: true
            }
          },
          appliedDate: true,
          priority: true
        },
        orderBy: { appliedDate: 'desc' },
        take: 10
      },
      _count: {
        select: {
          jobApplications: true
        }
      }
    }
  });

  if (!status) {
    throw createError('Status not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { status }
  });
});

// Create status
export const createStatus = asyncHandler(async (req: Request, res: Response) => {
  const { name, color, sortOrder, isActive = true } = req.body;

  // Check if status already exists
  const existingStatus = await prisma.status.findUnique({
    where: { name }
  });

  if (existingStatus) {
    throw createError('Status already exists with this name', 400);
  }

  // If no sortOrder provided, get next available
  let finalSortOrder = sortOrder;
  if (!finalSortOrder) {
    const lastStatus = await prisma.status.findFirst({
      orderBy: { sortOrder: 'desc' }
    });
    finalSortOrder = (lastStatus?.sortOrder || 0) + 1;
  }

  const status = await prisma.status.create({
    data: {
      name,
      color,
      sortOrder: finalSortOrder,
      isActive
    }
  });

  res.status(201).json({
    success: true,
    message: 'Status created successfully',
    data: { status }
  });
});

// Update status
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, color, sortOrder, isActive } = req.body;

  // Check if status exists
  const existingStatus = await prisma.status.findUnique({
    where: { id }
  });

  if (!existingStatus) {
    throw createError('Status not found', 404);
  }

  // Check if name is already taken by another status
  if (name && name !== existingStatus.name) {
    const nameExists = await prisma.status.findUnique({
      where: { name }
    });
    
    if (nameExists) {
      throw createError('Status name already exists', 400);
    }
  }

  const updatedStatus = await prisma.status.update({
    where: { id },
    data: {
      name,
      color,
      sortOrder,
      isActive
    }
  });

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: { status: updatedStatus }
  });
});

// Delete status
export const deleteStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if status exists
  const status = await prisma.status.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          jobApplications: true
        }
      }
    }
  });

  if (!status) {
    throw createError('Status not found', 404);
  }

  // Check if status has job applications
  if (status._count.jobApplications > 0) {
    throw createError('Cannot delete status with existing job applications', 400);
  }

  await prisma.status.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Status deleted successfully'
  });
});

// Reorder statuses
export const reorderStatuses = asyncHandler(async (req: Request, res: Response) => {
  const { statusIds } = req.body; // Array of status IDs in new order

  if (!Array.isArray(statusIds)) {
    throw createError('statusIds must be an array', 400);
  }

  // Update sort order for each status
  const updatePromises = statusIds.map((statusId: string, index: number) =>
    prisma.status.update({
      where: { id: statusId },
      data: { sortOrder: index + 1 }
    })
  );

  await Promise.all(updatePromises);

  const updatedStatuses = await prisma.status.findMany({
    where: { id: { in: statusIds } },
    orderBy: { sortOrder: 'asc' }
  });

  res.status(200).json({
    success: true,
    message: 'Statuses reordered successfully',
    data: { statuses: updatedStatuses }
  });
}); 
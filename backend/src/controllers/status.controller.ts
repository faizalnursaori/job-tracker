import { Request, Response } from 'express';
import { StatusType } from '@prisma/client';
import { asyncHandler } from '../middlewares/error.middleware';

const formatStatusName = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getStatuses = asyncHandler(async (req: Request, res: Response) => {
  const statuses = Object.values(StatusType).map((status, index) => ({
    id: status,
    name: formatStatusName(status),
    value: status,
    sortOrder: index + 1,
    isActive: true
  }));

  res.status(200).json({
    success: true,
    data: { statuses }
  });
});

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!Object.values(StatusType).includes(id as StatusType)) {
    return res.status(404).json({
      success: false,
      message: 'Status not found'
    });
  }

  const status = {
    id: id,
    name: formatStatusName(id),
    value: id,
    sortOrder: Object.values(StatusType).indexOf(id as StatusType) + 1,
    isActive: true
  };

  res.status(200).json({
    success: true,
    data: { status }
  });
});


export const createStatus = asyncHandler(async (req: Request, res: Response) => {
  res.status(405).json({
    success: false,
    message: 'Status creation not allowed. Statuses are predefined enum values.'
  });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  res.status(405).json({
    success: false,
    message: 'Status update not allowed. Statuses are predefined enum values.'
  });
});

export const deleteStatus = asyncHandler(async (req: Request, res: Response) => {
  res.status(405).json({
    success: false,
    message: 'Status deletion not allowed. Statuses are predefined enum values.'
  });
});

export const reorderStatuses = asyncHandler(async (req: Request, res: Response) => {
  res.status(405).json({
    success: false,
    message: 'Status reordering not allowed. Statuses are predefined enum values.'
  });
});
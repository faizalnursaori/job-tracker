import { Response } from 'express';
import { prisma } from '../app';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError, asyncHandler } from '../middlewares/error.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator';
import bcrypt from 'bcryptjs';

// Get current user profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          jobApplications: true
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  // Validate request body
  const validationResult = updateProfileSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw createError('Validation failed: ' + validationResult.error.errors.map((e: any) => e.message).join(', '), 400);
  }
  
  const { firstName, lastName, phone, profileImage } = validationResult.data;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) {
    throw createError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      phone,
      profileImage
    },
          select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        updatedAt: true
      }
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
});

// Change password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  // Validate request body
  const validationResult = changePasswordSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw createError('Validation failed: ' + validationResult.error.errors.map((e: any) => e.message).join(', '), 400);
  }
  
  const { currentPassword, newPassword } = validationResult.data;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash!);
  if (!isCurrentPasswordValid) {
    throw createError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashedNewPassword,
      updatedAt: new Date()
    }
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Get user statistics
export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [
    totalApplications,
    recentApplications,
    statusBreakdown
  ] = await Promise.all([
    prisma.jobApplication.count({ where: { userId } }),
    
    prisma.jobApplication.findMany({
      where: { userId },
      select: {
        id: true,
        jobTitle: true,
        status: true,
        appliedDate: true,
        company: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true }
    })
  ]);

  const statusStats = statusBreakdown.map((stat: any) => {
    const statusName = stat.status.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return {
      status: statusName,
      value: stat.status,
      count: stat._count.status
    };
  });

  res.status(200).json({
    success: true,
    data: {
      totalApplications,
      recentApplications,
      statusBreakdown: statusStats
    }
  });
}); 
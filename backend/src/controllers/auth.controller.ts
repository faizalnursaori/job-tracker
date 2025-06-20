import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';
import { RegisterInput, LoginInput, OAuthCallbackInput } from '../validators/auth.validator';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError, asyncHandler } from '../middlewares/error.middleware';

// Generate JWT Token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { userId },
    secret as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// Register User
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone }: RegisterInput = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw createError('User already exists with this email', 400);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true
    }
  });

  // Generate token
  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

// Login User
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginInput = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Check if user has a password (not OAuth-only user)
  if (!user.passwordHash) {
    throw createError('Please use OAuth to sign in to this account', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user.id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      },
      token
    }
  });
});

// OAuth Callback - Create or link user from OAuth provider
export const oauthCallback = asyncHandler(async (req: Request, res: Response) => {
  const { 
    email, 
    firstName, 
    lastName, 
    profileImage, 
    provider, 
    providerAccountId 
  }: OAuthCallbackInput = req.body;

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: {
        where: {
          provider,
          providerAccountId
        }
      }
    }
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        profileImage,
        emailVerified: new Date(),
        accounts: {
          create: {
            type: 'oauth',
            provider,
            providerAccountId
          }
        }
      },
      include: {
        accounts: true
      }
    });
  } else {
    // User exists, check if account is linked
    const existingAccount = user.accounts.find(
      acc => acc.provider === provider && acc.providerAccountId === providerAccountId
    );

    if (!existingAccount) {
      // Link account to existing user
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider,
          providerAccountId
        }
      });
    }

    // Update user info if needed
    if (user.profileImage !== profileImage) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          profileImage,
          emailVerified: user.emailVerified || new Date()
        },
        include: {
          accounts: true
        }
      });
    }
  }

  // Generate token
  const token = generateToken(user.id);

  res.status(200).json({
    success: true,
    message: 'OAuth authentication successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImage: user.profileImage
      },
      token
    }
  });
});

// Get Profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      profileImage: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          jobApplications: true
        }
      },
      accounts: {
        select: {
          provider: true,
          type: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: { user }
  });
}); 
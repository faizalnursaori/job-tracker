import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// OAuth schemas
export const oauthCallbackSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profileImage: z.string().url().optional(),
  provider: z.enum(['google', 'github']),
  providerAccountId: z.string().min(1, 'Provider account ID is required')
});

// Validation middleware
export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateOAuthCallback = (req: Request, res: Response, next: NextFunction) => {
  try {
    oauthCallbackSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>; 
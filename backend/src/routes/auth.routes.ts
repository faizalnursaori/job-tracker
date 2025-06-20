import { Router } from 'express';
import { register, login, getProfile, oauthCallback } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateLogin, validateRegister, validateOAuthCallback } from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/oauth/callback', validateOAuthCallback, oauthCallback);

// Protected routes
router.get('/profile', authMiddleware, getProfile);

export default router; 
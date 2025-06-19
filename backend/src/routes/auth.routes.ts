import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateLogin, validateRegister } from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);

export default router; 
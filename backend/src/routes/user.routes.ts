import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getProfile,
  updateProfile,
  changePassword,
  getUserStats
} from '../controllers/user.controller';

const router = Router();

// User Profile Routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.get('/stats', authMiddleware, getUserStats);

export default router; 
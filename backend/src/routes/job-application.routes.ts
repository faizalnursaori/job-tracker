import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getJobApplications,
  getJobApplication,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  getJobApplicationStats
} from '../controllers/job-application.controller';

const router = Router();

// Job Application Routes
router.get('/', authMiddleware, getJobApplications);
router.get('/stats', authMiddleware, getJobApplicationStats);
router.get('/:id', authMiddleware, getJobApplication);
router.post('/', authMiddleware, createJobApplication);
router.put('/:id', authMiddleware, updateJobApplication);
router.delete('/:id', authMiddleware, deleteJobApplication);

export default router; 
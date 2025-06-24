import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getStatuses,
  getStatus,
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses
} from '../controllers/status.controller';

const router = Router();

// Status Routes
router.get('/', authMiddleware, getStatuses);
router.get('/:id', authMiddleware, getStatus);
router.post('/', authMiddleware, createStatus);
router.put('/:id', authMiddleware, updateStatus);
router.delete('/:id', authMiddleware, deleteStatus);
router.post('/reorder', authMiddleware, reorderStatuses);

export default router; 
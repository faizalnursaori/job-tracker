import { Router } from 'express';
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
router.get('/', getStatuses);
router.get('/:id', getStatus);
router.post('/', createStatus);
router.put('/:id', updateStatus);
router.delete('/:id', deleteStatus);
router.post('/reorder', reorderStatuses);

export default router; 
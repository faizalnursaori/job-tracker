import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getApplicationNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/note.controller';

const router = Router();

// Note Routes
router.get('/job-application/:jobApplicationId', authMiddleware, getApplicationNotes);
router.get('/:id', authMiddleware, getNote);
router.post('/job-application/:jobApplicationId', authMiddleware, createNote);
router.put('/:id', authMiddleware, updateNote);
router.delete('/:id', authMiddleware, deleteNote);

export default router; 
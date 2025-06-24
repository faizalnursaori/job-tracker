import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanySuggestions
} from '../controllers/company.controller';

const router = Router();

// Company Routes
router.get('/', authMiddleware, getCompanies);
router.get('/suggestions', authMiddleware, getCompanySuggestions);
router.get('/:id', authMiddleware, getCompany);
router.post('/', authMiddleware, createCompany);
router.put('/:id', authMiddleware, updateCompany);
router.delete('/:id', authMiddleware, deleteCompany);

export default router; 
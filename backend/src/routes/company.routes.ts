import { Router } from 'express';
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
router.get('/', getCompanies);
router.get('/suggestions', getCompanySuggestions);
router.get('/:id', getCompany);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router; 
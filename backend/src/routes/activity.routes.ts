import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitiesByJobApplication
} from '../controllers/activity.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getActivities);
router.post('/', createActivity);
router.get('/:id', getActivity);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);
router.get('/job-application/:jobApplicationId', getActivitiesByJobApplication);

export default router; 
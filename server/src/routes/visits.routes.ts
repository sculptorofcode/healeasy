import { Router } from 'express';
import { createVisit, getVisits, getVisit, updateVisit, deleteVisit, generateSummary } from '../controllers/visits.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All routes are protected by requireAuth
router.post('/', requireAuth, createVisit);
router.get('/', requireAuth, getVisits);
router.get('/:id', requireAuth, getVisit);
router.put('/:id', requireAuth, updateVisit);
router.delete('/:id', requireAuth, deleteVisit);
router.post('/:id/summary', requireAuth, generateSummary);

export default router;

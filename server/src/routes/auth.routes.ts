import { Router } from 'express';
import { register, login, validateSession } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/validate', requireAuth, validateSession);

export default router;

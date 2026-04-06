import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', searchController.globalSearch);

export default router;

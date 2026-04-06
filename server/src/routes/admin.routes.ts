import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, authorizeRoles('SUPER_ADMIN'));

router.post('/agencies', adminController.createAgency);
router.get('/agencies', adminController.listAgencies);

export default router;

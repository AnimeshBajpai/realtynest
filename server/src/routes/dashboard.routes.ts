import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/broker', dashboardController.brokerDashboard);
router.get('/agency', authorizeRoles('AGENCY_ADMIN'), dashboardController.agencyDashboard);
router.get('/admin', authorizeRoles('SUPER_ADMIN'), dashboardController.superAdminDashboard);

export default router;

import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', leadController.listLeads);
router.post('/', leadController.createLead);
router.get('/stats', leadController.getLeadStats);
router.get('/:id', leadController.getLeadById);
router.put('/:id', leadController.updateLead);
router.patch('/:id/status', leadController.updateLeadStatus);
router.patch('/:id/assign', authorizeRoles('AGENCY_ADMIN', 'SUPER_ADMIN'), leadController.assignLead);
router.get('/:id/timeline', leadController.getLeadTimeline);

export default router;

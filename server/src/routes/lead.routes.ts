import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Bulk actions — must come before /:id routes
router.post('/bulk/assign', authorizeRoles('AGENCY_ADMIN', 'SUPER_ADMIN'), leadController.bulkAssign);
router.post('/bulk/status', authorizeRoles('AGENCY_ADMIN', 'SUPER_ADMIN'), leadController.bulkUpdateStatus);
router.post('/bulk/delete', authorizeRoles('AGENCY_ADMIN', 'SUPER_ADMIN'), leadController.bulkDelete);

router.get('/', leadController.listLeads);
router.post('/', leadController.createLead);
router.post('/check-duplicate', leadController.checkDuplicate);
router.get('/stats', leadController.getLeadStats);
router.get('/:id', leadController.getLeadById);
router.put('/:id', leadController.updateLead);
router.patch('/:id/status', leadController.updateLeadStatus);
router.patch('/:id/assign', authorizeRoles('AGENCY_ADMIN', 'SUPER_ADMIN'), leadController.assignLead);
router.get('/:id/timeline', leadController.getLeadTimeline);
router.get('/:id/property-suggestions', leadController.getPropertySuggestions);

export default router;

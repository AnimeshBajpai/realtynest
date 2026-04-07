import { Router } from 'express';
import { communicationController } from '../controllers/communication.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/leads/:leadId/communications', communicationController.listCommunications);
router.post('/leads/:leadId/communications', communicationController.createCommunication);
router.put('/leads/:leadId/communications/:id', communicationController.updateCommunication);
router.patch('/leads/:leadId/communications/:id/complete', communicationController.completeCommunication);
router.delete('/leads/:leadId/communications/:id', communicationController.deleteCommunication);
router.get('/follow-ups', communicationController.getUpcomingFollowUps);

export default router;

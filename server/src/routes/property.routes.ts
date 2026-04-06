import { Router } from 'express';
import { propertyController } from '../controllers/property.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', propertyController.listProperties);
router.post('/', propertyController.createProperty);
router.get('/:id', propertyController.getPropertyById);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', authorizeRoles('AGENCY_ADMIN'), propertyController.deleteProperty);
router.post('/:id/leads', propertyController.linkLeadToProperty);
router.delete('/:id/leads/:leadId', propertyController.unlinkLeadFromProperty);
router.get('/:id/leads', propertyController.getPropertyLeads);

export default router;

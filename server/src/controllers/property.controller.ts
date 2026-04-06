import type { Request, Response } from 'express';
import { propertyService } from '../services/property.service.js';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyQuerySchema,
  linkLeadSchema,
} from '../validators/property.validators.js';
import { AppError } from '../middleware/errorHandler.js';

export const propertyController = {
  async createProperty(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = createPropertySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const property = await propertyService.createProperty(
      parsed.data,
      req.user.agencyId,
    );

    res.status(201).json({ property });
  },

  async listProperties(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = propertyQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const result = await propertyService.getProperties(
      req.user.agencyId,
      parsed.data,
    );

    res.json(result);
  },

  async getPropertyById(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const property = await propertyService.getPropertyById(
      req.params.id as string,
      req.user.agencyId,
    );

    res.json({ property });
  },

  async updateProperty(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = updatePropertySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const property = await propertyService.updateProperty(
      req.params.id as string,
      req.user.agencyId,
      parsed.data,
    );

    res.json({ property });
  },

  async deleteProperty(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    await propertyService.deleteProperty(
      req.params.id as string,
      req.user.agencyId,
    );

    res.json({ message: 'Property deleted successfully' });
  },

  async linkLeadToProperty(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = linkLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const leadProperty = await propertyService.linkLeadToProperty(
      req.params.id as string,
      req.user.agencyId,
      parsed.data,
    );

    res.status(201).json({ leadProperty });
  },

  async unlinkLeadFromProperty(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    await propertyService.unlinkLeadFromProperty(
      req.params.id as string,
      req.params.leadId as string,
      req.user.agencyId,
    );

    res.json({ message: 'Lead unlinked from property successfully' });
  },

  async getPropertyLeads(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const leadProperties = await propertyService.getPropertyLeads(
      req.params.id as string,
      req.user.agencyId,
    );

    res.json({ leadProperties });
  },
};

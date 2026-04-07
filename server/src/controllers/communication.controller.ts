import type { Request, Response } from 'express';
import { communicationService } from '../services/communication.service.js';
import {
  createCommunicationSchema,
  updateCommunicationSchema,
  communicationQuerySchema,
} from '../validators/communication.validators.js';
import { AppError } from '../middleware/errorHandler.js';

export const communicationController = {
  async createCommunication(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = createCommunicationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const communication = await communicationService.createCommunication(
      req.params.leadId as string,
      req.user.id,
      req.user.agencyId,
      parsed.data,
    );

    res.status(201).json({ communication });
  },

  async listCommunications(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = communicationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const result = await communicationService.getCommunications(
      req.params.leadId as string,
      req.user.agencyId,
      parsed.data,
    );

    res.json(result);
  },

  async updateCommunication(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = updateCommunicationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const communication = await communicationService.updateCommunication(
      req.params.id as string,
      req.params.leadId as string,
      req.user.id,
      req.user.role,
      req.user.agencyId,
      parsed.data,
    );

    res.json({ communication });
  },

  async deleteCommunication(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    await communicationService.deleteCommunication(
      req.params.id as string,
      req.params.leadId as string,
      req.user.id,
      req.user.role,
      req.user.agencyId,
    );

    res.json({ message: 'Communication deleted successfully' });
  },

  async completeCommunication(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const communication = await communicationService.completeCommunication(
      req.params.id as string,
      req.params.leadId as string,
      req.user.id,
      req.user.agencyId,
      req.body.outcome,
    );

    res.json({ communication });
  },

  async getUpcomingFollowUps(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const communications = await communicationService.getUpcomingFollowUps(
      req.user.agencyId,
      req.user.id,
      req.user.role,
    );

    res.json({ communications });
  },
};

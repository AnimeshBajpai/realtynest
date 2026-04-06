import type { Request, Response } from 'express';
import { leadService } from '../services/lead.service.js';
import {
  createLeadSchema,
  updateLeadSchema,
  leadQuerySchema,
  updateLeadStatusSchema,
  assignLeadSchema,
} from '../validators/lead.validators.js';
import { AppError } from '../middleware/errorHandler.js';

export const leadController = {
  async createLead(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = createLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const lead = await leadService.createLead(
      parsed.data,
      req.user.agencyId,
      req.user.id,
    );

    res.status(201).json({ lead });
  },

  async listLeads(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = leadQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const result = await leadService.getLeads(
      req.user.agencyId,
      req.user.id,
      req.user.role,
      parsed.data,
    );

    res.json(result);
  },

  async getLeadById(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const lead = await leadService.getLeadById(
      req.params.id as string,
      req.user.agencyId,
      req.user.id,
      req.user.role,
    );

    res.json({ lead });
  },

  async updateLead(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = updateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const lead = await leadService.updateLead(
      req.params.id as string,
      req.user.agencyId,
      req.user.id,
      parsed.data,
    );

    res.json({ lead });
  },

  async updateLeadStatus(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = updateLeadStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const lead = await leadService.updateLeadStatus(
      req.params.id as string,
      req.user.agencyId,
      req.user.id,
      parsed.data.status,
    );

    res.json({ lead });
  },

  async assignLead(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = assignLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const lead = await leadService.assignLead(
      req.params.id as string,
      req.user.agencyId,
      req.user.id,
      parsed.data.assignedToId,
    );

    res.json({ lead });
  },

  async getLeadTimeline(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const activities = await leadService.getLeadTimeline(
      req.params.id as string,
      req.user.agencyId,
    );

    res.json({ activities });
  },

  async getLeadStats(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const stats = await leadService.getLeadStats(req.user.agencyId);

    res.json({ stats });
  },
};

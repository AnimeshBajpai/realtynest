import type { Request, Response } from 'express';
import { activityService } from '../services/activity.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const activityController = {
  async getActivityFeed(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const userId = (req.query.userId as string) || undefined;
    const action = (req.query.action as string) || undefined;
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const leadId = (req.query.leadId as string) || undefined;

    const result = await activityService.getActivityFeed(
      req.user.agencyId,
      req.user.role,
      req.user.id,
      { page, limit, userId, action, startDate, endDate, leadId },
    );

    res.json(result);
  },
};

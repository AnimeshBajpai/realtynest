import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const dashboardController = {
  async brokerDashboard(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const data = await dashboardService.getBrokerDashboard(
      req.user.id,
      req.user.agencyId,
    );

    res.json(data);
  },

  async agencyDashboard(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const data = await dashboardService.getAgencyDashboard(req.user.agencyId);

    res.json(data);
  },

  async superAdminDashboard(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const data = await dashboardService.getSuperAdminDashboard();

    res.json(data);
  },
};

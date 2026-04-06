import type { Request, Response } from 'express';
import { adminService } from '../services/admin.service.js';
import { createAgencySchema } from '../validators/admin.validators.js';
import { AppError } from '../middleware/errorHandler.js';

export const adminController = {
  async createAgency(req: Request, res: Response) {
    const parsed = createAgencySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const result = await adminService.createAgency(parsed.data);

    res.status(201).json({
      agency: result.agency,
      adminUser: result.adminUser,
    });
  },

  async listAgencies(_req: Request, res: Response) {
    const agencies = await adminService.listAgencies();

    res.json({ agencies });
  },
};

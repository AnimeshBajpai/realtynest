import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import {
  createBrokerSchema,
  updateProfileSchema,
} from '../validators/auth.validators.js';
import { AppError } from '../middleware/errorHandler.js';

export const userController = {
  async createBroker(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const parsed = createBrokerSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const user = await userService.createBroker(parsed.data, req.user.agencyId);

    res.status(201).json({ user });
  },

  async listBrokers(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const users = await userService.listBrokers(req.user.agencyId);

    res.json({ users });
  },

  async getBroker(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const user = await userService.getBroker(req.params.id as string, req.user.agencyId);

    res.json({ user });
  },

  async updateProfile(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const targetId = req.params.id as string;

    // Users can update their own profile; AGENCY_ADMIN can update brokers in their agency
    if (targetId !== req.user.id) {
      if (req.user.role !== 'AGENCY_ADMIN' || !req.user.agencyId) {
        throw new AppError('Insufficient permissions', 403);
      }

      // Verify the target user belongs to the same agency
      await userService.getBroker(targetId, req.user.agencyId);
    }

    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const user = await userService.updateUser(targetId, parsed.data);

    res.json({ user });
  },

  async toggleStatus(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const user = await userService.toggleUserStatus(
      req.params.id as string,
      req.user.agencyId,
    );

    res.json({ user });
  },
};

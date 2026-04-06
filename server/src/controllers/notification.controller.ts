import type { Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const notificationController = {
  async getUserNotifications(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await notificationService.getUserNotifications(
      req.user.id,
      page,
      limit,
    );

    res.json(result);
  },

  async getUnreadCount(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({ unreadCount: count });
  },

  async markAsRead(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const notification = await notificationService.markAsRead(
      req.params.id as string,
      req.user.id,
    );

    res.json({ notification });
  },

  async markAllAsRead(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    await notificationService.markAllAsRead(req.user.id);

    res.json({ message: 'All notifications marked as read' });
  },
};

import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function notifyUser(
  userId: string,
  type: string,
  title: string,
  message?: string,
  link?: string,
) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

export const notificationService = {
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message?: string,
    link?: string,
  ) {
    return notifyUser(userId, type, title, message, link);
  },

  async getUserNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  },

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },
};

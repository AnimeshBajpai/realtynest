import { prisma } from '../config/database.js';
import type { Prisma } from 'generated-prisma-client';

interface ActivityFilters {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  leadId?: string;
}

const userNameSelect = {
  id: true,
  firstName: true,
  lastName: true,
} as const;

export const activityService = {
  async getActivityFeed(
    agencyId: string,
    userRole: string,
    currentUserId: string,
    filters: ActivityFilters,
  ) {
    const { page, limit, userId, action, startDate, endDate, leadId } = filters;

    const where: Prisma.LeadActivityWhereInput = {
      lead: { agencyId },
    };

    // BROKER can only see their own activities
    if (userRole === 'BROKER') {
      where.userId = currentUserId;
    }

    // Optional filters
    if (userId) {
      where.userId = userId;
    }

    if (action) {
      if (action.includes('*')) {
        where.action = { startsWith: action.replace('*', '') };
      } else {
        where.action = action;
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (leadId) {
      where.leadId = leadId;
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.leadActivity.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          user: { select: userNameSelect },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.leadActivity.count({ where }),
    ]);

    return {
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        oldValue: a.oldValue,
        newValue: a.newValue,
        metadata: a.metadata,
        createdAt: a.createdAt,
        lead: a.lead,
        user: a.user,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};

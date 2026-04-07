import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Prisma } from 'generated-prisma-client';
import type {
  CreateLeadInput,
  UpdateLeadInput,
  LeadQueryInput,
} from '../validators/lead.validators.js';
import { notifyUser } from './notification.service.js';

const userNameSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const leadService = {
  async createLead(data: CreateLeadInput, agencyId: string, createdById: string) {
    const lead = await prisma.lead.create({
      data: {
        ...data,
        agencyId,
        createdById,
      },
      include: {
        assignedTo: { select: userNameSelect },
        createdBy: { select: userNameSelect },
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: createdById,
        action: 'lead_created',
        newValue: `${data.firstName} ${data.lastName}`,
      },
    });

    return lead;
  },

  async getLeads(agencyId: string, userId: string, userRole: string, query: LeadQueryInput) {
    const { page, limit, search, status, source, priority, assignedToId, sortBy, sortOrder } =
      query;

    const where: Prisma.LeadWhereInput = { agencyId };

    // BROKER can only see leads assigned to them
    if (userRole === 'BROKER') {
      where.assignedToId = userId;
    }

    if (status) where.status = status;
    if (source) where.source = source;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: userNameSelect },
          createdBy: { select: userNameSelect },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getLeadById(id: string, agencyId: string, userId: string, userRole: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, agencyId },
      include: {
        assignedTo: { select: userNameSelect },
        createdBy: { select: userNameSelect },
      },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (userRole === 'BROKER' && lead.assignedToId !== userId) {
      throw new AppError('Lead not found', 404);
    }

    return lead;
  },

  async updateLead(id: string, agencyId: string, userId: string, data: UpdateLeadInput) {
    const existing = await prisma.lead.findFirst({
      where: { id, agencyId },
    });

    if (!existing) {
      throw new AppError('Lead not found', 404);
    }

    // Log changes for tracked fields
    const activities: { action: string; oldValue: string | null; newValue: string | null }[] = [];
    const trackedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'source',
      'status',
      'priority',
      'budgetMin',
      'budgetMax',
      'preferredLocation',
      'propertyTypePreference',
      'assignedToId',
    ] as const;

    for (const field of trackedFields) {
      if (data[field] !== undefined) {
        const oldVal = existing[field];
        const newVal = data[field];
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          activities.push({
            action: `field_updated:${field}`,
            oldValue: oldVal != null ? String(oldVal) : null,
            newValue: newVal != null ? String(newVal) : null,
          });
        }
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: userNameSelect },
        createdBy: { select: userNameSelect },
      },
    });

    if (activities.length > 0) {
      await prisma.leadActivity.createMany({
        data: activities.map((a) => ({
          leadId: id,
          userId,
          ...a,
        })),
      });
    }

    return lead;
  },

  async updateLeadStatus(id: string, agencyId: string, userId: string, newStatus: string) {
    const existing = await prisma.lead.findFirst({
      where: { id, agencyId },
    });

    if (!existing) {
      throw new AppError('Lead not found', 404);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status: newStatus as any },
      include: {
        assignedTo: { select: userNameSelect },
        createdBy: { select: userNameSelect },
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        userId,
        action: 'status_change',
        oldValue: existing.status,
        newValue: newStatus,
      },
    });

    // Notify assigned broker about status change
    if (existing.assignedToId && existing.assignedToId !== userId) {
      await notifyUser(
        existing.assignedToId,
        'STATUS_CHANGE',
        `Lead ${existing.firstName} ${existing.lastName} status changed to ${newStatus}`,
        undefined,
        `/leads/${id}`,
      );
    }

    return lead;
  },

  async assignLead(id: string, agencyId: string, userId: string, assignedToId: string) {
    const existing = await prisma.lead.findFirst({
      where: { id, agencyId },
    });

    if (!existing) {
      throw new AppError('Lead not found', 404);
    }

    // Verify the target user belongs to the same agency
    const targetUser = await prisma.user.findFirst({
      where: { id: assignedToId, agencyId, isActive: true },
    });

    if (!targetUser) {
      throw new AppError('Assigned user not found in this agency', 400);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { assignedToId },
      include: {
        assignedTo: { select: userNameSelect },
        createdBy: { select: userNameSelect },
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        userId,
        action: 'assignment',
        oldValue: existing.assignedToId,
        newValue: assignedToId,
        metadata: {
          assignedToName: `${targetUser.firstName} ${targetUser.lastName}`,
        },
      },
    });

    // Notify the broker they've been assigned a lead
    if (assignedToId !== userId) {
      await notifyUser(
        assignedToId,
        'LEAD_ASSIGNED',
        `Lead assigned: ${existing.firstName} ${existing.lastName}`,
        undefined,
        `/leads/${id}`,
      );
    }

    return lead;
  },

  async getLeadTimeline(id: string, agencyId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, agencyId },
      select: { id: true },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const activities = await prisma.leadActivity.findMany({
      where: { leadId: id },
      include: {
        user: { select: userNameSelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    return activities;
  },

  async getLeadStats(agencyId: string) {
    const [
      total,
      byStatus,
      bySource,
      byPriority,
      newThisMonth,
    ] = await Promise.all([
      prisma.lead.count({ where: { agencyId } }),

      prisma.lead.groupBy({
        by: ['status'],
        where: { agencyId },
        _count: { id: true },
      }),

      prisma.lead.groupBy({
        by: ['source'],
        where: { agencyId },
        _count: { id: true },
      }),

      prisma.lead.groupBy({
        by: ['priority'],
        where: { agencyId },
        _count: { id: true },
      }),

      prisma.lead.count({
        where: {
          agencyId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count.id]),
    );

    const closedWon = statusMap['CLOSED_WON'] ?? 0;
    const closedLost = statusMap['CLOSED_LOST'] ?? 0;
    const totalClosed = closedWon + closedLost;
    const conversionRate = totalClosed > 0 ? (closedWon / totalClosed) * 100 : 0;

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
      bySource: Object.fromEntries(bySource.map((s) => [s.source, s._count.id])),
      byPriority: Object.fromEntries(byPriority.map((s) => [s.priority, s._count.id])),
      newThisMonth,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  },
};

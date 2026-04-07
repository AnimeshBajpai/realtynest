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

/**
 * Notify all relevant people about a lead change, excluding the user who made the change.
 * Recipients: agency admins + assigned broker + lead creator (deduplicated, self excluded).
 */
async function notifyLeadStakeholders(
  agencyId: string,
  excludeUserId: string,
  assignedToId: string | null,
  createdById: string | null,
  type: string,
  message: string,
  leadId: string,
) {
  const admins = await prisma.user.findMany({
    where: { agencyId, role: 'AGENCY_ADMIN', isActive: true },
    select: { id: true },
  });

  const recipientIds = new Set<string>();
  for (const admin of admins) recipientIds.add(admin.id);
  if (assignedToId) recipientIds.add(assignedToId);
  if (createdById) recipientIds.add(createdById);
  // Never notify the person who made the change
  recipientIds.delete(excludeUserId);

  for (const recipientId of recipientIds) {
    await notifyUser(recipientId, type, message, undefined, `/leads/${leadId}`);
  }
}

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

    // Notify stakeholders about new lead
    await notifyLeadStakeholders(
      agencyId, createdById, null, createdById,
      'LEAD_ASSIGNED',
      `New lead created: ${data.firstName} ${data.lastName}`,
      lead.id,
    );

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

      const changedFields = activities.map((a) => a.action.replace('field_updated:', '')).join(', ');
      await notifyLeadStakeholders(
        agencyId, userId, existing.assignedToId, existing.createdById,
        'STATUS_CHANGE',
        `Lead ${existing.firstName} ${existing.lastName} updated: ${changedFields}`,
        id,
      );
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

    // Notify all stakeholders about status change
    await notifyLeadStakeholders(
      agencyId, userId, existing.assignedToId, existing.createdById,
      'STATUS_CHANGE',
      `Lead ${existing.firstName} ${existing.lastName} status changed to ${newStatus}`,
      id,
    );

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

    // Notify all stakeholders about assignment
    await notifyLeadStakeholders(
      agencyId, userId, assignedToId, existing.createdById,
      'LEAD_ASSIGNED',
      `Lead ${existing.firstName} ${existing.lastName} assigned to ${targetUser.firstName} ${targetUser.lastName}`,
      id,
    );

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

  async bulkAssign(leadIds: string[], agencyId: string, userId: string, assignedToId: string) {
    const targetUser = await prisma.user.findFirst({
      where: { id: assignedToId, agencyId, isActive: true },
    });

    if (!targetUser) {
      throw new AppError('Assigned user not found in this agency', 400);
    }

    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, agencyId },
    });

    if (leads.length !== leadIds.length) {
      throw new AppError('One or more leads not found in this agency', 404);
    }

    await prisma.lead.updateMany({
      where: { id: { in: leadIds }, agencyId },
      data: { assignedToId },
    });

    for (const lead of leads) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          userId,
          action: 'assignment',
          oldValue: lead.assignedToId,
          newValue: assignedToId,
          metadata: {
            assignedToName: `${targetUser.firstName} ${targetUser.lastName}`,
            bulkAction: true,
          },
        },
      });

      await notifyLeadStakeholders(
        agencyId, userId, assignedToId, lead.createdById,
        'LEAD_ASSIGNED',
        `Lead ${lead.firstName} ${lead.lastName} assigned to ${targetUser.firstName} ${targetUser.lastName}`,
        lead.id,
      );
    }

    return { count: leads.length };
  },

  async bulkUpdateStatus(leadIds: string[], agencyId: string, userId: string, newStatus: string) {
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, agencyId },
    });

    if (leads.length !== leadIds.length) {
      throw new AppError('One or more leads not found in this agency', 404);
    }

    await prisma.lead.updateMany({
      where: { id: { in: leadIds }, agencyId },
      data: { status: newStatus as any },
    });

    for (const lead of leads) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          userId,
          action: 'status_change',
          oldValue: lead.status,
          newValue: newStatus,
          metadata: { bulkAction: true },
        },
      });

      await notifyLeadStakeholders(
        agencyId, userId, lead.assignedToId, lead.createdById,
        'STATUS_CHANGE',
        `Lead ${lead.firstName} ${lead.lastName} status changed to ${newStatus}`,
        lead.id,
      );
    }

    return { count: leads.length };
  },

  async bulkDelete(leadIds: string[], agencyId: string, userId: string) {
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, agencyId },
      select: { id: true },
    });

    if (leads.length !== leadIds.length) {
      throw new AppError('One or more leads not found in this agency', 404);
    }

    // Delete related records first, then leads
    await prisma.leadActivity.deleteMany({
      where: { leadId: { in: leadIds } },
    });

    await prisma.communication.deleteMany({
      where: { leadId: { in: leadIds } },
    });

    await prisma.leadProperty.deleteMany({
      where: { leadId: { in: leadIds } },
    });

    await prisma.lead.deleteMany({
      where: { id: { in: leadIds }, agencyId },
    });

    return { count: leads.length };
  },

  async checkDuplicate(agencyId: string, phone?: string, email?: string) {
    const conditions: Prisma.LeadWhereInput[] = [];
    if (phone) conditions.push({ phone: { equals: phone, mode: 'insensitive' } });
    if (email) conditions.push({ email: { equals: email, mode: 'insensitive' } });

    if (conditions.length === 0) return [];

    const duplicates = await prisma.lead.findMany({
      where: {
        agencyId,
        OR: conditions,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        status: true,
      },
      take: 10,
    });

    return duplicates;
  },

  async getPropertySuggestions(leadId: string, agencyId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, agencyId },
      select: {
        budgetMin: true,
        budgetMax: true,
        preferredLocation: true,
        propertyTypePreference: true,
      },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const where: Prisma.PropertyWhereInput = { agencyId };
    const orConditions: Prisma.PropertyWhereInput[] = [];

    if (lead.budgetMin != null || lead.budgetMax != null) {
      const priceFilter: Record<string, number> = {};
      if (lead.budgetMin != null) priceFilter.gte = lead.budgetMin;
      if (lead.budgetMax != null) priceFilter.lte = lead.budgetMax;
      orConditions.push({ price: priceFilter });
    }

    if (lead.preferredLocation) {
      orConditions.push({
        OR: [
          { city: { contains: lead.preferredLocation, mode: 'insensitive' as const } },
          { state: { contains: lead.preferredLocation, mode: 'insensitive' as const } },
        ],
      });
    }

    if (lead.propertyTypePreference) {
      const normalised = lead.propertyTypePreference.toUpperCase();
      const validTypes = ['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL'];
      if (validTypes.includes(normalised)) {
        orConditions.push({ type: normalised as any });
      }
    }

    if (orConditions.length === 0) return [];

    where.OR = orConditions;

    const properties = await prisma.property.findMany({
      where,
      take: 50,
    });

    const scored = properties.map((property) => {
      let matchScore = 0;
      const matches = { budget: false, location: false, type: false };

      if (
        property.price != null &&
        (lead.budgetMin == null || property.price >= lead.budgetMin) &&
        (lead.budgetMax == null || property.price <= lead.budgetMax) &&
        (lead.budgetMin != null || lead.budgetMax != null)
      ) {
        matchScore++;
        matches.budget = true;
      }

      if (
        lead.preferredLocation &&
        ((property.city &&
          property.city.toLowerCase().includes(lead.preferredLocation.toLowerCase())) ||
          (property.state &&
            property.state.toLowerCase().includes(lead.preferredLocation.toLowerCase())))
      ) {
        matchScore++;
        matches.location = true;
      }

      if (
        lead.propertyTypePreference &&
        property.type.toUpperCase() === lead.propertyTypePreference.toUpperCase()
      ) {
        matchScore++;
        matches.type = true;
      }

      return { property, matchScore, matches };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, 5);
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

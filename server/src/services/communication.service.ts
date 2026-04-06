import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Prisma } from 'generated-prisma-client';
import type {
  CreateCommunicationInput,
  UpdateCommunicationInput,
  CommunicationQueryInput,
} from '../validators/communication.validators.js';

const userNameSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const communicationService = {
  async createCommunication(
    leadId: string,
    userId: string,
    agencyId: string,
    data: CreateCommunicationInput,
  ) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, agencyId },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const communication = await prisma.communication.create({
      data: {
        leadId,
        userId,
        type: data.type,
        subject: data.subject,
        body: data.body,
        outcome: data.outcome,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      },
      include: {
        user: { select: userNameSelect },
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        userId,
        action: 'communication_added',
        newValue: data.type,
        metadata: {
          communicationId: communication.id,
          subject: data.subject ?? null,
        },
      },
    });

    return communication;
  },

  async getCommunications(
    leadId: string,
    agencyId: string,
    query: CommunicationQueryInput,
  ) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, agencyId },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const { page, limit, type } = query;

    const where: Prisma.CommunicationWhereInput = { leadId };

    if (type) where.type = type;

    const skip = (page - 1) * limit;

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          user: { select: userNameSelect },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.communication.count({ where }),
    ]);

    return {
      communications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async updateCommunication(
    id: string,
    leadId: string,
    userId: string,
    userRole: string,
    agencyId: string,
    data: UpdateCommunicationInput,
  ) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, agencyId },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const existing = await prisma.communication.findFirst({
      where: { id, leadId },
    });

    if (!existing) {
      throw new AppError('Communication not found', 404);
    }

    // Only creator or admin can update
    if (existing.userId !== userId && userRole === 'BROKER') {
      throw new AppError('You can only update your own communications', 403);
    }

    const communication = await prisma.communication.update({
      where: { id },
      data: {
        ...data,
        scheduledAt: data.scheduledAt !== undefined
          ? (data.scheduledAt ? new Date(data.scheduledAt) : null)
          : undefined,
        completedAt: data.completedAt !== undefined
          ? (data.completedAt ? new Date(data.completedAt) : null)
          : undefined,
      },
      include: {
        user: { select: userNameSelect },
      },
    });

    return communication;
  },

  async deleteCommunication(
    id: string,
    leadId: string,
    userId: string,
    userRole: string,
    agencyId: string,
  ) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, agencyId },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const existing = await prisma.communication.findFirst({
      where: { id, leadId },
    });

    if (!existing) {
      throw new AppError('Communication not found', 404);
    }

    // Only creator or admin can delete
    if (existing.userId !== userId && userRole === 'BROKER') {
      throw new AppError('You can only delete your own communications', 403);
    }

    await prisma.communication.delete({ where: { id } });
  },

  async getUpcomingFollowUps(agencyId: string, userId: string, role: string) {
    const where: Prisma.CommunicationWhereInput = {
      scheduledAt: { gt: new Date() },
      completedAt: null,
      lead: { agencyId },
    };

    // BROKER can only see their own follow-ups
    if (role === 'BROKER') {
      where.userId = userId;
    }

    const communications = await prisma.communication.findMany({
      where,
      include: {
        user: { select: userNameSelect },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return communications;
  },
};

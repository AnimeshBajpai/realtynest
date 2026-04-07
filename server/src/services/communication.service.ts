import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Prisma } from 'generated-prisma-client';
import type {
  CreateCommunicationInput,
  UpdateCommunicationInput,
  CommunicationQueryInput,
} from '../validators/communication.validators.js';
import { notifyUser } from './notification.service.js';

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
      select: { id: true, firstName: true, lastName: true, assignedToId: true },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const communication = await prisma.communication.create({
      data: {
        leadId,
        userId,
        assignedToId: data.assignedToId ?? undefined,
        isFollowUp: data.isFollowUp ?? false,
        type: data.type,
        subject: data.subject,
        body: data.body,
        outcome: data.outcome,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      },
      include: {
        user: { select: userNameSelect },
        assignedTo: { select: userNameSelect },
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        userId,
        action: data.isFollowUp ? 'followup_created' : 'communication_added',
        newValue: data.type,
        metadata: {
          communicationId: communication.id,
          subject: data.subject ?? null,
        },
      },
    });

    // Notify assigned broker on follow-up
    if (data.isFollowUp && data.assignedToId && data.assignedToId !== userId) {
      const leadName = `${lead.firstName} ${lead.lastName}`;
      const dueDate = data.scheduledAt
        ? ` by ${new Date(data.scheduledAt).toLocaleDateString('en-IN')}`
        : '';
      await notifyUser(
        data.assignedToId,
        'FOLLOW_UP_ASSIGNED',
        `Follow-up assigned: ${data.type} with ${leadName}${dueDate}`,
        data.subject || undefined,
        `/leads/${leadId}`,
      );
    }

    // Notify assigned broker when someone else adds a communication to their lead
    if (!data.isFollowUp && lead.assignedToId && lead.assignedToId !== userId) {
      await notifyUser(
        lead.assignedToId,
        'COMMUNICATION',
        `New ${data.type.toLowerCase()} logged on ${lead.firstName} ${lead.lastName}`,
        data.subject || undefined,
        `/leads/${leadId}`,
      );
    }

    return communication;
  },

  async completeCommunication(
    id: string,
    leadId: string,
    userId: string,
    agencyId: string,
    outcome?: string,
  ) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, agencyId },
      select: { id: true, firstName: true, lastName: true },
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

    if (existing.completedAt) {
      throw new AppError('Already completed', 400);
    }

    const communication = await prisma.communication.update({
      where: { id },
      data: {
        completedAt: new Date(),
        outcome: outcome ?? existing.outcome,
      },
      include: {
        user: { select: userNameSelect },
        assignedTo: { select: userNameSelect },
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        userId,
        action: 'followup_completed',
        newValue: existing.type,
        metadata: {
          communicationId: id,
          subject: existing.subject ?? null,
        },
      },
    });

    // Notify the admin who created the follow-up
    if (existing.userId !== userId) {
      await notifyUser(
        existing.userId,
        'FOLLOW_UP_COMPLETED',
        `Follow-up completed: ${existing.type} with ${lead.firstName} ${lead.lastName}`,
        outcome || undefined,
        `/leads/${leadId}`,
      );
    }

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
          assignedTo: { select: userNameSelect },
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
        assignedTo: { select: userNameSelect },
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

    if (existing.userId !== userId && userRole === 'BROKER') {
      throw new AppError('You can only delete your own communications', 403);
    }

    await prisma.communication.delete({ where: { id } });
  },

  async getUpcomingFollowUps(agencyId: string, userId: string, role: string) {
    const where: Prisma.CommunicationWhereInput = {
      scheduledAt: { not: null },
      completedAt: null,
      lead: { agencyId },
    };

    // BROKER sees follow-ups assigned to them or created by them
    if (role === 'BROKER') {
      where.OR = [
        { assignedToId: userId },
        { userId, isFollowUp: false },
      ];
    }

    const communications = await prisma.communication.findMany({
      where,
      include: {
        user: { select: userNameSelect },
        assignedTo: { select: userNameSelect },
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

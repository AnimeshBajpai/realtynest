import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateBrokerInput, UpdateProfileInput } from '../validators/auth.validators.js';

const userSelectWithoutPassword = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  agencyId: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userService = {
  async createBroker(data: CreateBrokerInput, agencyId: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: 'BROKER',
        agencyId,
      },
      select: userSelectWithoutPassword,
    });

    return user;
  },

  async listBrokers(agencyId: string) {
    const users = await prisma.user.findMany({
      where: { agencyId },
      select: {
        ...userSelectWithoutPassword,
        _count: {
          select: {
            assignedLeads: true,
            createdLeads: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  },

  async getBroker(id: string, agencyId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelectWithoutPassword,
        agency: true,
        _count: {
          select: {
            assignedLeads: true,
            createdLeads: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.agencyId !== agencyId) {
      throw new AppError('User not found in your agency', 403);
    }

    return user;
  },

  async updateUser(id: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      },
      select: userSelectWithoutPassword,
    });

    return user;
  },

  async toggleUserStatus(id: string, agencyId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, agencyId: true, isActive: true, role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.agencyId !== agencyId) {
      throw new AppError('User not found in your agency', 403);
    }

    if (user.role === 'AGENCY_ADMIN') {
      throw new AppError('Cannot toggle status of an agency admin', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: userSelectWithoutPassword,
    });

    return updated;
  },
};

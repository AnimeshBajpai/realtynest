import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateAgencyInput } from '../validators/admin.validators.js';

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

export const adminService = {
  async createAgency(data: CreateAgencyInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(data.adminPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: { name: data.agencyName },
      });

      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail,
          passwordHash,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          phone: data.adminPhone,
          role: 'AGENCY_ADMIN',
          agencyId: agency.id,
        },
        select: userSelectWithoutPassword,
      });

      return { agency, adminUser };
    });

    return result;
  },

  async listAgencies() {
    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        subscriptionPlan: true,
        createdAt: true,
        _count: {
          select: {
            users: {
              where: { role: 'AGENCY_ADMIN' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch broker counts separately since Prisma doesn't support
    // multiple filtered _count on the same relation in one query
    const agenciesWithCounts = await Promise.all(
      agencies.map(async (agency) => {
        const brokerCount = await prisma.user.count({
          where: { agencyId: agency.id, role: 'BROKER' },
        });

        return {
          id: agency.id,
          name: agency.name,
          email: agency.email,
          phone: agency.phone,
          isActive: agency.isActive,
          subscriptionPlan: agency.subscriptionPlan,
          createdAt: agency.createdAt,
          adminCount: agency._count.users,
          brokerCount,
        };
      }),
    );

    return agenciesWithCounts;
  },
};

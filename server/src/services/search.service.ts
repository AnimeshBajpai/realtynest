import { prisma } from '../config/database.js';

const userNameSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const searchService = {
  async globalSearch(agencyId: string, query: string) {
    const term = query.trim();
    if (!term) {
      return { leads: [], properties: [], users: [] };
    }

    const [leads, properties, users] = await Promise.all([
      prisma.lead.findMany({
        where: {
          agencyId,
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
          ],
        },
        include: {
          assignedTo: { select: userNameSelect },
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.property.findMany({
        where: {
          agencyId,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { address: { contains: term, mode: 'insensitive' } },
            { city: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.user.findMany({
        where: {
          agencyId,
          isActive: true,
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          ...userNameSelect,
          phone: true,
          role: true,
          avatarUrl: true,
        },
        take: 5,
      }),
    ]);

    return { leads, properties, users };
  },
};

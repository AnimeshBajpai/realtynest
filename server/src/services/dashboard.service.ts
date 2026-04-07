import { prisma } from '../config/database.js';

const userNameSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const dashboardService = {
  async getBrokerDashboard(userId: string, agencyId: string) {
    const [
      leadsByStatus,
      totalLeads,
      upcomingFollowUps,
      recentActivity,
    ] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        where: { agencyId, assignedToId: userId },
        _count: { id: true },
      }),

      prisma.lead.count({
        where: { agencyId, assignedToId: userId },
      }),

      prisma.communication.findMany({
        where: {
          userId,
          scheduledAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          completedAt: null,
          lead: { agencyId },
        },
        include: {
          lead: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),

      prisma.leadActivity.findMany({
        where: { userId },
        include: {
          lead: { select: { id: true, firstName: true, lastName: true } },
          user: { select: userNameSelect },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const statusMap = Object.fromEntries(
      leadsByStatus.map((s) => [s.status, s._count.id]),
    );

    const closedWon = statusMap['CLOSED_WON'] ?? 0;
    const closedLost = statusMap['CLOSED_LOST'] ?? 0;
    const activeLeads = totalLeads - closedWon - closedLost;

    return {
      myLeads: {
        total: totalLeads,
        active: activeLeads,
        converted: closedWon,
      },
      byStatus: statusMap,
      upcomingFollowUps,
      recentActivity,
    };
  },

  async getAgencyDashboard(agencyId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      pipelineFunnel,
      leadsBySource,
      leadsByPriority,
      brokers,
      brokerLeadCounts,
      propertiesTotal,
      propertiesByStatus,
    ] = await Promise.all([
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

      prisma.user.findMany({
        where: { agencyId, role: 'BROKER', isActive: true },
        select: userNameSelect,
      }),

      prisma.lead.groupBy({
        by: ['assignedToId', 'status'],
        where: { agencyId, assignedToId: { not: null } },
        _count: { id: true },
      }),

      prisma.property.count({ where: { agencyId } }),

      prisma.property.groupBy({
        by: ['status'],
        where: { agencyId },
        _count: { id: true },
      }),
    ]);

    // Monthly trend: leads created per month for last 6 months
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.lead.count({
        where: {
          agencyId,
          createdAt: { gte: start, lt: end },
        },
      });
      const label = start.toISOString().slice(0, 7); // YYYY-MM
      monthlyTrend.push({ month: label, count });
    }

    // Pipeline funnel ordered
    const statusOrder = [
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'SITE_VISIT',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST',
    ] as const;
    const funnelMap = Object.fromEntries(
      pipelineFunnel.map((s) => [s.status, s._count.id]),
    );
    const pipeline = statusOrder.map((status) => ({
      status,
      count: funnelMap[status] ?? 0,
    }));

    // Broker performance
    const brokerMap = new Map<string, { assigned: number; converted: number; active: number }>();
    for (const b of brokers) {
      brokerMap.set(b.id, { assigned: 0, converted: 0, active: 0 });
    }
    for (const row of brokerLeadCounts) {
      if (!row.assignedToId) continue;
      const entry = brokerMap.get(row.assignedToId);
      if (!entry) continue;
      entry.assigned += row._count.id;
      if (row.status === 'CLOSED_WON') {
        entry.converted += row._count.id;
      }
      if (row.status !== 'CLOSED_WON' && row.status !== 'CLOSED_LOST') {
        entry.active += row._count.id;
      }
    }

    const brokerPerformance = brokers.map((b) => ({
      ...b,
      ...(brokerMap.get(b.id) ?? { assigned: 0, converted: 0, active: 0 }),
    }));

    // Conversion rate
    const closedWon = funnelMap['CLOSED_WON'] ?? 0;
    const closedLost = funnelMap['CLOSED_LOST'] ?? 0;
    const totalClosed = closedWon + closedLost;
    const conversionRate = totalClosed > 0
      ? Math.round((closedWon / totalClosed) * 10000) / 100
      : 0;

    const totalLeads = pipeline.reduce((sum, p) => sum + p.count, 0);
    const activeLeads = totalLeads - closedWon - closedLost;

    return {
      pipeline,
      bySource: Object.fromEntries(
        leadsBySource.map((s) => [s.source, s._count.id]),
      ),
      byPriority: Object.fromEntries(
        leadsByPriority.map((s) => [s.priority, s._count.id]),
      ),
      brokerPerformance,
      monthlyTrend,
      propertySummary: {
        total: propertiesTotal,
        byStatus: Object.fromEntries(
          propertiesByStatus.map((s) => [s.status, s._count.id]),
        ),
      },
      conversionRate,
      totalLeads,
      activeLeads,
      convertedLeads: closedWon,
    };
  },

  async getSuperAdminDashboard() {
    const [
      totalAgencies,
      totalUsers,
      totalLeads,
      agenciesWithLeads,
      recentAgencies,
      platformFunnel,
    ] = await Promise.all([
      prisma.agency.count(),
      prisma.user.count(),
      prisma.lead.count(),

      prisma.agency.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          subscriptionPlan: true,
          createdAt: true,
          _count: { select: { leads: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.agency.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          subscriptionPlan: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const funnelMap = Object.fromEntries(
      platformFunnel.map((s) => [s.status, s._count.id]),
    );
    const closedWon = funnelMap['CLOSED_WON'] ?? 0;
    const closedLost = funnelMap['CLOSED_LOST'] ?? 0;
    const totalClosed = closedWon + closedLost;
    const conversionRate = totalClosed > 0
      ? Math.round((closedWon / totalClosed) * 10000) / 100
      : 0;

    return {
      totalAgencies,
      totalUsers,
      totalLeads,
      agencies: agenciesWithLeads.map((a) => ({
        id: a.id,
        name: a.name,
        isActive: a.isActive,
        subscriptionPlan: a.subscriptionPlan,
        createdAt: a.createdAt,
        leadCount: a._count.leads,
        userCount: a._count.users,
      })),
      recentAgencies,
      conversionRate,
    };
  },
};

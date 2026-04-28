import 'dotenv/config';
import { prisma } from '../server/src/config/database.js';

const badges = [
  // Onboarding badge (awarded immediately on signup)
  { name: 'Lace Up', description: 'Ready to hit the road', iconName: 'shoe', xpReward: 10, criteria: JSON.stringify({ onboarding: true }) },

  // First steps
  { name: 'First Steps', description: 'Log your very first run', iconName: 'footprints', xpReward: 25, criteria: JSON.stringify({ minTotalRuns: 1 }) },
  { name: 'Getting Started', description: 'Complete 5 runs', iconName: 'play', xpReward: 50, criteria: JSON.stringify({ minTotalRuns: 5 }) },
  { name: 'Consistent Runner', description: 'Complete 10 runs', iconName: 'repeat', xpReward: 75, criteria: JSON.stringify({ minTotalRuns: 10 }) },
  { name: 'Dedicated', description: 'Complete 25 runs', iconName: 'heart', xpReward: 100, criteria: JSON.stringify({ minTotalRuns: 25 }) },
  { name: 'Century Club', description: 'Complete 100 runs', iconName: 'award', xpReward: 250, criteria: JSON.stringify({ minTotalRuns: 100 }) },

  // Single run distance
  { name: '5K Starter', description: 'Run a single 5K', iconName: 'map-pin', xpReward: 50, criteria: JSON.stringify({ minSingleRunKm: 5 }) },
  { name: '10K Crusher', description: 'Run a single 10K', iconName: 'map', xpReward: 100, criteria: JSON.stringify({ minSingleRunKm: 10 }) },
  { name: 'Half Marathon Hero', description: 'Run 21.1km in one go', iconName: 'trophy', xpReward: 200, criteria: JSON.stringify({ minSingleRunKm: 21.1 }) },
  { name: 'Marathoner', description: 'Run 42.2km in one go', iconName: 'medal', xpReward: 500, criteria: JSON.stringify({ minSingleRunKm: 42.2 }) },

  // Cumulative distance
  { name: '10K Total', description: 'Log 10km total distance', iconName: 'milestone', xpReward: 30, criteria: JSON.stringify({ minTotalDistanceKm: 10 }) },
  { name: '50K Explorer', description: 'Log 50km total distance', iconName: 'compass', xpReward: 75, criteria: JSON.stringify({ minTotalDistanceKm: 50 }) },
  { name: '100K Warrior', description: 'Log 100km total distance', iconName: 'shield', xpReward: 150, criteria: JSON.stringify({ minTotalDistanceKm: 100 }) },
  { name: '500K Legend', description: 'Log 500km total distance', iconName: 'crown', xpReward: 300, criteria: JSON.stringify({ minTotalDistanceKm: 500 }) },
  { name: '1000K Ultra', description: 'Log 1000km total distance', iconName: 'rocket', xpReward: 500, criteria: JSON.stringify({ minTotalDistanceKm: 1000 }) },

  // Streaks
  { name: 'On Fire', description: 'Maintain a 3-day streak', iconName: 'flame', xpReward: 30, criteria: JSON.stringify({ minStreak: 3 }) },
  { name: 'Week Warrior', description: 'Maintain a 7-day streak', iconName: 'calendar', xpReward: 75, criteria: JSON.stringify({ minStreak: 7 }) },
  { name: 'Unstoppable', description: 'Maintain a 14-day streak', iconName: 'zap', xpReward: 150, criteria: JSON.stringify({ minStreak: 14 }) },
  { name: 'Iron Will', description: 'Maintain a 30-day streak', iconName: 'diamond', xpReward: 300, criteria: JSON.stringify({ minStreak: 30 }) },

  // Level milestones
  { name: 'Level 3 Runner', description: 'Reach Level 3', iconName: 'trending-up', xpReward: 50, criteria: JSON.stringify({ minLevel: 3 }) },
  { name: 'Level 5 Speedster', description: 'Reach Level 5', iconName: 'gauge', xpReward: 100, criteria: JSON.stringify({ minLevel: 5 }) },
  { name: 'Level 8 Ultra Beast', description: 'Reach Level 8', iconName: 'star', xpReward: 200, criteria: JSON.stringify({ minLevel: 8 }) },
  { name: 'GOAT Status', description: 'Reach Level 10', iconName: 'crown', xpReward: 500, criteria: JSON.stringify({ minLevel: 10 }) },
];

async function seed() {
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }
  console.log(`Seeded ${badges.length} badges`);

  // Retroactively award badges to existing runners
  const runners = await prisma.runnerProfile.findMany();
  for (const runner of runners) {
    const totalActivities = await prisma.activityLog.count({ where: { runnerId: runner.id } });
    const totalDist = await prisma.activityLog.aggregate({ where: { runnerId: runner.id }, _sum: { distanceKm: true } });
    const maxDist = await prisma.activityLog.aggregate({ where: { runnerId: runner.id }, _max: { distanceKm: true } });

    const stats = {
      totalRuns: totalActivities,
      totalDistanceKm: Number(totalDist._sum.distanceKm) || 0,
      maxSingleRunKm: Number(maxDist._max.distanceKm) || 0,
      currentStreak: runner.currentStreak,
      longestStreak: runner.longestStreak,
      level: runner.level,
    };

    const allBadges = await prisma.badge.findMany({ include: { runners: { where: { runnerId: runner.id } } } });
    const unearned = allBadges.filter(b => b.runners.length === 0);

    let earned = 0;
    for (const badge of unearned) {
      const c = JSON.parse(badge.criteria);
      let qualifies = false;

      // Onboarding badge — everyone gets it
      if (c.onboarding) { qualifies = true; }
      else {
        qualifies = true;
        if (c.minTotalRuns && stats.totalRuns < c.minTotalRuns) qualifies = false;
        if (c.minTotalDistanceKm && stats.totalDistanceKm < c.minTotalDistanceKm) qualifies = false;
        if (c.minStreak && Math.max(stats.currentStreak, stats.longestStreak) < c.minStreak) qualifies = false;
        if (c.minSingleRunKm && stats.maxSingleRunKm < c.minSingleRunKm) qualifies = false;
        if (c.minLevel && stats.level < c.minLevel) qualifies = false;
      }

      if (qualifies) {
        await prisma.runnerBadge.create({ data: { runnerId: runner.id, badgeId: badge.id } });
        await prisma.runnerProfile.update({ where: { id: runner.id }, data: { xpPoints: { increment: badge.xpReward } } });
        earned++;
      }
    }
    console.log(`${runner.name}: earned ${earned} badges (stats: ${stats.totalRuns} runs, ${stats.totalDistanceKm}km, level ${stats.level})`);
  }

  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });

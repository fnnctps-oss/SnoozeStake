import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const statsRouter = Router();

statsRouter.use(requireAuth);

// GET /api/stats/dashboard
statsRouter.get('/dashboard', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        walletBalance: true,
        totalSnoozed: true,
        totalSaved: true,
        currentStreak: true,
        longestStreak: true,
        streakStartDate: true,
      },
    });
    if (!user) throw new AppError(404, 'User not found');

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todaySnoozes, todayWakes] = await Promise.all([
      prisma.snoozeEvent.findMany({
        where: { userId: req.userId!, snoozedAt: { gte: todayStart } },
      }),
      prisma.wakeUpEvent.findMany({
        where: { userId: req.userId!, wokeUpAt: { gte: todayStart } },
      }),
    ]);

    const todaySnoozeCount = todaySnoozes.length;
    const todayPenalty = todaySnoozes.reduce((sum, s) => sum + Number(s.penaltyAmount), 0);
    const todayMoneySaved = todayWakes.reduce((sum, w) => sum + Number(w.moneySaved), 0);

    // Weekly stats (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const [weeklySnoozes, weeklyWakes] = await Promise.all([
      prisma.snoozeEvent.findMany({
        where: { userId: req.userId!, snoozedAt: { gte: weekStart } },
        orderBy: { snoozedAt: 'asc' },
      }),
      prisma.wakeUpEvent.findMany({
        where: { userId: req.userId!, wokeUpAt: { gte: weekStart } },
        orderBy: { wokeUpAt: 'asc' },
      }),
    ]);

    // Group by day — include all 7 days even if empty
    const dailyStats: Record<string, { snoozeCount: number; penalty: number; saved: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyStats[key] = { snoozeCount: 0, penalty: 0, saved: 0 };
    }
    weeklySnoozes.forEach((s) => {
      const day = s.snoozedAt.toISOString().split('T')[0];
      if (dailyStats[day]) {
        dailyStats[day].snoozeCount++;
        dailyStats[day].penalty += Number(s.penaltyAmount);
      }
    });
    weeklyWakes.forEach((w) => {
      const day = w.wokeUpAt.toISOString().split('T')[0];
      if (dailyStats[day]) {
        dailyStats[day].saved += Number(w.moneySaved);
      }
    });

    res.json({
      user,
      today: {
        snoozeCount: todaySnoozeCount,
        totalPenalty: todayPenalty,
        moneySaved: todayMoneySaved,
      },
      weekly: dailyStats,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/history
statsRouter.get('/history', async (req: AuthRequest, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    const [snoozeEvents, wakeEvents] = await Promise.all([
      prisma.snoozeEvent.findMany({
        where: { userId: req.userId! },
        include: { alarm: { select: { label: true } } },
        orderBy: { snoozedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wakeUpEvent.findMany({
        where: { userId: req.userId! },
        include: { alarm: { select: { label: true } } },
        orderBy: { wokeUpAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ snoozeEvents, wakeEvents, page, limit });
  } catch (err) {
    next(err);
  }
});

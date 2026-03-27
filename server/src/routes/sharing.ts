import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { paramStr } from '../utils/params';
import { CardGenerator } from '../services/CardGenerator';

export const sharingRouter = Router();

sharingRouter.use(requireAuth);

// POST /api/share/weekly-card
sharingRouter.post('/weekly-card', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError(404, 'User not found');

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const snoozeEvents = await prisma.snoozeEvent.findMany({
      where: { userId: req.userId!, snoozedAt: { gte: weekStart } },
      orderBy: { snoozedAt: 'asc' },
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyBreakdown = days.map((day, i) => {
      const daySnoozes = snoozeEvents.filter((s) => {
        const d = new Date(s.snoozedAt).getDay();
        return d === (i + 1) % 7;
      });
      return {
        day,
        amount: daySnoozes.reduce((sum, s) => sum + Number(s.penaltyAmount), 0),
      };
    });

    const totalSpent = snoozeEvents.reduce((sum, s) => sum + Number(s.penaltyAmount), 0);

    const imageBuffer = CardGenerator.generateWeeklyCard({
      displayName: user.displayName,
      referralCode: user.referralCode,
      totalSpent,
      dailyBreakdown,
      totalSnoozes: snoozeEvents.length,
    });

    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (err) {
    next(err);
  }
});

// POST /api/share/streak-card
sharingRouter.post('/streak-card', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError(404, 'User not found');

    const imageBuffer = CardGenerator.generateStreakCard({
      displayName: user.displayName,
      referralCode: user.referralCode,
      streakDays: user.currentStreak,
      moneySaved: Number(user.totalSaved),
    });

    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (err) {
    next(err);
  }
});

// POST /api/share/death-card
sharingRouter.post('/death-card', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError(404, 'User not found');

    // Get last snooze event (the one that broke the streak)
    const lastSnooze = await prisma.snoozeEvent.findFirst({
      where: { userId: req.userId! },
      orderBy: { snoozedAt: 'desc' },
    });

    const imageBuffer = CardGenerator.generateDeathCard({
      displayName: user.displayName,
      referralCode: user.referralCode,
      streakDays: user.longestStreak,
      finalCost: lastSnooze ? Number(lastSnooze.penaltyAmount) : 0,
      startDate: user.streakStartDate
        ? user.streakStartDate.toLocaleDateString()
        : 'Unknown',
      endDate: new Date().toLocaleDateString(),
    });

    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (err) {
    next(err);
  }
});

// POST /api/share/battle-card
sharingRouter.post('/battle-card', async (req: AuthRequest, res, next) => {
  try {
    const { battleId } = req.body;
    if (!battleId) throw new AppError(400, 'battleId required');

    const battle = await prisma.snoozeBattle.findFirst({
      where: {
        id: battleId,
        OR: [{ challengerId: req.userId! }, { opponentId: req.userId! }],
        status: 'COMPLETED',
      },
      include: {
        challenger: { select: { displayName: true, referralCode: true } },
        opponent: { select: { displayName: true, referralCode: true } },
      },
    });

    if (!battle) throw new AppError(404, 'Battle not found');

    const isChallenger = battle.challengerId === req.userId;
    const isWinner = battle.winnerId === req.userId;
    const myReferralCode = isChallenger
      ? battle.challenger.referralCode
      : battle.opponent.referralCode;

    const winnerName = battle.challengerSnoozeCount <= battle.opponentSnoozeCount
      ? battle.challenger.displayName
      : battle.opponent.displayName;
    const loserName = battle.challengerSnoozeCount > battle.opponentSnoozeCount
      ? battle.challenger.displayName
      : battle.opponent.displayName;

    const imageBuffer = CardGenerator.generateBattleCard({
      referralCode: myReferralCode,
      winnerName,
      loserName,
      winnerSnoozes: Math.min(battle.challengerSnoozeCount, battle.opponentSnoozeCount),
      loserSnoozes: Math.max(battle.challengerSnoozeCount, battle.opponentSnoozeCount),
      betAmount: Number(battle.betAmount),
      isWinner,
    });

    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (err) {
    next(err);
  }
});


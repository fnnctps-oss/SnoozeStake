import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const feedRouter = Router();

feedRouter.use(requireAuth);

// GET /api/feed — Social feed (friends' snooze activity)
feedRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    // Get friend IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { initiatorId: req.userId!, status: 'ACCEPTED' },
          { receiverId: req.userId!, status: 'ACCEPTED' },
        ],
      },
    });

    const friendIds = friendships.map((f) =>
      f.initiatorId === req.userId ? f.receiverId : f.initiatorId
    );

    // Include self in feed
    const userIds = [req.userId!, ...friendIds];

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    // Get recent snooze + wake events
    const [snoozeEvents, wakeEvents] = await Promise.all([
      prisma.snoozeEvent.findMany({
        where: { userId: { in: userIds } },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          alarm: { select: { label: true } },
        },
        orderBy: { snoozedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wakeUpEvent.findMany({
        where: { userId: { in: userIds } },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          alarm: { select: { label: true } },
        },
        orderBy: { wokeUpAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Combine and sort by time
    const feed = [
      ...snoozeEvents.map((e) => ({
        type: 'snooze' as const,
        userId: e.user.id,
        displayName: e.user.displayName,
        avatarUrl: e.user.avatarUrl,
        alarmLabel: e.alarm.label,
        amount: e.penaltyAmount,
        timestamp: e.snoozedAt,
        snoozeNumber: e.snoozeNumber,
      })),
      ...wakeEvents.map((e) => ({
        type: 'wake' as const,
        userId: e.user.id,
        displayName: e.user.displayName,
        avatarUrl: e.user.avatarUrl,
        alarmLabel: e.alarm.label,
        amount: e.moneySaved,
        timestamp: e.wokeUpAt,
        snoozeCount: e.snoozeCount,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ feed: feed.slice(0, limit), page });
  } catch (err) {
    next(err);
  }
});

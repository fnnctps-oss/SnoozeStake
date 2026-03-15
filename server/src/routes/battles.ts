import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { paramStr } from '../utils/params';

export const battleRouter = Router();

battleRouter.use(requireAuth);

const createBattleSchema = z.object({
  opponentId: z.string().uuid(),
  betAmount: z.number().min(1).max(50),
});

// POST /api/battles — Create battle challenge
battleRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { opponentId, betAmount } = createBattleSchema.parse(req.body);

    if (opponentId === req.userId) {
      throw new AppError(400, 'Cannot challenge yourself');
    }

    // Verify friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: req.userId!, receiverId: opponentId, status: 'ACCEPTED' },
          { initiatorId: opponentId, receiverId: req.userId!, status: 'ACCEPTED' },
        ],
      },
    });
    if (!friendship) throw new AppError(400, 'You can only challenge friends');

    // Check wallet balance
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || Number(user.walletBalance) < betAmount) {
      throw new AppError(402, 'Insufficient wallet balance for bet');
    }

    // Set battle period (next Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + daysUntilMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const battle = await prisma.snoozeBattle.create({
      data: {
        challengerId: req.userId!,
        opponentId,
        betAmount,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        status: 'PENDING',
      },
    });

    res.status(201).json({ battle });
  } catch (err) {
    next(err);
  }
});

// POST /api/battles/:id/accept
battleRouter.post('/:id/accept', async (req: AuthRequest, res, next) => {
  try {
    const battle = await prisma.snoozeBattle.findFirst({
      where: { id: paramStr(req.params.id), opponentId: req.userId!, status: 'PENDING' },
    });
    if (!battle) throw new AppError(404, 'Battle not found');

    // Check opponent wallet
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || Number(user.walletBalance) < Number(battle.betAmount)) {
      throw new AppError(402, 'Insufficient wallet balance for bet');
    }

    const updated = await prisma.snoozeBattle.update({
      where: { id: battle.id },
      data: { status: 'ACTIVE' },
    });

    res.json({ battle: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/battles/:id/decline
battleRouter.post('/:id/decline', async (req: AuthRequest, res, next) => {
  try {
    const battle = await prisma.snoozeBattle.findFirst({
      where: { id: paramStr(req.params.id), opponentId: req.userId!, status: 'PENDING' },
    });
    if (!battle) throw new AppError(404, 'Battle not found');

    const updated = await prisma.snoozeBattle.update({
      where: { id: battle.id },
      data: { status: 'CANCELLED' },
    });

    res.json({ battle: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/battles — List battles
battleRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const battles = await prisma.snoozeBattle.findMany({
      where: {
        OR: [
          { challengerId: req.userId! },
          { opponentId: req.userId! },
        ],
      },
      include: {
        challenger: { select: { id: true, displayName: true, avatarUrl: true } },
        opponent: { select: { id: true, displayName: true, avatarUrl: true } },
        winner: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ battles });
  } catch (err) {
    next(err);
  }
});

// GET /api/battles/:id — Battle detail
battleRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const battle = await prisma.snoozeBattle.findFirst({
      where: {
        id: paramStr(req.params.id),
        OR: [
          { challengerId: req.userId! },
          { opponentId: req.userId! },
        ],
      },
      include: {
        challenger: { select: { id: true, displayName: true, avatarUrl: true } },
        opponent: { select: { id: true, displayName: true, avatarUrl: true } },
        winner: { select: { id: true, displayName: true } },
      },
    });

    if (!battle) throw new AppError(404, 'Battle not found');
    res.json({ battle });
  } catch (err) {
    next(err);
  }
});

import { Router } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { PenaltyService } from '../services/PenaltyService';

export const snoozeRouter = Router();

snoozeRouter.use(requireAuth);

const snoozeSchema = z.object({
  alarmId: z.string().uuid(),
  snoozeNumber: z.number().min(1).max(10),
});

const wakeSchema = z.object({
  alarmId: z.string().uuid(),
  snoozeCount: z.number().min(0),
  totalPenalty: z.number().min(0),
  taskCompleted: z.enum(['NONE', 'MATH', 'QR_SCAN', 'PHOTO_SUNLIGHT', 'WALK_STEPS', 'SHAKE_PHONE', 'BARCODE_SCAN', 'TYPING_TEST']).optional(),
});

// POST /api/snooze — Record snooze, deduct wallet, split 75/25
snoozeRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = snoozeSchema.parse(req.body);

    const [user, alarm] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId! } }),
      prisma.alarm.findFirst({ where: { id: body.alarmId, userId: req.userId! } }),
    ]);

    if (!user) throw new AppError(404, 'User not found');
    if (!alarm) throw new AppError(404, 'Alarm not found');

    if (body.snoozeNumber > alarm.maxSnoozes) {
      throw new AppError(400, 'Maximum snoozes reached. You must wake up!');
    }

    // Calculate penalty with 75/25 split
    const { rawPenalty, platformFee, recipientAmount } = PenaltyService.calculatePenalty(
      alarm,
      body.snoozeNumber
    );

    // Check wallet balance
    if (user.walletBalance.lessThan(rawPenalty)) {
      throw new AppError(402, 'Insufficient wallet balance. Top up or wake up!');
    }

    // Execute transaction atomically
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: { decrement: rawPenalty },
          totalSnoozed: { increment: rawPenalty },
          currentStreak: 0,
          streakStartDate: null,
        },
      });

      // Create snooze event
      const snoozeEvent = await tx.snoozeEvent.create({
        data: {
          userId: user.id,
          alarmId: alarm.id,
          snoozeNumber: body.snoozeNumber,
          penaltyAmount: rawPenalty,
          platformFee,
          recipientAmount,
          destination: alarm.penaltyDestination,
          charityId: alarm.charityId,
          friendRecipientId: alarm.friendRecipientId,
          status: 'COMPLETED',
        },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'SNOOZE_PENALTY',
          amount: rawPenalty,
          platformFee,
          status: 'COMPLETED',
          description: `Snooze #${body.snoozeNumber} on "${alarm.label}" — ${PenaltyService.getSplitDescription(alarm.penaltyDestination)}`,
        },
      });

      // Route 75% to destination
      if (alarm.penaltyDestination === 'SAVINGS') {
        await tx.user.update({
          where: { id: user.id },
          data: { totalSaved: { increment: recipientAmount } },
        });
      } else if (alarm.penaltyDestination === 'FRIEND' && alarm.friendRecipientId) {
        await tx.user.update({
          where: { id: alarm.friendRecipientId },
          data: { walletBalance: { increment: recipientAmount } },
        });
        await tx.transaction.create({
          data: {
            userId: alarm.friendRecipientId,
            type: 'FRIEND_TRANSFER',
            amount: recipientAmount,
            status: 'COMPLETED',
            description: `Received from ${user.displayName}'s snooze penalty`,
          },
        });
      }
      // CHARITY: queued for batch processing

      return { snoozeEvent, updatedUser };
    });

    // Calculate next snooze cost
    const nextSnooze = body.snoozeNumber < alarm.maxSnoozes
      ? PenaltyService.calculatePenalty(alarm, body.snoozeNumber + 1)
      : null;

    res.json({
      snoozeEvent: result.snoozeEvent,
      walletBalance: result.updatedUser.walletBalance,
      nextSnoozeCost: nextSnooze?.rawPenalty || null,
      snoozesRemaining: alarm.maxSnoozes - body.snoozeNumber,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/wake — Record wake-up, update streak
snoozeRouter.post('/wake', async (req: AuthRequest, res, next) => {
  try {
    const body = wakeSchema.parse(req.body);

    const [user, alarm] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId! } }),
      prisma.alarm.findFirst({ where: { id: body.alarmId, userId: req.userId! } }),
    ]);

    if (!user) throw new AppError(404, 'User not found');
    if (!alarm) throw new AppError(404, 'Alarm not found');

    // Calculate money saved
    const maxPenalty = PenaltyService.calculateMaxPenalty(alarm, alarm.maxSnoozes);
    const moneySaved = new Decimal(Number(maxPenalty) - body.totalPenalty);

    const result = await prisma.$transaction(async (tx) => {
      const wakeUpEvent = await tx.wakeUpEvent.create({
        data: {
          userId: user.id,
          alarmId: alarm.id,
          snoozeCount: body.snoozeCount,
          totalPenalty: new Decimal(body.totalPenalty),
          moneySaved: moneySaved.greaterThan(0) ? moneySaved : new Decimal(0),
          taskCompleted: body.taskCompleted || null,
        },
      });

      // Update streak if no snoozes
      let updatedUser = user;
      if (body.snoozeCount === 0) {
        const newStreak = user.currentStreak + 1;
        updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, user.longestStreak),
            streakStartDate: user.streakStartDate || new Date(),
            totalSaved: { increment: moneySaved.greaterThan(0) ? moneySaved : new Decimal(0) },
          },
        });
      }

      return { wakeUpEvent, updatedUser };
    });

    res.json({
      wakeUpEvent: result.wakeUpEvent,
      currentStreak: result.updatedUser.currentStreak,
      longestStreak: result.updatedUser.longestStreak,
      moneySaved: moneySaved.greaterThan(0) ? moneySaved : new Decimal(0),
    });
  } catch (err) {
    next(err);
  }
});

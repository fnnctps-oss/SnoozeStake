import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const referralRouter = Router();

referralRouter.use(requireAuth);

// GET /api/referral — Get my referral code and stats
referralRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { referralCode: true },
    });
    if (!user) throw new AppError(404, 'User not found');

    const referralCount = await prisma.user.count({
      where: { referredBy: user.referralCode },
    });

    res.json({
      referralCode: user.referralCode,
      referralCount,
      rewardPerReferral: 1.0,
      shareUrl: `https://snoozestake.com/r/${user.referralCode}`,
    });
  } catch (err) {
    next(err);
  }
});

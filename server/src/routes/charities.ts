import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { paramStr } from '../utils/params';

export const charityRouter = Router();

// GET /api/charities — List all active charities
charityRouter.get('/', async (_req, res, next) => {
  try {
    const charities = await prisma.charity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ charities });
  } catch (err) {
    next(err);
  }
});

// GET /api/charities/:id — Charity detail with community stats
charityRouter.get('/:id', async (req, res, next) => {
  try {
    const charity = await prisma.charity.findUnique({
      where: { id: paramStr(req.params.id) },
    });
    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    // Get community donation stats
    const donations = await prisma.snoozeEvent.aggregate({
      where: { charityId: charity.id, status: 'COMPLETED' },
      _sum: { recipientAmount: true },
      _count: true,
    });

    const uniqueDonors = await prisma.snoozeEvent.groupBy({
      by: ['userId'],
      where: { charityId: charity.id, status: 'COMPLETED' },
    });

    res.json({
      charity,
      communityStats: {
        totalDonated: donations._sum.recipientAmount || 0,
        totalDonations: donations._count,
        uniqueDonors: uniqueDonors.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/charities/impact — User's charity impact
charityRouter.get('/user/impact', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const donations = await prisma.snoozeEvent.findMany({
      where: {
        userId: req.userId!,
        destination: 'CHARITY',
        status: 'COMPLETED',
      },
      include: { charity: true },
    });

    const byCharity: Record<string, { charity: any; total: number; count: number }> = {};
    let totalDonated = 0;

    donations.forEach((d) => {
      const amount = Number(d.recipientAmount);
      totalDonated += amount;
      if (d.charityId && d.charity) {
        if (!byCharity[d.charityId]) {
          byCharity[d.charityId] = { charity: d.charity, total: 0, count: 0 };
        }
        byCharity[d.charityId].total += amount;
        byCharity[d.charityId].count++;
      }
    });

    res.json({
      totalDonated,
      totalDonations: donations.length,
      byCharity: Object.values(byCharity),
    });
  } catch (err) {
    next(err);
  }
});

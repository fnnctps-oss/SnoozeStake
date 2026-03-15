import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { paramStr } from '../utils/params';

export const friendRouter = Router();

friendRouter.use(requireAuth);

// GET /api/friends — List friends
friendRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { initiatorId: req.userId!, status: 'ACCEPTED' },
          { receiverId: req.userId!, status: 'ACCEPTED' },
        ],
      },
      include: {
        initiator: { select: { id: true, displayName: true, avatarUrl: true, currentStreak: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true, currentStreak: true } },
      },
    });

    const friends = friendships.map((f) =>
      f.initiatorId === req.userId ? f.receiver : f.initiator
    );

    res.json({ friends });
  } catch (err) {
    next(err);
  }
});

// GET /api/friends/pending — List pending invites received
friendRouter.get('/pending', async (req: AuthRequest, res, next) => {
  try {
    const pending = await prisma.friendship.findMany({
      where: { receiverId: req.userId!, status: 'PENDING' },
      include: {
        initiator: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
    res.json({ pending });
  } catch (err) {
    next(err);
  }
});

// POST /api/friends/invite — Send friend invite by email or referral code
friendRouter.post('/invite', async (req: AuthRequest, res, next) => {
  try {
    const { identifier } = z
      .object({ identifier: z.string().min(1) })
      .parse(req.body);

    // Find user by email or referral code
    const target = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { referralCode: identifier.toUpperCase() },
        ],
      },
    });

    if (!target) throw new AppError(404, 'User not found');
    if (target.id === req.userId) throw new AppError(400, 'Cannot invite yourself');

    // Check existing friendship
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: req.userId!, receiverId: target.id },
          { initiatorId: target.id, receiverId: req.userId! },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') throw new AppError(400, 'Already friends');
      if (existing.status === 'PENDING') throw new AppError(400, 'Invite already sent');
    }

    const friendship = await prisma.friendship.create({
      data: {
        initiatorId: req.userId!,
        receiverId: target.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({ friendship });
  } catch (err) {
    next(err);
  }
});

// POST /api/friends/accept/:id — Accept friend invite
friendRouter.post('/accept/:id', async (req: AuthRequest, res, next) => {
  try {
    const friendship = await prisma.friendship.findFirst({
      where: { id: paramStr(req.params.id), receiverId: req.userId!, status: 'PENDING' },
    });
    if (!friendship) throw new AppError(404, 'Invite not found');

    const updated = await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'ACCEPTED' },
    });

    res.json({ friendship: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/friends/decline/:id — Decline friend invite
friendRouter.post('/decline/:id', async (req: AuthRequest, res, next) => {
  try {
    const friendship = await prisma.friendship.findFirst({
      where: { id: paramStr(req.params.id), receiverId: req.userId!, status: 'PENDING' },
    });
    if (!friendship) throw new AppError(404, 'Invite not found');

    const updated = await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'DECLINED' },
    });

    res.json({ friendship: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/friends/:id — Remove friend
friendRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: req.userId!, receiverId: paramStr(req.params.id), status: 'ACCEPTED' },
          { initiatorId: paramStr(req.params.id), receiverId: req.userId!, status: 'ACCEPTED' },
        ],
      },
    });
    if (!friendship) throw new AppError(404, 'Friendship not found');

    await prisma.friendship.delete({ where: { id: friendship.id } });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    next(err);
  }
});

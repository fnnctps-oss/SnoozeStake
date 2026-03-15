import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { paramStr } from '../utils/params';

export const groupRouter = Router();

groupRouter.use(requireAuth);

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/groups — Create group
groupRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(50) }).parse(req.body);

    let inviteCode: string;
    let isUnique = false;
    do {
      inviteCode = generateInviteCode();
      const exists = await prisma.accountabilityGroup.findUnique({ where: { inviteCode } });
      isUnique = !exists;
    } while (!isUnique);

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.accountabilityGroup.create({
        data: {
          name,
          createdById: req.userId!,
          inviteCode,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: g.id,
          userId: req.userId!,
          role: 'ADMIN',
        },
      });

      return g;
    });

    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/join — Join by invite code
groupRouter.post('/join', async (req: AuthRequest, res, next) => {
  try {
    const { inviteCode } = z
      .object({ inviteCode: z.string().min(1) })
      .parse(req.body);

    const group = await prisma.accountabilityGroup.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: { members: true },
    });

    if (!group) throw new AppError(404, 'Group not found');

    if (group.members.length >= group.maxMembers) {
      throw new AppError(400, 'Group is full');
    }

    const alreadyMember = group.members.find((m) => m.userId === req.userId);
    if (alreadyMember) throw new AppError(400, 'Already a member');

    const member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: req.userId!,
        role: 'MEMBER',
      },
    });

    res.status(201).json({ member, group });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups — List my groups
groupRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.userId! },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: { select: { id: true, displayName: true, avatarUrl: true, currentStreak: true } },
              },
            },
          },
        },
      },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      myRole: m.role,
    }));

    res.json({ groups });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id — Group detail
groupRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: paramStr(req.params.id), userId: req.userId! },
    });
    if (!membership) throw new AppError(403, 'Not a member of this group');

    const group = await prisma.accountabilityGroup.findUnique({
      where: { id: paramStr(req.params.id) },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                currentStreak: true,
                totalSnoozed: true,
              },
            },
          },
        },
      },
    });

    // Get recent snooze events from group members
    const memberIds = group?.members.map((m) => m.userId) || [];
    const recentActivity = await prisma.snoozeEvent.findMany({
      where: {
        userId: { in: memberIds },
        snoozedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        user: { select: { displayName: true } },
        alarm: { select: { label: true } },
      },
      orderBy: { snoozedAt: 'desc' },
      take: 50,
    });

    // Weekly leaderboard (fewest snoozes)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const leaderboard = await Promise.all(
      memberIds.map(async (userId) => {
        const snoozeCount = await prisma.snoozeEvent.count({
          where: { userId, snoozedAt: { gte: weekStart } },
        });
        const member = group?.members.find((m) => m.userId === userId);
        return {
          userId,
          displayName: member?.user.displayName || 'Unknown',
          snoozeCount,
        };
      })
    );
    leaderboard.sort((a, b) => a.snoozeCount - b.snoozeCount);

    res.json({ group, recentActivity, leaderboard, myRole: membership.role });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/leave
groupRouter.post('/:id/leave', async (req: AuthRequest, res, next) => {
  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: paramStr(req.params.id), userId: req.userId! },
    });
    if (!membership) throw new AppError(404, 'Not a member');

    await prisma.groupMember.delete({ where: { id: membership.id } });
    res.json({ message: 'Left the group' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/groups/:id — Delete group (admin only)
groupRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: paramStr(req.params.id), userId: req.userId!, role: 'ADMIN' },
    });
    if (!membership) throw new AppError(403, 'Only admins can delete groups');

    await prisma.$transaction([
      prisma.groupMember.deleteMany({ where: { groupId: paramStr(req.params.id) } }),
      prisma.accountabilityGroup.delete({ where: { id: paramStr(req.params.id) } }),
    ]);

    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
});

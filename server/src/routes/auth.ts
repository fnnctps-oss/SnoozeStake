import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const registerSchema = z.object({
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  referralCode: z.string().optional(),
});

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { firebaseUid: body.firebaseUid },
    });
    if (existing) {
      throw new AppError(409, 'User already exists');
    }

    let referralCode: string;
    let isUnique = false;
    do {
      referralCode = generateReferralCode();
      const exists = await prisma.user.findUnique({ where: { referralCode } });
      isUnique = !exists;
    } while (!isUnique);

    const user = await prisma.user.create({
      data: {
        firebaseUid: body.firebaseUid,
        email: body.email,
        displayName: body.displayName,
        referralCode,
        referredBy: body.referralCode || null,
      },
    });

    // If referred, credit both users $1
    if (body.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: body.referralCode },
      });
      if (referrer) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: referrer.id },
            data: { walletBalance: { increment: 1.0 } },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { walletBalance: { increment: 1.0 } },
          }),
        ]);
      }
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { firebaseUid } = z
      .object({ firebaseUid: z.string().min(1) })
      .parse(req.body);

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });
    if (!user) {
      throw new AppError(404, 'User not found. Please register first.');
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.json({ user, token });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

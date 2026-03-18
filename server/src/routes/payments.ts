import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { stripe } from '../utils/stripe';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const paymentRouter = Router();

// ─── Authenticated routes ─────────────────────────────────────

paymentRouter.use(requireAuth);

// GET /api/payments/config — Return publishable key to the app
paymentRouter.get('/config', (_req: AuthRequest, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  });
});

// POST /api/payments/create-payment-intent — Create a PaymentIntent for wallet top-up
const topUpSchema = z.object({
  amount: z.number().min(1).max(500), // $1 – $500
});

paymentRouter.post('/create-payment-intent', async (req: AuthRequest, res, next) => {
  try {
    const { amount } = topUpSchema.parse(req.body);
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create PaymentIntent (amount in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        userId,
        type: 'wallet_topup',
        topUpAmount: String(amount),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/history — Get user's payment/transaction history
paymentRouter.get('/history', async (req: AuthRequest, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/wallet — Get wallet balance
paymentRouter.get('/wallet', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { walletBalance: true, totalSnoozed: true, totalSaved: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

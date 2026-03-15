import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const walletRouter = Router();

walletRouter.use(requireAuth);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
});

const topUpSchema = z.object({
  amount: z.number().min(1).max(500), // $1 - $500
});

// GET /api/wallet
walletRouter.get('/', async (req: AuthRequest, res, next) => {
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

// POST /api/wallet/topup — Create Stripe PaymentIntent
walletRouter.post('/topup', async (req: AuthRequest, res, next) => {
  try {
    const { amount } = topUpSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError(404, 'User not found');

    // Ensure Stripe customer exists
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: { userId: user.id, type: 'WALLET_TOPUP' },
    });

    // Record pending transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'WALLET_TOPUP',
        amount,
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
        description: `Wallet top-up: $${amount.toFixed(2)}`,
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

// POST /api/wallet/topup/confirm
walletRouter.post('/topup/confirm', async (req: AuthRequest, res, next) => {
  try {
    const { paymentIntentId } = z
      .object({ paymentIntentId: z.string() })
      .parse(req.body);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError(400, 'Payment not yet confirmed');
    }

    const amount = paymentIntent.amount / 100;

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.transaction.updateMany({
        where: { stripePaymentIntentId: paymentIntentId, userId: req.userId! },
        data: { status: 'COMPLETED' },
      });

      return tx.user.update({
        where: { id: req.userId! },
        data: { walletBalance: { increment: amount } },
      });
    });

    res.json({ walletBalance: updatedUser.walletBalance });
  } catch (err) {
    next(err);
  }
});

// GET /api/wallet/transactions
walletRouter.get('/transactions', async (req: AuthRequest, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId: req.userId! } }),
    ]);

    res.json({ transactions, total, page, limit });
  } catch (err) {
    next(err);
  }
});

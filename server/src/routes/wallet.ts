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
    res.json({
      ...user,
      canWithdraw: Number(user.totalSaved) >= 10,
    });
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

// POST /api/wallet/withdraw — Withdraw savings to bank ($10 minimum)
const withdrawSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is $10.00'),
});

walletRouter.post('/withdraw', async (req: AuthRequest, res, next) => {
  try {
    const { amount } = withdrawSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError(404, 'User not found');

    if (Number(user.totalSaved) < 10) {
      throw new AppError(400, 'Minimum withdrawal threshold is $10.00');
    }

    if (Number(user.totalSaved) < amount) {
      throw new AppError(400, 'Insufficient savings balance');
    }

    if (!user.stripeCustomerId) {
      throw new AppError(400, 'No payment method on file. Please add a bank account first.');
    }

    // Create Stripe payout/transfer to user's bank
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      destination: user.stripeCustomerId,
      metadata: { userId: user.id, type: 'SAVINGS_WITHDRAWAL' },
    });

    // Deduct from savings and record transaction atomically
    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'SAVINGS_WITHDRAWAL',
          amount,
          stripePaymentIntentId: transfer.id,
          status: 'COMPLETED',
          description: `Savings withdrawal: $${amount.toFixed(2)}`,
        },
      });

      return tx.user.update({
        where: { id: user.id },
        data: { totalSaved: { decrement: amount } },
      });
    });

    res.json({
      totalSaved: updatedUser.totalSaved,
      canWithdraw: Number(updatedUser.totalSaved) >= 10,
      withdrawnAmount: amount,
      transferId: transfer.id,
    });
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

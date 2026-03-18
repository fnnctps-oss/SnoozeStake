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
  amount: z.number().min(10).max(500), // $10 – $500
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

    // Create ephemeral key so Payment Sheet can show saved cards
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: stripeCustomerId },
      { apiVersion: '2025-02-24.acacia' },
    );

    // Create PaymentIntent (amount in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: stripeCustomerId,
      setup_future_usage: 'off_session', // saves the card for future payments
      metadata: {
        userId,
        type: 'wallet_topup',
        topUpAmount: String(amount),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ephemeralKey: ephemeralKey.secret,
      customerId: stripeCustomerId,
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

// POST /api/payments/withdraw — Withdraw funds back to original card
const withdrawSchema = z.object({
  amount: z.number().min(1).max(500), // $1 – $500
});

const WITHDRAWAL_FEE = 0.50; // flat $0.50 processing fee

paymentRouter.post('/withdraw', async (req: AuthRequest, res, next) => {
  try {
    const { amount } = withdrawSchema.parse(req.body);
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const totalDeducted = amount + WITHDRAWAL_FEE;
    const balance = Number(user.walletBalance);

    if (balance < totalDeducted) {
      throw new AppError(400, `Insufficient balance. You need $${totalDeducted.toFixed(2)} ($${amount.toFixed(2)} + $${WITHDRAWAL_FEE.toFixed(2)} fee) but only have $${balance.toFixed(2)}.`);
    }

    // Find the most recent successful top-up transaction with a Stripe PaymentIntent
    const topUpTx = await prisma.transaction.findFirst({
      where: {
        userId,
        type: 'WALLET_TOPUP',
        status: 'COMPLETED',
        stripePaymentIntentId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!topUpTx || !topUpTx.stripePaymentIntentId) {
      throw new AppError(400, 'No refundable payment found. You can only withdraw to the card you originally topped up with.');
    }

    // Create Stripe refund (amount in cents)
    const refund = await stripe.refunds.create({
      payment_intent: topUpTx.stripePaymentIntentId,
      amount: Math.round(amount * 100), // refund the withdrawal amount (fee kept by platform)
      metadata: {
        userId,
        type: 'wallet_withdrawal',
      },
    });

    // Deduct from wallet and create transaction record atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: totalDeducted },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'SAVINGS_WITHDRAWAL',
          amount: new Decimal(amount),
          platformFee: new Decimal(WITHDRAWAL_FEE),
          stripePaymentIntentId: refund.id,
          status: 'COMPLETED',
          description: `Withdrawal of $${amount.toFixed(2)} to card (fee: $${WITHDRAWAL_FEE.toFixed(2)})`,
        },
      }),
    ]);

    res.json({
      success: true,
      amount,
      fee: WITHDRAWAL_FEE,
      netRefund: amount,
      totalDeducted,
      newBalance: balance - totalDeducted,
      refundId: refund.id,
    });
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

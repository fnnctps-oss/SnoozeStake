import { Router, Request, Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { stripe } from '../utils/stripe';
import { prisma } from '../utils/prisma';
import Stripe from 'stripe';

export const webhookRouter = Router();

// POST /api/webhook/stripe — Stripe sends payment confirmations here
// NOTE: This route must use raw body (configured in server index.ts)
webhookRouter.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && webhookSecret !== 'whsec_REPLACE_WITH_YOUR_KEY') {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Dev mode: trust the event without signature verification
      event = req.body as Stripe.Event;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata?.userId;
      const topUpAmount = paymentIntent.metadata?.topUpAmount;

      if (userId && topUpAmount && paymentIntent.metadata?.type === 'wallet_topup') {
        const amount = new Decimal(topUpAmount);

        try {
          await prisma.$transaction(async (tx) => {
            // Credit wallet
            await tx.user.update({
              where: { id: userId },
              data: {
                walletBalance: { increment: amount },
              },
            });

            // Record transaction
            await tx.transaction.create({
              data: {
                userId,
                type: 'WALLET_TOPUP',
                amount,
                status: 'COMPLETED',
                stripePaymentIntentId: paymentIntent.id,
                description: `Wallet top-up of $${topUpAmount}`,
              },
            });
          });

          console.log(`✅ Wallet top-up: $${topUpAmount} for user ${userId}`);
        } catch (err) {
          console.error('Error processing wallet top-up:', err);
          return res.status(500).send('Database error');
        }
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const refundUserId = charge.metadata?.userId;
      if (refundUserId) {
        console.log(`💸 Refund confirmed for user ${refundUserId}, charge ${charge.id}`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ Payment failed: ${paymentIntent.id}`);
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  res.json({ received: true });
});

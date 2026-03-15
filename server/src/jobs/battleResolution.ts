import { prisma } from '../utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Settle completed battles. Run Monday 12:00 AM.
 * Loser pays winner: 75% to winner, 25% platform fee.
 */
export async function resolveBattles() {
  const now = new Date();

  const completedBattles = await prisma.snoozeBattle.findMany({
    where: {
      status: 'ACTIVE',
      weekEndDate: { lt: now },
    },
  });

  for (const battle of completedBattles) {
    const challengerWins = battle.challengerSnoozeCount < battle.opponentSnoozeCount;
    const isTie = battle.challengerSnoozeCount === battle.opponentSnoozeCount;

    if (isTie) {
      // Tie — no money exchanged
      await prisma.snoozeBattle.update({
        where: { id: battle.id },
        data: { status: 'COMPLETED' },
      });
      continue;
    }

    const winnerId = challengerWins ? battle.challengerId : battle.opponentId;
    const loserId = challengerWins ? battle.opponentId : battle.challengerId;
    const betAmount = Number(battle.betAmount);
    const winnerAmount = Number((betAmount * 0.75).toFixed(2));
    const platformFee = Number((betAmount * 0.25).toFixed(2));

    await prisma.$transaction([
      // Deduct from loser
      prisma.user.update({
        where: { id: loserId },
        data: { walletBalance: { decrement: new Decimal(betAmount) } },
      }),
      // Credit winner (75%)
      prisma.user.update({
        where: { id: winnerId },
        data: { walletBalance: { increment: new Decimal(winnerAmount) } },
      }),
      // Record transactions
      prisma.transaction.create({
        data: {
          userId: loserId,
          type: 'BATTLE_BET',
          amount: new Decimal(betAmount),
          platformFee: new Decimal(platformFee),
          status: 'COMPLETED',
          description: `Lost Snooze Battle — paid $${betAmount.toFixed(2)}`,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: winnerId,
          type: 'BATTLE_WIN',
          amount: new Decimal(winnerAmount),
          status: 'COMPLETED',
          description: `Won Snooze Battle — earned $${winnerAmount.toFixed(2)}`,
        },
      }),
      // Update battle
      prisma.snoozeBattle.update({
        where: { id: battle.id },
        data: { status: 'COMPLETED', winnerId },
      }),
    ]);
  }

  console.log(`Resolved ${completedBattles.length} battles`);
}

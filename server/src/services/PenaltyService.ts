import { Decimal } from '@prisma/client/runtime/library';

interface PenaltyCalculation {
  rawPenalty: Decimal;
  platformFee: Decimal;
  recipientAmount: Decimal;
}

interface AlarmPenaltyConfig {
  snoozeBasePenalty: Decimal;
  useEscalatingPenalty: boolean;
}

export class PenaltyService {
  static readonly PLATFORM_FEE_RATE = 0.25;
  static readonly RECIPIENT_RATE = 0.75;

  /**
   * Calculate the penalty for a given snooze event.
   * Escalating penalties double with each snooze: $1 → $2 → $4 → $8 → $16
   * Split: 75% to destination, 25% platform fee
   */
  static calculatePenalty(
    alarm: AlarmPenaltyConfig,
    snoozeNumber: number
  ): PenaltyCalculation {
    const basePenalty = Number(alarm.snoozeBasePenalty);

    let rawPenaltyNum: number;
    if (alarm.useEscalatingPenalty) {
      rawPenaltyNum = basePenalty * Math.pow(2, snoozeNumber - 1);
    } else {
      rawPenaltyNum = basePenalty;
    }

    const platformFeeNum = Number((rawPenaltyNum * this.PLATFORM_FEE_RATE).toFixed(2));
    const recipientAmountNum = Number((rawPenaltyNum * this.RECIPIENT_RATE).toFixed(2));

    return {
      rawPenalty: new Decimal(rawPenaltyNum.toFixed(2)),
      platformFee: new Decimal(platformFeeNum.toFixed(2)),
      recipientAmount: new Decimal(recipientAmountNum.toFixed(2)),
    };
  }

  /**
   * Calculate the theoretical maximum penalty for an alarm (all snoozes used).
   * Used to show "money saved" when user wakes up early.
   */
  static calculateMaxPenalty(alarm: AlarmPenaltyConfig, maxSnoozes: number): Decimal {
    let total = 0;
    for (let i = 1; i <= maxSnoozes; i++) {
      const { rawPenalty } = this.calculatePenalty(alarm, i);
      total += Number(rawPenalty);
    }
    return new Decimal(total.toFixed(2));
  }

  /**
   * Get a human-readable description of the penalty split.
   */
  static getSplitDescription(): string {
    return '75% goes to your savings jar, 25% platform fee';
  }
}

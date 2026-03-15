import { createCanvas, type CanvasRenderingContext2D } from 'canvas';

const COLORS = {
  bg: '#0D0D1A',
  surface: '#1A1A2E',
  primary: '#6C3CE1',
  accent: '#00E676',
  danger: '#FF6B6B',
  text: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBranding(ctx: CanvasRenderingContext2D, width: number, height: number, referralCode: string) {
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SnoozeStake', width / 2, height - 50);
  ctx.font = '16px sans-serif';
  ctx.fillText(`snoozestake.com | Code: ${referralCode}`, width / 2, height - 25);
}

export class CardGenerator {
  /**
   * Weekly Snooze Report Card
   */
  static generateWeeklyCard(data: {
    displayName: string;
    referralCode: string;
    totalSpent: number;
    dailyBreakdown: { day: string; amount: number }[];
    totalSnoozes: number;
  }): Buffer {
    const width = 600;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Weekly Snooze Report', width / 2, 60);

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '18px sans-serif';
    ctx.fillText(data.displayName, width / 2, 90);

    // Total spent
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(`$${data.totalSpent.toFixed(2)}`, width / 2, 170);
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '18px sans-serif';
    ctx.fillText(`spent on ${data.totalSnoozes} snoozes this week`, width / 2, 200);

    // Bar chart
    const maxAmount = Math.max(...data.dailyBreakdown.map((d) => d.amount), 1);
    const barWidth = 50;
    const chartLeft = 60;
    const chartBottom = 550;
    const chartHeight = 280;

    data.dailyBreakdown.forEach((day, i) => {
      const x = chartLeft + i * 75;
      const barHeight = (day.amount / maxAmount) * chartHeight;

      // Bar
      roundRect(ctx, x, chartBottom - barHeight, barWidth, barHeight, 6);
      ctx.fillStyle = day.amount > 0 ? COLORS.danger : COLORS.accent;
      ctx.fill();

      // Amount label
      if (day.amount > 0) {
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`$${day.amount.toFixed(0)}`, x + barWidth / 2, chartBottom - barHeight - 10);
      }

      // Day label
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(day.day, x + barWidth / 2, chartBottom + 25);
    });

    drawBranding(ctx, width, height, data.referralCode);
    return canvas.toBuffer('image/png');
  }

  /**
   * Streak Achievement Card
   */
  static generateStreakCard(data: {
    displayName: string;
    referralCode: string;
    streakDays: number;
    moneySaved: number;
  }): Buffer {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Fire emoji representation
    ctx.font = '80px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥', width / 2, 120);

    // Streak count
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText(`${data.streakDays}`, width / 2, 220);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('days without snoozing!', width / 2, 260);

    // Money saved
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`$${data.moneySaved.toFixed(2)} saved`, width / 2, 340);

    // Name
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '20px sans-serif';
    ctx.fillText(data.displayName, width / 2, 400);

    drawBranding(ctx, width, height, data.referralCode);
    return canvas.toBuffer('image/png');
  }

  /**
   * Streak Death Card
   */
  static generateDeathCard(data: {
    displayName: string;
    referralCode: string;
    streakDays: number;
    finalCost: number;
    startDate: string;
    endDate: string;
  }): Buffer {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Tombstone emoji
    ctx.font = '80px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚰️', width / 2, 120);

    // RIP
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`RIP My ${data.streakDays}-Day Streak`, width / 2, 200);

    // Date range
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '18px sans-serif';
    ctx.fillText(`${data.startDate} — ${data.endDate}`, width / 2, 240);

    // Cost
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`It cost me $${data.finalCost.toFixed(2)} to snooze`, width / 2, 310);

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '20px sans-serif';
    ctx.fillText(data.displayName, width / 2, 370);

    drawBranding(ctx, width, height, data.referralCode);
    return canvas.toBuffer('image/png');
  }

  /**
   * Battle Result Card
   */
  static generateBattleCard(data: {
    referralCode: string;
    winnerName: string;
    loserName: string;
    winnerSnoozes: number;
    loserSnoozes: number;
    betAmount: number;
    isWinner: boolean;
  }): Buffer {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.isWinner ? '🏆' : '😔', width / 2, 100);

    ctx.fillStyle = data.isWinner ? COLORS.accent : COLORS.danger;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(
      data.isWinner ? 'I Won the Snooze Battle!' : 'I Lost the Snooze Battle',
      width / 2, 170
    );

    // Score
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${data.winnerName}: ${data.winnerSnoozes} snoozes`, width / 2, 250);
    ctx.fillText(`${data.loserName}: ${data.loserSnoozes} snoozes`, width / 2, 290);

    // Bet
    ctx.fillStyle = COLORS.primary;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`$${data.betAmount.toFixed(2)} bet`, width / 2, 360);

    drawBranding(ctx, width, height, data.referralCode);
    return canvas.toBuffer('image/png');
  }

  /**
   * Charity Impact Card
   */
  static generateCharityCard(data: {
    displayName: string;
    referralCode: string;
    totalDonated: number;
    charityName: string;
    period: string;
  }): Buffer {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💝', width / 2, 100);

    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`$${data.totalDonated.toFixed(2)}`, width / 2, 190);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`donated to ${data.charityName}`, width / 2, 230);

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '18px sans-serif';
    ctx.fillText(`${data.period} · ${data.displayName}`, width / 2, 280);

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '16px sans-serif';
    ctx.fillText('My snoozing is making a difference!', width / 2, 340);

    drawBranding(ctx, width, height, data.referralCode);
    return canvas.toBuffer('image/png');
  }
}

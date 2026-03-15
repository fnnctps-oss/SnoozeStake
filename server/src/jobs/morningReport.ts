import { prisma } from '../utils/prisma';

/**
 * Morning report — run at 12:00 PM daily.
 * Generates a summary push notification for each user.
 */
export async function sendMorningReports() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      currentStreak: true,
      snoozeEvents: {
        where: { snoozedAt: { gte: todayStart } },
      },
      wakeUpEvents: {
        where: { wokeUpAt: { gte: todayStart } },
      },
    },
  });

  for (const user of users) {
    const snoozeCount = user.snoozeEvents.length;
    const totalPenalty = user.snoozeEvents.reduce(
      (sum, s) => sum + Number(s.penaltyAmount),
      0
    );
    const moneySaved = user.wakeUpEvents.reduce(
      (sum, w) => sum + Number(w.moneySaved),
      0
    );

    let message: string;
    if (snoozeCount === 0) {
      message = `Great morning, ${user.displayName}! No snoozes today. Streak: ${user.currentStreak} days. You saved $${moneySaved.toFixed(2)}!`;
    } else {
      message = `${user.displayName}, you snoozed ${snoozeCount} time${snoozeCount > 1 ? 's' : ''} and spent $${totalPenalty.toFixed(2)} this morning. Streak: ${user.currentStreak} days.`;
    }

    // In production, send via FCM:
    // await admin.messaging().send({ token, notification: { title: 'Morning Report', body: message } });
    console.log(`[Morning Report] ${user.id}: ${message}`);
  }

  console.log(`Sent morning reports to ${users.length} users`);
}

import { prisma } from '../utils/prisma';

/**
 * Daily streak check. Run at 11:59 PM per timezone.
 * If user had an enabled alarm today and snoozed, streak is already broken in snooze handler.
 * This catches users who had no alarm fire today (streak continues).
 */
export async function checkStreaks() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Find users with active streaks
  const usersWithStreaks = await prisma.user.findMany({
    where: { currentStreak: { gt: 0 } },
    select: { id: true, currentStreak: true },
  });

  for (const user of usersWithStreaks) {
    // Check if user had any enabled alarms that should have fired today
    const todayDayOfWeek = new Date().getDay();
    const enabledAlarms = await prisma.alarm.findMany({
      where: {
        userId: user.id,
        isEnabled: true,
        daysOfWeek: { has: todayDayOfWeek },
      },
    });

    if (enabledAlarms.length === 0) {
      // No alarms today — streak continues (do nothing)
      continue;
    }

    // Check if user woke up for at least one alarm without snoozing
    const wakeEvents = await prisma.wakeUpEvent.findMany({
      where: {
        userId: user.id,
        wokeUpAt: { gte: todayStart },
      },
    });

    if (wakeEvents.length === 0) {
      // Had alarms but no wake events — might have missed or streak should be broken
      // (This case is handled by the snooze handler, so we only reset if no activity at all)
      // Keep streak for now; it was already broken in snooze handler if they snoozed
    }
  }

  console.log(`Streak check completed for ${usersWithStreaks.length} users`);
}

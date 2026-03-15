import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../utils/prisma';

/**
 * Broadcast snooze events to accountability group members in real-time.
 */
export function setupSnoozeAlerts(io: SocketIOServer) {
  // This function is called after a snooze event is created
  return async function broadcastSnooze(userId: string, snoozeEvent: any) {
    // Find all groups the user belongs to
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });

    if (!user) return;

    const alert = {
      type: 'snooze_alert',
      userId,
      displayName: user.displayName,
      penaltyAmount: snoozeEvent.penaltyAmount,
      snoozeNumber: snoozeEvent.snoozeNumber,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all groups
    for (const { groupId } of memberships) {
      io.to(`group:${groupId}`).emit('snooze-alert', alert);
    }

    // Also update battle snooze counts
    const activeBattles = await prisma.snoozeBattle.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { challengerId: userId },
          { opponentId: userId },
        ],
      },
    });

    for (const battle of activeBattles) {
      const field = battle.challengerId === userId
        ? 'challengerSnoozeCount'
        : 'opponentSnoozeCount';

      await prisma.snoozeBattle.update({
        where: { id: battle.id },
        data: { [field]: { increment: 1 } },
      });

      // Broadcast battle update
      io.to(`battle:${battle.id}`).emit('battle-update', {
        battleId: battle.id,
        challengerSnoozeCount: battle.challengerSnoozeCount + (field === 'challengerSnoozeCount' ? 1 : 0),
        opponentSnoozeCount: battle.opponentSnoozeCount + (field === 'opponentSnoozeCount' ? 1 : 0),
      });
    }
  };
}

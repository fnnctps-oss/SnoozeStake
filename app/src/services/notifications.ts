import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Configure how notifications appear when app is in foreground ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// ─── Request permissions ───────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
      allowCriticalAlerts: true,
    },
  });
  return status === 'granted';
}

// ─── Schedule alarm notifications ──────────────────────────────────
// Each alarm can repeat on multiple days, so we schedule one
// notification per day-of-week.
export async function scheduleAlarmNotifications(alarm: {
  id: string;
  label: string;
  time: string; // "HH:MM" 24h format
  daysOfWeek: number[]; // 1=Mon ... 7=Sun
  isActive?: boolean;
}): Promise<string[]> {
  // Cancel any existing notifications for this alarm first
  await cancelAlarmNotifications(alarm.id);

  if (alarm.isActive === false) return [];

  const [hourStr, minStr] = alarm.time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  // expo-notifications uses 1=Sunday, 2=Monday ... 7=Saturday
  // Our app uses 1=Mon ... 7=Sun, so we need to convert
  const toExpoWeekday = (day: number) => {
    // 1=Mon->2, 2=Tue->3, 3=Wed->4, 4=Thu->5, 5=Fri->6, 6=Sat->7, 7=Sun->1
    return day === 7 ? 1 : day + 1;
  };

  const notificationIds: string[] = [];

  for (const day of alarm.daysOfWeek) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Alarm — ' + (alarm.label || 'Wake Up!'),
        body: 'Tap to snooze ($$$) or wake up!',
        sound: true,
        data: {
          alarmId: alarm.id,
          type: 'alarm',
        },
        ...(Platform.OS === 'ios' && {
          interruptionLevel: 'timeSensitive',
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(day),
        hour,
        minute,
      },
    });
    notificationIds.push(id);
  }

  return notificationIds;
}

// ─── Schedule a one-time alarm (for testing / next occurrence) ─────
export async function scheduleOneTimeAlarm(alarm: {
  id: string;
  label: string;
  time: string;
}): Promise<string | null> {
  const [hourStr, minStr] = alarm.time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  // Find the next occurrence of this time
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // If target time is already past today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const secondsUntil = Math.max(1, Math.floor((target.getTime() - now.getTime()) / 1000));

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Alarm — ' + (alarm.label || 'Wake Up!'),
      body: 'Tap to snooze ($$$) or wake up!',
      sound: true,
      data: {
        alarmId: alarm.id,
        type: 'alarm',
      },
      ...(Platform.OS === 'ios' && {
        interruptionLevel: 'timeSensitive',
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntil,
      repeats: false,
    },
  });

  return id;
}

// ─── Cancel all notifications for a specific alarm ─────────────────
export async function cancelAlarmNotifications(alarmId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.alarmId === alarmId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// ─── Cancel all alarm notifications ────────────────────────────────
export async function cancelAllAlarmNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Get count of scheduled notifications ──────────────────────────
export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

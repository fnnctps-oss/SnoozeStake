import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@snoozestake_unlocked_achievements';

interface UserData {
  currentStreak: number;
  longestStreak: number;
  totalSaved: number;
}

interface AchievementMilestone {
  id: string;
  title: string;
  message: string;
  check: (user: UserData) => boolean;
}

const MILESTONES: AchievementMilestone[] = [
  {
    id: 'no_snooze_day',
    title: 'Clean Morning!',
    message: 'You woke up without snoozing! Keep it going.',
    check: (u) => u.currentStreak >= 1,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior!',
    message: '7-day no-snooze streak! You\'re building a habit.',
    check: (u) => u.longestStreak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master!',
    message: '30 days without snoozing! Incredible discipline.',
    check: (u) => u.longestStreak >= 30,
  },
  {
    id: 'streak_100',
    title: 'Century Club!',
    message: '100-day streak! You\'re a morning legend in the making.',
    check: (u) => u.longestStreak >= 100,
  },
  {
    id: 'streak_365',
    title: 'Year of Discipline!',
    message: '365-day streak! An entire year of waking up on time.',
    check: (u) => u.longestStreak >= 365,
  },
  {
    id: 'saved_10',
    title: 'Smart Saver!',
    message: 'You\'ve saved $10 by not snoozing. Keep stacking!',
    check: (u) => u.totalSaved >= 10,
  },
  {
    id: 'saved_100',
    title: 'Diamond Hands!',
    message: 'You\'ve saved $100 by not snoozing. Incredible!',
    check: (u) => u.totalSaved >= 100,
  },
];

async function getUnlockedIds(): Promise<Set<string>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
}

async function saveUnlockedIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

/**
 * Check if the user has newly unlocked any achievements and fire
 * a local push notification for each new one.
 *
 * Call this after wake-up events and dashboard data refreshes.
 */
export async function checkAndNotifyAchievements(currentUser: UserData): Promise<void> {
  const unlocked = await getUnlockedIds();
  let changed = false;

  for (const milestone of MILESTONES) {
    if (unlocked.has(milestone.id)) continue; // already notified
    if (!milestone.check(currentUser)) continue; // not yet achieved

    // Newly achieved — fire notification
    unlocked.add(milestone.id);
    changed = true;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: milestone.title,
          body: milestone.message,
          sound: true,
          data: { type: 'achievement', achievementId: milestone.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          repeats: false,
        },
      });
    } catch (err) {
      console.warn('Failed to send achievement notification:', err);
    }
  }

  if (changed) {
    await saveUnlockedIds(unlocked);
  }
}

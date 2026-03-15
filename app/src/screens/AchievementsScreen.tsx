import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';

interface Achievement {
  id: string;
  iconName: string;
  iconColor: string;
  title: string;
  description: string;
  check: (user: any) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_alarm', iconName: 'alarm-outline', iconColor: '#6C3CE1', title: 'First Alarm', description: 'Created your first alarm', check: () => true },
  { id: 'no_snooze_day', iconName: 'sunny-outline', iconColor: '#FFD93D', title: 'Clean Morning', description: 'Woke up without snoozing', check: (u) => u.currentStreak >= 1 },
  { id: 'streak_7', iconName: 'flame', iconColor: '#FF6B35', title: 'Week Warrior', description: '7-day no-snooze streak', check: (u) => u.longestStreak >= 7 },
  { id: 'streak_30', iconName: 'fitness-outline', iconColor: '#E74C3C', title: 'Monthly Master', description: '30-day no-snooze streak', check: (u) => u.longestStreak >= 30 },
  { id: 'streak_100', iconName: 'trophy-outline', iconColor: '#F39C12', title: 'Century Club', description: '100-day no-snooze streak', check: (u) => u.longestStreak >= 100 },
  { id: 'streak_365', iconName: 'ribbon-outline', iconColor: '#FFD700', title: 'Year of Discipline', description: '365-day no-snooze streak', check: (u) => u.longestStreak >= 365 },
  { id: 'saved_10', iconName: 'wallet-outline', iconColor: '#00E676', title: 'Smart Saver', description: 'Saved $10 by not snoozing', check: (u) => u.totalSaved >= 10 },
  { id: 'saved_100', iconName: 'diamond-outline', iconColor: '#00BCD4', title: 'Diamond Hands', description: 'Saved $100 by not snoozing', check: (u) => u.totalSaved >= 100 },
  { id: 'donated_10', iconName: 'heart-outline', iconColor: '#E91E63', title: 'Generous Snoozer', description: 'Donated $10 to charity via snoozing', check: () => false },
  { id: 'donated_100', iconName: 'earth-outline', iconColor: '#27AE60', title: 'Charity Champion', description: 'Donated $100 to charity', check: () => false },
  { id: 'battle_win', iconName: 'flash-outline', iconColor: '#FF6B6B', title: 'Battle Victor', description: 'Won your first Snooze Battle', check: () => false },
  { id: 'battle_champion', iconName: 'shield-checkmark-outline', iconColor: '#3498DB', title: 'Battle Champion', description: 'Won 5 consecutive battles', check: () => false },
];

const LEVELS = [
  { name: 'Beginner', minXp: 0, iconName: 'leaf-outline', iconColor: '#27AE60' },
  { name: 'Early Bird', minXp: 100, iconName: 'sunny-outline', iconColor: '#FFD93D' },
  { name: 'Sunrise Warrior', minXp: 500, iconName: 'flash-outline', iconColor: '#FF6B35' },
  { name: 'Alarm Slayer', minXp: 2000, iconName: 'flame', iconColor: '#E74C3C' },
  { name: 'Morning Legend', minXp: 10000, iconName: 'ribbon-outline', iconColor: '#FFD700' },
];

function calculateXP(user: any): number {
  return (user.longestStreak || 0) * 10 + (user.currentStreak || 0) * 5;
}

function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(xp: number) {
  for (const level of LEVELS) {
    if (xp < level.minXp) return level;
  }
  return null;
}

export function AchievementsScreen() {
  const user = useAuthStore((s) => s.user);
  const xp = calculateXP(user);
  const currentLevel = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const progress = nextLevel
    ? (xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)
    : 1;

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(user)).length;

  return (
    <View style={styles.container}>
      {/* Level Card */}
      <View style={styles.levelCard}>
        <Icon name={currentLevel.iconName} size={48} color={currentLevel.iconColor} />
        <Text style={styles.levelName}>{currentLevel.name}</Text>
        <Text style={styles.xpText}>{xp} XP</Text>
        {nextLevel && (
          <>
            <View style={styles.xpBar}>
              <View style={[styles.xpBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.nextLevel}>
              {nextLevel.minXp - xp} XP to {nextLevel.name}
            </Text>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>
        Achievements ({unlockedCount}/{ACHIEVEMENTS.length})
      </Text>

      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => {
          const unlocked = item.check(user);
          return (
            <View style={[styles.badgeCard, !unlocked && styles.badgeLocked]}>
              <View style={[styles.badgeIconWrap, { backgroundColor: (unlocked ? item.iconColor : colors.textMuted) + '20' }]}>
                <Icon
                  name={item.iconName}
                  size={28}
                  color={unlocked ? item.iconColor : colors.textMuted}
                />
              </View>
              <Text style={[styles.badgeTitle, !unlocked && styles.badgeTitleLocked]}>
                {item.title}
              </Text>
              <Text style={styles.badgeDesc}>{item.description}</Text>
              {unlocked && (
                <View style={styles.unlockedRow}>
                  <Icon name="checkmark-circle" size={14} color={colors.accent} />
                  <Text style={styles.unlockedBadge}>Unlocked</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  levelCard: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    gap: spacing.xs,
  },
  levelName: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  xpText: { fontSize: fontSize.md, color: colors.primaryLight, fontWeight: '600' },
  xpBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  xpBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  nextLevel: { fontSize: fontSize.xs, color: colors.textSecondary },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  grid: { gap: spacing.sm, paddingBottom: 40 },
  gridRow: { gap: spacing.sm },
  badgeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  badgeLocked: { opacity: 0.4 },
  badgeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, textAlign: 'center' },
  badgeTitleLocked: { color: colors.textMuted },
  badgeDesc: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  unlockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  unlockedBadge: {
    fontSize: fontSize.xs,
    color: colors.accent,
    fontWeight: '700',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { statsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { checkAndNotifyAchievements } from '../services/achievements';

export function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await statsApi.dashboard();
      setStats(data);
      // Update auth store with fresh data from server
      if (data.user) {
        updateUser({
          walletBalance: Number(data.user.walletBalance),
          totalSnoozed: Number(data.user.totalSnoozed),
          totalSaved: Number(data.user.totalSaved),
          currentStreak: data.user.currentStreak,
          longestStreak: data.user.longestStreak,
        });
        // Check for newly unlocked achievements
        checkAndNotifyAchievements({
          currentStreak: data.user.currentStreak,
          longestStreak: data.user.longestStreak,
          totalSaved: Number(data.user.totalSaved),
        });
      }
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // Use fresh server data, fallback to auth store
  const currentStreak = stats?.user?.currentStreak ?? user?.currentStreak ?? 0;
  const longestStreak = stats?.user?.longestStreak ?? user?.longestStreak ?? 0;
  const totalSnoozed = Number(stats?.user?.totalSnoozed ?? user?.totalSnoozed ?? 0);
  const totalSaved = Number(stats?.user?.totalSaved ?? user?.totalSaved ?? 0);
  const walletBalance = Number(stats?.user?.walletBalance ?? user?.walletBalance ?? 0);
  const hasStreak = currentStreak > 0;

  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="rgba(255,255,255,0.5)" />
        }
      >
        {/* Streak */}
        <GlassCard
          variant={hasStreak ? 'purple' : 'default'}
          style={[styles.streakCard, hasStreak && styles.streakCardActive]}
        >
          <View style={styles.streakIconWrap}>
            <Icon
              name={hasStreak ? 'flame' : 'moon-outline'}
              size={48}
              color={hasStreak ? '#FF6B35' : colors.textMuted}
            />
          </View>
          <Text style={styles.streakCount}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          <Text style={styles.longestStreak}>Best: {longestStreak} days</Text>
        </GlassCard>

        {/* Today Summary */}
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Icon name="notifications-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.statValue}>{stats?.today?.snoozeCount || 0}</Text>
            <Text style={styles.statLabel}>Snoozes</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Icon name="trending-down-outline" size={20} color={colors.danger} />
            <Text style={[styles.statValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
              ${(stats?.today?.totalPenalty || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Spent</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Icon name="trending-up-outline" size={20} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.accent }]} numberOfLines={1} adjustsFontSizeToFit>
              ${(stats?.today?.moneySaved || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Saved</Text>
          </GlassCard>
        </View>

        {/* Wallet Overview */}
        <Text style={styles.sectionTitle}>Wallet</Text>
        <GlassCard style={styles.walletCard}>
          <View style={styles.walletRow}>
            <View style={styles.walletRowLeft}>
              <Icon name="wallet-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.walletLabel}>Balance</Text>
            </View>
            <Text style={styles.walletValue}>${walletBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.walletRow}>
            <View style={styles.walletRowLeft}>
              <Icon name="arrow-down-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.walletLabel}>Total Spent</Text>
            </View>
            <Text style={[styles.walletValue, { color: colors.danger }]}>
              ${totalSnoozed.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.walletRow}>
            <View style={styles.walletRowLeft}>
              <Icon name="arrow-up-circle-outline" size={18} color={colors.accent} />
              <Text style={styles.walletLabel}>Total Saved</Text>
            </View>
            <Text style={[styles.walletValue, { color: colors.accent }]}>
              ${totalSaved.toFixed(2)}
            </Text>
          </View>
        </GlassCard>

      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 40, paddingTop: spacing.sm },
  streakCard: {
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  streakCardActive: { borderColor: 'rgba(255,107,53,0.20)' },
  streakIconWrap: { marginBottom: spacing.xs },
  streakCount: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
    letterSpacing: -2,
  },
  streakLabel: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
  },
  longestStreak: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.35)',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.40)',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center' as const,
    gap: 6,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  walletCard: {
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  walletRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  walletRowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  divider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)' },
  walletLabel: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  walletValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
});

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
            <Text style={[styles.statValue, { color: colors.danger }]}>
              ${(stats?.today?.totalPenalty || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Spent</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Icon name="trending-up-outline" size={20} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.accent }]}>
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
  content: { padding: spacing.md, paddingBottom: 40, paddingTop: 100 },
  streakCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  streakCardActive: { borderColor: '#FF6B3530' },
  streakIconWrap: { marginBottom: spacing.xs },
  streakCount: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  streakLabel: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  longestStreak: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center' as const,
    gap: 6,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  walletCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  walletRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  walletRowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  divider: { height: 1, backgroundColor: colors.border },
  walletLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  walletValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
});

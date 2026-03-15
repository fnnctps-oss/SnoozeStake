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

export function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await statsApi.dashboard();
      setStats(data);
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

  const hasStreak = (user?.currentStreak || 0) > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Streak */}
      <View style={[styles.streakCard, hasStreak && styles.streakCardActive]}>
        <View style={styles.streakIconWrap}>
          <Icon
            name={hasStreak ? 'flame' : 'moon-outline'}
            size={48}
            color={hasStreak ? '#FF6B35' : colors.textMuted}
          />
        </View>
        <Text style={styles.streakCount}>{user?.currentStreak || 0}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
        <Text style={styles.longestStreak}>
          Best: {user?.longestStreak || 0} days
        </Text>
      </View>

      {/* Today Summary */}
      <Text style={styles.sectionTitle}>Today</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="notifications-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.statValue}>{stats?.today?.snoozeCount || 0}</Text>
          <Text style={styles.statLabel}>Snoozes</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="trending-down-outline" size={20} color={colors.danger} />
          <Text style={[styles.statValue, { color: colors.danger }]}>
            ${(stats?.today?.totalPenalty || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="trending-up-outline" size={20} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.accent }]}>
            ${(stats?.today?.moneySaved || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Wallet Overview */}
      <Text style={styles.sectionTitle}>Wallet</Text>
      <View style={styles.walletCard}>
        <View style={styles.walletRow}>
          <View style={styles.walletRowLeft}>
            <Icon name="wallet-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.walletLabel}>Balance</Text>
          </View>
          <Text style={styles.walletValue}>
            ${Number(user?.walletBalance || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.walletRow}>
          <View style={styles.walletRowLeft}>
            <Icon name="arrow-down-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.walletLabel}>Total Snoozed</Text>
          </View>
          <Text style={[styles.walletValue, { color: colors.danger }]}>
            ${Number(user?.totalSnoozed || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.walletRow}>
          <View style={styles.walletRowLeft}>
            <Icon name="arrow-up-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.walletLabel}>Total Saved</Text>
          </View>
          <Text style={[styles.walletValue, { color: colors.accent }]}>
            ${Number(user?.totalSaved || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Weekly Chart (text-based) */}
      {stats?.weekly && Object.keys(stats.weekly).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weeklyCard}>
            {Object.entries(stats.weekly).map(([date, data]: [string, any]) => (
              <View key={date} style={styles.weeklyRow}>
                <Text style={styles.weeklyDate}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <View style={styles.weeklyBar}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { width: `${Math.min(data.snoozeCount * 20, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.weeklyAmount}>${data.penalty.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  streakCardActive: {
    backgroundColor: '#FF6B3510',
    borderWidth: 1,
    borderColor: '#FF6B3530',
  },
  streakIconWrap: {
    marginBottom: spacing.xs,
  },
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
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  walletLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  walletValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  weeklyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  weeklyDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    width: 40,
  },
  weeklyBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  weeklyBarFill: {
    height: '100%',
    backgroundColor: colors.danger,
    borderRadius: 4,
  },
  weeklyAmount: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
});

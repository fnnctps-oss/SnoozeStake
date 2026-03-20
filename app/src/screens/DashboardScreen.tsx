import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { statsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';
import { NeonBorderCard } from '../components/NeonBorderCard';
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.screenTitle}>Stats</Text>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryLight}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Streak Section */}
          <View style={styles.streakSection}>
            <View style={styles.fireEmojiContainer}>
              <Text style={styles.fireEmoji}>🔥</Text>
            </View>

            <NeonBorderCard colors={['#FF6EC7', '#8B5CF6', '#06B6D4']}>
              <View style={styles.streakContent}>
                <Text style={styles.streakCount}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
                <Text style={styles.longestStreak}>Best: {longestStreak} days</Text>
              </View>
            </NeonBorderCard>
          </View>

          {/* Today Summary */}
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardAmber]}>
              <View style={[styles.iconBubble, { backgroundColor: 'rgba(255, 179, 0, 0.2)' }]}>
                <Icon name="notifications-outline" size={22} color="#FFB300" />
              </View>
              <Text style={styles.statValue}>{stats?.today?.snoozeCount || 0}</Text>
              <Text style={styles.statLabel}>Snoozes</Text>
            </View>

            <View style={[styles.statCard, styles.statCardRed]}>
              <View style={[styles.iconBubble, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                <Icon name="trending-down-outline" size={22} color={colors.danger} />
              </View>
              <Text style={[styles.statValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                ${(stats?.today?.totalPenalty || 0).toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>

            <View style={[styles.statCard, styles.statCardGreen]}>
              <View style={[styles.iconBubble, { backgroundColor: 'rgba(0, 230, 118, 0.2)' }]}>
                <Icon name="trending-up-outline" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.statValue, { color: colors.accent }]} numberOfLines={1} adjustsFontSizeToFit>
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
                <View style={[styles.iconBubble, { backgroundColor: 'rgba(108, 60, 225, 0.2)' }]}>
                  <Icon name="wallet-outline" size={20} color={colors.primaryLight} />
                </View>
                <Text style={styles.walletLabel}>Balance</Text>
              </View>
              <Text style={styles.walletValue}>${walletBalance.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.walletRow}>
              <View style={styles.walletRowLeft}>
                <View style={[styles.iconBubble, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                  <Icon name="arrow-down-circle-outline" size={20} color={colors.danger} />
                </View>
                <Text style={styles.walletLabel}>Total Spent</Text>
              </View>
              <Text style={[styles.walletValue, { color: colors.danger }]}>
                ${totalSnoozed.toFixed(2)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.walletRow}>
              <View style={styles.walletRowLeft}>
                <View style={[styles.iconBubble, { backgroundColor: 'rgba(0, 230, 118, 0.2)' }]}>
                  <Icon name="arrow-up-circle-outline" size={20} color={colors.accent} />
                </View>
                <Text style={styles.walletLabel}>Total Saved</Text>
              </View>
              <Text style={[styles.walletValue, { color: colors.accent }]}>
                ${totalSaved.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },

  /* Streak */
  streakSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  fireEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(108, 60, 225, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108, 60, 225, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -28,
    zIndex: 1,
  },
  fireEmoji: {
    fontSize: 28,
  },
  streakContent: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  streakCount: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 72,
  },
  streakLabel: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  longestStreak: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  /* Section */
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },

  /* Stat Cards */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 60, 225, 0.15)',
  },
  statCardAmber: {
    backgroundColor: 'rgba(255, 179, 0, 0.06)',
  },
  statCardRed: {
    backgroundColor: 'rgba(255, 107, 107, 0.06)',
  },
  statCardGreen: {
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Wallet */
  walletCard: {
    backgroundColor: 'rgba(108, 60, 225, 0.08)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(108, 60, 225, 0.2)',
    padding: spacing.lg,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  walletRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(108, 60, 225, 0.12)',
    marginVertical: 4,
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
});

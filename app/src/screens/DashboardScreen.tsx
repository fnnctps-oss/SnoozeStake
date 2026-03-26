import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { statsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { checkAndNotifyAchievements } from '../services/achievements';

// ── Rainbow-border streak card ─────────────────────────────
function StreakCard({ streak, best, hasStreak }: { streak: number; best: number; hasStreak: boolean }) {
  return (
    // Gradient wrapper acts as the neon border
    <LinearGradient
      colors={hasStreak
        ? ['#A855F7', '#6366F1', '#3B82F6', '#06B6D4']
        : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.streakBorderWrap}
    >
      <View style={styles.streakInner}>
        <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,5,20,0.55)' }]} />
        {/* Flame icon floating above */}
        <View style={styles.streakIconWrap}>
          <BlurView intensity={16} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 28 }]} />
          <Icon
            name={hasStreak ? 'flame' : 'moon-outline'}
            size={30}
            color={hasStreak ? '#FF6B35' : colors.textMuted}
          />
        </View>
        <Text style={styles.streakCount}>{streak}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
        <Text style={styles.longestStreak}>Best: {best} days</Text>
      </View>
    </LinearGradient>
  );
}

// ── Colored-glow stat card ─────────────────────────────────
function StatCard({
  icon, value, label, glowColor, iconColor,
}: {
  icon: string; value: string; label: string; glowColor: string; iconColor: string;
}) {
  return (
    <View style={[styles.statCardOuter, { borderColor: glowColor, shadowColor: glowColor }]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(12,6,22,0.55)' }]} />
      {/* Colored top glow */}
      <View style={[styles.statCardGlow, { backgroundColor: glowColor }]} />
      {/* Icon bubble */}
      <View style={[styles.statIconBubble, { backgroundColor: `${glowColor}22` }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: iconColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await statsApi.dashboard();
      setStats(data);
      if (data.user) {
        updateUser({
          walletBalance: Number(data.user.walletBalance),
          totalSnoozed: Number(data.user.totalSnoozed),
          totalSaved: Number(data.user.totalSaved),
          currentStreak: data.user.currentStreak,
          longestStreak: data.user.longestStreak,
        });
        checkAndNotifyAchievements({
          currentStreak: data.user.currentStreak,
          longestStreak: data.user.longestStreak,
          totalSaved: Number(data.user.totalSaved),
        });
      }
    } catch {}
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />
        }
      >
        {/* ── Rainbow Streak Card ── */}
        <StreakCard streak={currentStreak} best={longestStreak} hasStreak={hasStreak} />

        {/* ── Today Stats ── */}
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="notifications-outline"
            value={String(stats?.today?.snoozeCount || 0)}
            label="Snoozes"
            glowColor="rgba(99,102,241,0.60)"
            iconColor="#818CF8"
          />
          <StatCard
            icon="arrow-down-circle-outline"
            value={`$${(stats?.today?.totalPenalty || 0).toFixed(2)}`}
            label="Spent"
            glowColor="rgba(239,68,68,0.60)"
            iconColor="#F87171"
          />
          <StatCard
            icon="arrow-up-circle-outline"
            value={`$${(stats?.today?.moneySaved || 0).toFixed(2)}`}
            label="Saved"
            glowColor="rgba(16,185,129,0.60)"
            iconColor="#34D399"
          />
        </View>

        {/* ── Wallet ── */}
        <Text style={styles.sectionTitle}>Wallet</Text>
        <GlassCard style={styles.walletCard}>
          <View style={styles.walletRow}>
            <View style={styles.walletRowLeft}>
              <View style={[styles.walletIconBubble, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                <Icon name="wallet-outline" size={16} color="#818CF8" />
              </View>
              <Text style={styles.walletLabel}>Balance</Text>
            </View>
            <Text style={styles.walletValue}>${walletBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.walletRow}>
            <View style={styles.walletRowLeft}>
              <View style={[styles.walletIconBubble, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                <Icon name="arrow-down-circle-outline" size={16} color="#F87171" />
              </View>
              <Text style={styles.walletLabel}>Total Spent</Text>
            </View>
            <Text style={[styles.walletValue, { color: '#F87171' }]}>
              ${totalSnoozed.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.walletRow}>
            <View style={styles.walletRowLeft}>
              <View style={[styles.walletIconBubble, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Icon name="arrow-up-circle-outline" size={16} color="#34D399" />
              </View>
              <Text style={styles.walletLabel}>Total Saved</Text>
            </View>
            <Text style={[styles.walletValue, { color: '#34D399' }]}>
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
  content: { padding: spacing.md, paddingBottom: 50, paddingTop: spacing.sm },

  // ── Streak card ──
  streakBorderWrap: {
    borderRadius: 26,
    padding: 2,         // This 2px becomes the gradient border
    marginBottom: spacing.lg,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  streakInner: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  streakIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  streakCount: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -2,
    lineHeight: 76,
  },
  streakLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  longestStreak: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.40)',
    marginTop: 4,
  },

  // ── Stat cards ──
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.38)',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCardOuter: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
  },
  statCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.8,
  },
  statIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },

  // ── Wallet card ──
  walletCard: {
    borderRadius: 20,
    padding: spacing.lg,
    borderColor: 'rgba(139,92,246,0.20)',
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  walletRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  walletIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.07)' },
  walletLabel: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  walletValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { battleApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';

const STATUS_META: Record<string, { color: string; icon: string; label: string }> = {
  PENDING: { color: colors.warning, icon: 'hourglass-outline', label: 'Waiting for response' },
  ACTIVE: { color: colors.accent, icon: 'flash', label: 'Battle in progress' },
  COMPLETED: { color: colors.primary, icon: 'trophy', label: 'Battle ended' },
  CANCELLED: { color: colors.textMuted, icon: 'close-circle-outline', label: 'Cancelled' },
};

export function BattleDetailScreen({ route }: any) {
  const { battleId } = route.params;
  const userId = useAuthStore((s) => s.user?.id);
  const [battle, setBattle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { battle: b } = await battleApi.get(battleId);
        setBattle(b);
      } catch {}
      setLoading(false);
    };
    load();
  }, [battleId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!battle) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Battle not found</Text>
      </View>
    );
  }

  const isChallenger = battle.challengerId === userId;
  const opponent = isChallenger ? battle.opponent : battle.challenger;
  const mySnoozes = isChallenger ? battle.challengerSnoozeCount : battle.opponentSnoozeCount;
  const theirSnoozes = isChallenger ? battle.opponentSnoozeCount : battle.challengerSnoozeCount;
  const meta = STATUS_META[battle.status] || STATUS_META.PENDING;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: meta.color + '20', borderColor: meta.color + '40' }]}>
        <Icon name={meta.icon} size={24} color={meta.color} />
        <View>
          <Text style={[styles.statusLabel, { color: meta.color }]}>{battle.status}</Text>
          <Text style={styles.statusSub}>{meta.label}</Text>
        </View>
      </View>

      {/* Bet Info */}
      <View style={styles.betCard}>
        <Text style={styles.betLabel}>Bet Amount</Text>
        <Text style={styles.betValue}>${Number(battle.betAmount).toFixed(2)}</Text>
        <Text style={styles.betDesc}>
          Loser pays winner this amount at the end of the week
        </Text>
      </View>

      {/* Score Board */}
      <View style={styles.scoreCard}>
        <View style={styles.scorePlayer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>You</Text>
          </View>
          <Text style={[styles.scoreValue, mySnoozes <= theirSnoozes ? styles.winning : styles.losing]}>
            {mySnoozes}
          </Text>
          <Text style={styles.scoreLabel}>snoozes</Text>
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.scorePlayer}>
          <View style={[styles.avatar, { backgroundColor: colors.danger + '80' }]}>
            <Text style={styles.avatarText}>
              {opponent?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[styles.scoreValue, theirSnoozes <= mySnoozes ? styles.winning : styles.losing]}>
            {theirSnoozes}
          </Text>
          <Text style={styles.scoreLabel}>snoozes</Text>
        </View>
      </View>

      {/* Winner */}
      {battle.status === 'COMPLETED' && battle.winner && (
        <View style={styles.winnerCard}>
          <Icon name="trophy" size={32} color="#FFD700" />
          <Text style={styles.winnerText}>
            {battle.winnerId === userId ? 'You won!' : `${battle.winner.displayName} won`}
          </Text>
          <Text style={styles.winnerSub}>
            {battle.winnerId === userId
              ? `You earned $${Number(battle.betAmount).toFixed(2)}!`
              : `You lost $${Number(battle.betAmount).toFixed(2)}`}
          </Text>
        </View>
      )}

      {/* Period */}
      <View style={styles.periodCard}>
        <Icon name="calendar-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.periodText}>
          {new Date(battle.weekStartDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' — '}
          {new Date(battle.weekEndDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <Text style={styles.ruleText}>
        The player with fewer snoozes by the end of the week wins the bet.
        In case of a tie, both players keep their money.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textMuted, fontSize: fontSize.md },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  statusLabel: { fontSize: fontSize.md, fontWeight: '800', textTransform: 'uppercase' },
  statusSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  betCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  betLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  betValue: { fontSize: 36, fontWeight: '800', color: colors.primaryLight, marginVertical: spacing.xs },
  betDesc: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scorePlayer: { alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  scoreValue: { fontSize: fontSize.xxl, fontWeight: '800' },
  scoreLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  winning: { color: colors.accent },
  losing: { color: colors.danger },
  vsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textMuted },
  winnerCard: {
    backgroundColor: '#FFD70015',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD70040',
    gap: spacing.xs,
  },
  winnerText: { fontSize: fontSize.xl, fontWeight: '800', color: '#FFD700' },
  winnerSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  periodText: { fontSize: fontSize.sm, color: colors.textSecondary },
  ruleText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
});

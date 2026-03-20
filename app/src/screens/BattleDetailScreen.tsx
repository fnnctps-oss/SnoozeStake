import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
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

export function BattleDetailScreen({ route, navigation }: any) {
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Battle Detail</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { borderColor: meta.color + '40' }]}>
          <View style={[styles.statusIconBubble, { backgroundColor: meta.color + '20' }]}>
            <Icon name={meta.icon} size={24} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
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
            <View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
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
            <View style={[styles.avatar, { backgroundColor: colors.danger + '30' }]}>
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
          <View style={styles.periodIconBubble}>
            <Icon name="calendar-outline" size={18} color={colors.primaryLight} />
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textMuted, fontSize: fontSize.md },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: colors.glass,
  },
  statusIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: { fontSize: fontSize.md, fontWeight: '800', textTransform: 'uppercase' },
  statusSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  betCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    alignItems: 'center',
  },
  betLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  betValue: { fontSize: 40, fontWeight: '800', color: colors.primaryLight, marginVertical: spacing.xs },
  betDesc: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scorePlayer: { alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textMuted },
  winnerCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    gap: spacing.xs,
  },
  winnerText: { fontSize: fontSize.xl, fontWeight: '800', color: '#FFD700' },
  winnerSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  periodIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108, 60, 225, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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

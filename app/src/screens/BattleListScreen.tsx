import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { battleApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';

const STATUS_COLORS: Record<string, string> = {
  PENDING: colors.warning,
  ACTIVE: colors.accent,
  COMPLETED: colors.primary,
  CANCELLED: colors.textMuted,
};

export function BattleListScreen({ navigation }: any) {
  const userId = useAuthStore((s) => s.user?.id);
  const [battles, setBattles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { battles: data } = await battleApi.list();
      setBattles(data);
    } catch (err) {
      console.warn('Failed to load battles:', err);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (id: string) => {
    try {
      await battleApi.accept(id);
      load();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={battles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const isChallenger = item.challengerId === userId;
          const opponent = isChallenger ? item.opponent : item.challenger;
          const mySnoozes = isChallenger ? item.challengerSnoozeCount : item.opponentSnoozeCount;
          const theirSnoozes = isChallenger ? item.opponentSnoozeCount : item.challengerSnoozeCount;
          const isPending = item.status === 'PENDING' && item.opponentId === userId;

          return (
            <TouchableOpacity
              style={styles.battleCard}
              onPress={() => navigation.navigate('BattleDetail', { battleId: item.id })}
            >
              <View style={styles.battleHeader}>
                <Text style={[styles.statusBadge, { color: STATUS_COLORS[item.status] }]}>
                  {item.status}
                </Text>
                <Text style={styles.betAmount}>${Number(item.betAmount).toFixed(2)} bet</Text>
              </View>

              <Text style={styles.vsText}>
                You vs {opponent?.displayName || 'Unknown'}
              </Text>

              {item.status === 'ACTIVE' && (
                <View style={styles.scoreRow}>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{mySnoozes}</Text>
                    <Text style={styles.scoreLabel}>Your Snoozes</Text>
                  </View>
                  <Text style={styles.vsIcon}>vs</Text>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{theirSnoozes}</Text>
                    <Text style={styles.scoreLabel}>Their Snoozes</Text>
                  </View>
                </View>
              )}

              {item.status === 'COMPLETED' && item.winner && (
                <Text style={styles.winnerText}>
                  {item.winnerId === userId ? 'You won!' : `${item.winner.displayName} won`}
                </Text>
              )}

              {isPending && (
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(item.id)}
                  >
                    <Text style={styles.acceptBtnText}>Accept Challenge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={async () => {
                      await battleApi.decline(item.id);
                      load();
                    }}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.dateRange}>
                {new Date(item.weekStartDate).toLocaleDateString()} — {new Date(item.weekEndDate).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="flash-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No battles yet</Text>
            <Text style={styles.emptySubtext}>Challenge a friend to a Snooze Battle!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateBattle')}
      >
        <Icon name="flash" size={28} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  battleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusBadge: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  betAmount: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  vsText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginVertical: spacing.sm },
  scoreItem: { alignItems: 'center' },
  scoreValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  scoreLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  vsIcon: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: '700' },
  winnerText: { fontSize: fontSize.md, fontWeight: '700', color: colors.accent, marginTop: spacing.sm },
  pendingActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  acceptBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
  acceptBtnText: { color: colors.background, fontWeight: '700' },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: colors.danger, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
  declineBtnText: { color: colors.danger, fontWeight: '600' },
  dateRange: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  empty: { alignItems: 'center', paddingTop: 100, gap: spacing.sm },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textSecondary },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

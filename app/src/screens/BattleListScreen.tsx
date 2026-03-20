import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  SafeAreaView,
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

const STATUS_ICONS: Record<string, string> = {
  PENDING: 'hourglass-outline',
  ACTIVE: 'flash',
  COMPLETED: 'trophy',
  CANCELLED: 'close-circle-outline',
};

export function BattleListScreen({ navigation }: any) {
  const userId = useAuthStore((s) => s.user?.id);
  const [battles, setBattles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { battles: data } = await battleApi.list();
      setBattles(data);
    } catch {}
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Battles</Text>
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
            const statusColor = STATUS_COLORS[item.status] || colors.textMuted;
            const statusIcon = STATUS_ICONS[item.status] || 'help-outline';

            return (
              <TouchableOpacity
                style={styles.battleCard}
                onPress={() => navigation.navigate('BattleDetail', { battleId: item.id })}
                activeOpacity={0.7}
              >
                <View style={styles.battleHeader}>
                  <View style={[styles.statusPill, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
                    <Icon name={statusIcon} size={12} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {item.status}
                    </Text>
                  </View>
                  <View style={styles.betBadge}>
                    <Text style={styles.betAmount}>${Number(item.betAmount).toFixed(2)}</Text>
                  </View>
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
                    <View style={styles.vsDivider}>
                      <Text style={styles.vsIcon}>vs</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreValue}>{theirSnoozes}</Text>
                      <Text style={styles.scoreLabel}>Their Snoozes</Text>
                    </View>
                  </View>
                )}

                {item.status === 'COMPLETED' && item.winner && (
                  <View style={styles.winnerRow}>
                    <Icon name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.winnerText}>
                      {item.winnerId === userId ? 'You won!' : `${item.winner.displayName} won`}
                    </Text>
                  </View>
                )}

                {isPending && (
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(item.id)}
                    >
                      <Icon name="checkmark" size={16} color={colors.background} />
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

                <View style={styles.dateRow}>
                  <Icon name="calendar-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.dateRange}>
                    {new Date(item.weekStartDate).toLocaleDateString()} — {new Date(item.weekEndDate).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBubble}>
                <Icon name="flash-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>No battles yet</Text>
              <Text style={styles.emptySubtext}>Challenge a friend to a Snooze Battle!</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateBattle')}
          activeOpacity={0.8}
        >
          <Icon name="flash" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  screenTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  battleCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  betBadge: {
    backgroundColor: 'rgba(108, 60, 225, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  betAmount: { fontSize: fontSize.sm, color: colors.primaryLight, fontWeight: '700' },
  vsText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.lg,
  },
  scoreItem: { alignItems: 'center' },
  scoreValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  scoreLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  vsDivider: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsIcon: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '800' },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  winnerText: { fontSize: fontSize.md, fontWeight: '700', color: '#FFD700' },
  pendingActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  acceptBtnText: { color: colors.background, fontWeight: '700', fontSize: fontSize.sm },
  declineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.danger + '60',
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
  },
  declineBtnText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.sm },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  dateRange: { fontSize: fontSize.xs, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 100, gap: spacing.sm },
  emptyIconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 60, 225, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
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
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { friendApi, battleApi } from '../services/api';
import { Icon } from '../components/Icon';

export function CreateBattleScreen({ navigation }: any) {
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [betAmount, setBetAmount] = useState('5');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const { friends: f } = await friendApi.list();
        setFriends(f);
      } catch {}
    };
    loadFriends();
  }, []);

  const handleCreate = async () => {
    if (!selectedFriend) {
      Alert.alert('Select a friend', 'Choose a friend to challenge');
      return;
    }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 1 || amount > 50) {
      Alert.alert('Invalid bet', 'Bet must be between $1 and $50');
      return;
    }
    setLoading(true);
    try {
      await battleApi.create(selectedFriend.id, amount);
      Alert.alert('Challenge Sent!', `You challenged ${selectedFriend.displayName} for $${amount.toFixed(2)}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create battle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Create Battle</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Bet Amount Card */}
        <View style={styles.betCard}>
          <Text style={styles.label}>Bet Amount</Text>
          <Text style={styles.labelSub}>$1 — $50</Text>
          <View style={styles.betRow}>
            <Text style={styles.dollar}>$</Text>
            <TextInput
              style={styles.betInput}
              value={betAmount}
              onChangeText={setBetAmount}
              keyboardType="decimal-pad"
              placeholder="5.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.presetRow}>
            {[1, 5, 10, 25].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.presetChip, betAmount === String(v) && styles.presetChipActive]}
                onPress={() => setBetAmount(String(v))}
              >
                <Text style={[styles.presetText, betAmount === String(v) && styles.presetTextActive]}>
                  ${v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Opponent</Text>

        {friends.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconBubble}>
              <Icon name="people-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>Add friends first to challenge them!</Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.friendList}
            renderItem={({ item }) => {
              const isSelected = selectedFriend?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.friendCard, isSelected && styles.friendCardSelected]}
                  onPress={() => setSelectedFriend(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.friendAvatar, isSelected && styles.friendAvatarSelected]}>
                    <Text style={styles.avatarText}>
                      {item.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.displayName}</Text>
                    <Text style={styles.friendStreak}>
                      {item.currentStreak > 0 ? `${item.currentStreak} day streak` : 'No streak'}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon name="checkmark-circle" size={24} color={colors.accent} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        <TouchableOpacity
          style={[styles.createButton, (!selectedFriend || loading) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!selectedFriend || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Icon name="flash" size={20} color={colors.text} />
              <Text style={styles.createButtonText}>
                Send Challenge{selectedFriend ? ` to ${selectedFriend.displayName}` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  betCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  labelSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  betRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  dollar: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primaryLight },
  betInput: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  presetChip: {
    flex: 1,
    backgroundColor: 'rgba(108, 60, 225, 0.10)',
    borderRadius: 20,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  presetText: { color: colors.textSecondary, fontWeight: '700', fontSize: fontSize.sm },
  presetTextActive: { color: colors.text },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  friendList: { gap: spacing.sm, paddingBottom: 100 },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  friendCardSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 60, 225, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarSelected: {
    backgroundColor: 'rgba(0, 230, 118, 0.20)',
  },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  friendInfo: { flex: 1 },
  friendName: { color: colors.text, fontWeight: '600', fontSize: fontSize.md },
  friendStreak: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  createButton: {
    position: 'absolute',
    bottom: 24,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonDisabled: { opacity: 0.4 },
  createButtonText: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  empty: { alignItems: 'center', paddingTop: 40, gap: spacing.sm },
  emptyIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(108, 60, 225, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textSecondary },
});

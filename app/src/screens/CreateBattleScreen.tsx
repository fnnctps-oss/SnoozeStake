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
    <View style={styles.container}>
      <Text style={styles.label}>Bet Amount ($1 – $50)</Text>
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

      <Text style={styles.label}>Select Opponent</Text>

      {friends.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="people-outline" size={48} color={colors.textMuted} />
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
              >
                <View style={styles.friendAvatar}>
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
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <>
            <Icon name="flash" size={20} color={colors.background} />
            <Text style={styles.createButtonText}>
              Send Challenge{selectedFriend ? ` to ${selectedFriend.displayName}` : ''}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  label: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  betRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
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
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  presetChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: colors.primary,
  },
  presetText: { color: colors.textSecondary, fontWeight: '600' },
  presetTextActive: { color: colors.text },
  friendList: { gap: spacing.sm, paddingBottom: 100 },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  friendCardSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.danger,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
  empty: { alignItems: 'center', paddingTop: 40, gap: spacing.sm },
  emptyText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textSecondary },
});

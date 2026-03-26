import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { friendApi } from '../services/api';

export function FriendListScreen() {
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [inviteText, setInviteText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    // Bug fix: Promise.allSettled so one failure doesn't block the other from loading
    const [friendsResult, pendingResult] = await Promise.allSettled([
      friendApi.list(),
      friendApi.pending(),
    ]);
    if (friendsResult.status === 'fulfilled') setFriends(friendsResult.value.friends ?? []);
    if (pendingResult.status === 'fulfilled') setPending(pendingResult.value.pending ?? []);
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteText.trim()) return;
    try {
      await friendApi.invite(inviteText.trim());
      Alert.alert('Sent!', 'Friend invite sent');
      setInviteText('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await friendApi.accept(id);
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
      {/* Invite */}
      <View style={styles.inviteRow}>
        <TextInput
          style={styles.inviteInput}
          value={inviteText}
          onChangeText={setInviteText}
          placeholder="Email or referral code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
          <Text style={styles.inviteButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Pending */}
      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Invites</Text>
          {pending.map((p) => (
            <View key={p.id} style={styles.pendingItem}>
              <Text style={styles.friendName}>{p.initiator.displayName}</Text>
              <View style={styles.pendingActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(p.id)}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={async () => {
                    await friendApi.decline(p.id);
                    load();
                  }}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Friends List */}
      <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
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
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No friends yet. Invite someone!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  inviteRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  inviteInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  inviteButtonText: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pendingActions: { flexDirection: 'row', gap: spacing.sm },
  acceptButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  acceptText: { color: colors.background, fontWeight: '700', fontSize: fontSize.sm },
  declineButton: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  declineText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.sm },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
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
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontSize: fontSize.sm },
});

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
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { friendApi } from '../services/api';
import { Icon } from '../components/Icon';

export function FriendListScreen() {
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [inviteText, setInviteText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [{ friends: f }, { pending: p }] = await Promise.all([
        friendApi.list(),
        friendApi.pending(),
      ]);
      setFriends(f);
      setPending(p);
    } catch {}
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Friends</Text>

        {/* Invite Card */}
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>Add a Friend</Text>
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
              <Icon name="paper-plane" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Invites</Text>
            <View style={styles.pendingCard}>
              {pending.map((p) => (
                <View key={p.id} style={styles.pendingItem}>
                  <View style={styles.pendingAvatar}>
                    <Text style={styles.pendingAvatarText}>
                      {p.initiator.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text style={styles.pendingName} numberOfLines={1}>{p.initiator.displayName}</Text>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(p.id)}
                    >
                      <Icon name="checkmark" size={16} color={colors.background} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={async () => {
                        await friendApi.decline(p.id);
                        load();
                      }}
                    >
                      <Icon name="close" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
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
          contentContainerStyle={styles.friendListContent}
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
              {item.currentStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Icon name="flame" size={14} color={colors.warning} />
                  <Text style={styles.streakBadgeText}>{item.currentStreak}</Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBubble}>
                <Icon name="people-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Invite someone above to get started!</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  screenTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inviteCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  inviteLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inviteRow: { flexDirection: 'row', gap: spacing.sm },
  inviteInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  inviteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  pendingCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  pendingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAvatarText: { color: colors.warning, fontWeight: '700', fontSize: fontSize.sm },
  pendingName: { flex: 1, color: colors.text, fontWeight: '600', fontSize: fontSize.md },
  pendingActions: { flexDirection: 'row', gap: spacing.sm },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendListContent: { gap: spacing.sm, paddingBottom: 40 },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 60, 225, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  friendInfo: { flex: 1 },
  friendName: { color: colors.text, fontWeight: '600', fontSize: fontSize.md },
  friendStreak: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.warning },
  emptyState: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
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

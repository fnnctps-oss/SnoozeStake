import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { groupApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';

export function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const userId = useAuthStore((s) => s.user?.id);
  const [group, setGroup] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await groupApi.get(groupId);
      setGroup(data.group);
      setLeaderboard(data.leaderboard || []);
      setActivity(data.recentActivity || []);
      setMyRole(data.myRole || '');
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [groupId]);

  const handleLeave = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupApi.leave(groupId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my SnoozeStake group "${group.name}"! Use invite code: ${group.inviteCode}`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Group</Text>
        <TouchableOpacity style={styles.shareIconBtn} onPress={handleShare}>
          <Icon name="share-outline" size={20} color={colors.primaryLight} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {/* Group Header */}
            <View style={styles.headerCard}>
              <View style={styles.groupIconBubble}>
                <Icon name="people" size={28} color={colors.primaryLight} />
              </View>
              <Text style={styles.groupName}>{group.name}</Text>
              <View style={styles.codeRow}>
                <Icon name="key-outline" size={14} color={colors.textMuted} />
                <Text style={styles.codeText}>{group.inviteCode}</Text>
              </View>
              <Text style={styles.memberCountText}>
                {group.members?.length || 0}/{group.maxMembers} members
              </Text>
            </View>

            {/* Weekly Leaderboard */}
            <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
            {leaderboard.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>No data this week</Text>
              </View>
            ) : (
              <View style={styles.leaderboardCard}>
                {leaderboard.map((entry: any, index: number) => {
                  const isMe = entry.userId === userId;
                  const medalColor = MEDAL_COLORS[index];
                  return (
                    <View key={entry.userId} style={[styles.leaderRow, isMe && styles.leaderRowMe]}>
                      <View style={[styles.rankBubble, medalColor ? { backgroundColor: medalColor + '20' } : {}]}>
                        <Text style={[styles.leaderRank, medalColor ? { color: medalColor } : {}]}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={[styles.leaderName, isMe && styles.leaderNameMe]} numberOfLines={1}>
                        {entry.displayName}{isMe ? ' (You)' : ''}
                      </Text>
                      <View style={styles.leaderStats}>
                        <Text style={[styles.leaderSnoozes, entry.snoozeCount === 0 && styles.leaderPerfect]}>
                          {entry.snoozeCount} snooze{entry.snoozeCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Members */}
            <Text style={styles.sectionTitle}>Members</Text>
            <View style={styles.membersCard}>
              {group.members?.map((m: any) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {m.user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {m.user?.displayName}
                      {m.role === 'ADMIN' ? ' (Admin)' : ''}
                    </Text>
                    <Text style={styles.memberStreak}>
                      {m.user?.currentStreak > 0 ? `${m.user.currentStreak} day streak` : 'No streak'}
                    </Text>
                  </View>
                  {m.role === 'ADMIN' && (
                    <View style={styles.adminBadge}>
                      <Icon name="shield-checkmark" size={14} color={colors.warning} />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Recent Activity */}
            {activity.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                  {activity.slice(0, 10).map((a: any) => (
                    <View key={a.id} style={styles.activityRow}>
                      <View style={styles.activityIconBubble}>
                        <Icon name="moon-outline" size={14} color={colors.danger} />
                      </View>
                      <Text style={styles.activityText} numberOfLines={1}>
                        <Text style={styles.activityName}>{a.user?.displayName}</Text>
                        {' snoozed $'}
                        {Number(a.penaltyAmount).toFixed(2)}
                      </Text>
                      <Text style={styles.activityTime}>{timeAgo(a.snoozedAt)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Icon name="share-outline" size={18} color={colors.text} />
                <Text style={styles.shareText}>Share Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
                <Icon name="exit-outline" size={18} color={colors.danger} />
                <Text style={styles.leaveText}>Leave</Text>
              </TouchableOpacity>
            </View>
          </>
        }
      />
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
  shareIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textMuted, fontSize: fontSize.md },
  headerCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  groupIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(108, 60, 225, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  groupName: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  codeText: {
    fontSize: fontSize.md,
    color: colors.primaryLight,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  memberCountText: { fontSize: fontSize.xs, color: colors.textSecondary },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySection: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm },
  leaderboardCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: 12,
  },
  leaderRowMe: {
    backgroundColor: 'rgba(108, 60, 225, 0.10)',
  },
  rankBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderRank: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textSecondary },
  leaderName: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  leaderNameMe: { color: colors.primaryLight },
  leaderStats: {},
  leaderSnoozes: { fontSize: fontSize.sm, color: colors.danger, fontWeight: '700' },
  leaderPerfect: { color: colors.accent },
  membersCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 60, 225, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  memberInfo: { flex: 1 },
  memberName: { color: colors.text, fontWeight: '600', fontSize: fontSize.md },
  memberStreak: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  adminBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  activityIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  activityName: { fontWeight: '700' },
  activityTime: { fontSize: fontSize.xs, color: colors.textMuted },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
  },
  shareText: { color: colors.text, fontWeight: '700' },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.40)',
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  leaveText: { color: colors.danger, fontWeight: '600' },
});

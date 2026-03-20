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
import { groupApi } from '../services/api';
import { Icon } from '../components/Icon';

export function GroupListScreen({ navigation }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { groups: data } = await groupApi.list();
      setGroups(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    try {
      await groupApi.create(groupName.trim());
      setGroupName('');
      setShowCreate(false);
      load();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    try {
      await groupApi.join(inviteCode.trim());
      setInviteCode('');
      setShowJoin(false);
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
        <Text style={styles.screenTitle}>Groups</Text>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, showCreate && styles.actionButtonActive]}
            onPress={() => { setShowCreate(!showCreate); setShowJoin(false); }}
          >
            <Icon name="add-circle-outline" size={18} color={showCreate ? colors.text : colors.primaryLight} />
            <Text style={[styles.actionText, showCreate && styles.actionTextActive]}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, showJoin && styles.actionButtonActive]}
            onPress={() => { setShowJoin(!showJoin); setShowCreate(false); }}
          >
            <Icon name="enter-outline" size={18} color={showJoin ? colors.text : colors.primaryLight} />
            <Text style={[styles.actionText, showJoin && styles.actionTextActive]}>Join</Text>
          </TouchableOpacity>
        </View>

        {showCreate && (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Create a new group</Text>
            <View style={styles.formRow}>
              <TextInput
                style={styles.formInput}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Group name"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity style={styles.formButton} onPress={handleCreate}>
                <Icon name="checkmark" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showJoin && (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Join with invite code</Text>
            <View style={styles.formRow}>
              <TextInput
                style={styles.formInput}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Invite code"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.formButton} onPress={handleJoin}>
                <Icon name="checkmark" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupIconBubble}>
                  <Icon name="people" size={20} color={colors.primaryLight} />
                </View>
                <View style={styles.groupHeaderInfo}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.memberCount}>
                    {item.members?.length || 0}/{item.maxMembers} members
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.membersRow}>
                {item.members?.slice(0, 5).map((m: any) => (
                  <View key={m.id} style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {m.user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                ))}
                {(item.members?.length || 0) > 5 && (
                  <View style={[styles.memberAvatar, styles.memberAvatarMore]}>
                    <Text style={styles.memberAvatarText}>+{item.members.length - 5}</Text>
                  </View>
                )}
              </View>
              <View style={styles.codeRow}>
                <Icon name="key-outline" size={12} color={colors.textMuted} />
                <Text style={styles.inviteCodeText}>{item.inviteCode}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBubble}>
                <Icon name="people-circle-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>No groups yet</Text>
              <Text style={styles.emptySubtext}>
                Create or join an accountability group!
              </Text>
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
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionButton: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  actionText: { color: colors.primaryLight, fontWeight: '700' },
  actionTextActive: { color: colors.text },
  formCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  formRow: { flexDirection: 'row', gap: spacing.sm },
  formInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  formButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.md, paddingBottom: 40 },
  groupCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  groupIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 60, 225, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupHeaderInfo: { flex: 1 },
  groupName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  memberCount: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  membersRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm, marginLeft: 4 },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(108, 60, 225, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  memberAvatarMore: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  memberAvatarText: { color: colors.text, fontWeight: '600', fontSize: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  inviteCodeText: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: 'monospace' },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
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
});

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
import { groupApi } from '../services/api';

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
    <View style={styles.container}>
      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowCreate(!showCreate)}>
          <Text style={styles.actionText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonAlt} onPress={() => setShowJoin(!showJoin)}>
          <Text style={styles.actionTextAlt}>Join Group</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={styles.formRow}>
          <TextInput
            style={styles.formInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Group name"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.formButton} onPress={handleCreate}>
            <Text style={styles.formButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      )}

      {showJoin && (
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
            <Text style={styles.formButtonText}>Join</Text>
          </TouchableOpacity>
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
          >
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.memberCount}>
                {item.members?.length || 0}/{item.maxMembers} members
              </Text>
            </View>
            <View style={styles.membersRow}>
              {item.members?.slice(0, 5).map((m: any) => (
                <View key={m.id} style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {m.user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.inviteCodeText}>
              Code: {item.inviteCode}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🤝</Text>
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>
              Create or join an accountability group!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionText: { color: colors.text, fontWeight: '700' },
  actionButtonAlt: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionTextAlt: { color: colors.primaryLight, fontWeight: '700' },
  formRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  formInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
  },
  formButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  formButtonText: { color: colors.background, fontWeight: '700' },
  list: { gap: spacing.md, paddingBottom: 40 },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  groupName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  memberCount: { fontSize: fontSize.sm, color: colors.textSecondary },
  membersRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: colors.text, fontWeight: '600', fontSize: fontSize.xs },
  inviteCodeText: { fontSize: fontSize.xs, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64 },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});

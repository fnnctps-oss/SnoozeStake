import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { feedApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon, IconBubble } from '../components/Icon';

export function SocialFeedScreen({ navigation }: any) {
  const userId = useAuthStore((s) => s.user?.id);
  const [feed, setFeed] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { feed: data } = await feedApi.get();
      setFeed(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <View style={styles.container}>
      {/* Quick Nav */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Battles')}>
          <Icon name="flash-outline" size={24} color={colors.danger} />
          <Text style={styles.navLabel}>Battles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Groups')}>
          <Icon name="people-circle-outline" size={24} color={colors.accent} />
          <Text style={styles.navLabel}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Friends')}>
          <Icon name="person-add-outline" size={24} color={colors.primaryLight} />
          <Text style={styles.navLabel}>Friends</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const isMe = item.userId === userId;
          const isSnooze = item.type === 'snooze';

          return (
            <View style={styles.feedItem}>
              <IconBubble
                name={isSnooze ? 'moon-outline' : 'sunny-outline'}
                size={20}
                color={isSnooze ? colors.danger : colors.accent}
                bgColor={isSnooze ? colors.danger + '20' : colors.accent + '20'}
              />
              <View style={styles.feedContent}>
                <Text style={styles.feedText}>
                  <Text style={styles.feedName}>
                    {isMe ? 'You' : item.displayName}
                  </Text>
                  {isSnooze
                    ? ` snoozed and paid $${Number(item.amount).toFixed(2)}`
                    : ` woke up and saved $${Number(item.amount).toFixed(2)}`}
                </Text>
                <Text style={styles.feedMeta}>
                  {item.alarmLabel} · {timeAgo(item.timestamp)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>
              Add friends to see their morning activity
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  feedItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  feedContent: { flex: 1 },
  feedText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  feedName: { fontWeight: '700' },
  feedMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: 0,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 100, gap: spacing.sm },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textSecondary },
});

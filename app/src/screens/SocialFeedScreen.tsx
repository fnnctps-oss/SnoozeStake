import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { feedApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon, IconBubble } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';

// ── Purple gradient nav button ──────────────────────────────
function NavButton({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navButtonWrapper} onPress={onPress} activeOpacity={0.75}>
      <LinearGradient
        colors={['rgba(108,60,225,0.28)', 'rgba(88,28,180,0.18)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navButtonGrad}
      >
        <BlurView intensity={16} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(108,60,225,0.14)' }]} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' }]} />
        <Icon name={icon} size={22} color={color} />
        <Text style={styles.navLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Feed item ──────────────────────────────────────────────
function FeedItem({ item, isMe }: { item: any; isMe: boolean }) {
  const isSnooze = item.type === 'snooze';
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
    <GlassCard style={styles.feedItem}>
      <IconBubble
        name={isSnooze ? 'moon-outline' : 'sunny-outline'}
        size={20}
        color={isSnooze ? '#F87171' : '#34D399'}
        bgColor={isSnooze ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)'}
      />
      <View style={styles.feedContent}>
        <Text style={styles.feedText}>
          <Text style={styles.feedName}>{isMe ? 'You' : item.displayName}</Text>
          {isSnooze
            ? ` snoozed and paid $${Number(item.amount).toFixed(2)}`
            : ` woke up and saved $${Number(item.amount).toFixed(2)}`}
        </Text>
        <Text style={styles.feedMeta}>{item.alarmLabel} · {timeAgo(item.timestamp)}</Text>
      </View>
    </GlassCard>
  );
}

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

  return (
    <GradientBackground>
      {/* Quick Nav */}
      <View style={styles.navRow}>
        <NavButton
          icon="flash-outline"
          label="Battles"
          color="#F87171"
          onPress={() => navigation.navigate('Battles')}
        />
        <NavButton
          icon="people-circle-outline"
          label="Groups"
          color="#34D399"
          onPress={() => navigation.navigate('Groups')}
        />
        <NavButton
          icon="person-add-outline"
          label="Friends"
          color="#818CF8"
          onPress={() => navigation.navigate('Friends')}
        />
      </View>

      <FlatList
        data={feed}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />
        }
        renderItem={({ item }) => (
          <FeedItem item={item} isMe={item.userId === userId} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            {/* Purple gradient empty state card */}
            <LinearGradient
              colors={['rgba(108,60,225,0.22)', 'rgba(88,28,180,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyCard}
            >
              <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(108,60,225,0.10)', borderRadius: 24 }]} />
              <Icon name="chatbubbles-outline" size={44} color={colors.primaryLight} />
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>Add friends to see their morning wins</Text>
            </LinearGradient>
          </View>
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40, paddingTop: spacing.md },

  // Feed item
  feedItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    borderColor: 'rgba(139,92,246,0.18)',
  },
  feedContent: { flex: 1 },
  feedText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  feedName: { fontWeight: '700' },
  feedMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },

  // Nav buttons
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: 0,
  },
  navButtonWrapper: { flex: 1 },
  navButtonGrad: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 5,
  },
  navLabel: { fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: '600' },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.md },
  emptyCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.22)',
  },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySubtext: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.40)', textAlign: 'center' },
});

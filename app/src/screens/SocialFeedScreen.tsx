import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { feedApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Icon, IconBubble } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';

const LEADERBOARD_DATA = [
  { id: '1', name: 'Sarah M.', points: 12450, rank: 1, initial: 'S', color: '#FFD700' },
  { id: '2', name: 'Jake R.', points: 11280, rank: 2, initial: 'J', color: '#C0C0C0' },
  { id: '3', name: 'Priya K.', points: 10890, rank: 3, initial: 'P', color: '#CD7F32' },
];

const CHALLENGES_DATA = [
  {
    id: '1',
    title: 'Wake Up Streak Challenge',
    avatars: [
      { initial: 'A', color: '#FF6B6B' },
      { initial: 'M', color: '#6C3CE1' },
      { initial: 'T', color: '#00E676' },
    ],
    progress: 0.65,
    subtitle: 'Team Rank: #4',
    gradient: ['#6C3CE1', '#00B4D8', '#8B5CF6'] as const,
    navigateTo: 'Battles',
  },
  {
    id: '2',
    title: 'No Snooze Week',
    avatars: [
      { initial: 'L', color: '#FF9F43' },
      { initial: 'K', color: '#3478F6' },
    ],
    hasCheckmark: true,
    subtitle: 'Earned: $5',
    gradient: ['#8B5CF6', '#00B4D8', '#C084FC'] as const,
    navigateTo: 'Groups',
  },
  {
    id: '3',
    title: 'Early Bird Race',
    avatars: [
      { initial: 'D', color: '#FF6B6B' },
      { initial: 'R', color: '#00E676' },
      { initial: 'Y', color: '#FFD700' },
    ],
    subtitle: 'Currently Leading: You!',
    gradient: ['#6C3CE1', '#00B4D8', '#EC4899'] as const,
    navigateTo: 'Friends',
  },
];

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

  const renderPodiumItem = (
    user: typeof LEADERBOARD_DATA[0],
    cupHeight: number,
    isFirst: boolean,
  ) => (
    <View style={styles.podiumItem} key={user.id}>
      {isFirst && <Text style={styles.crownEmoji}>{'\u{1F451}'}</Text>}
      {!isFirst && <View style={{ height: 28 }} />}
      <View style={[styles.avatar, { borderColor: user.color }]}>
        <Text style={styles.avatarInitial}>{user.initial}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{user.name}</Text>
      <Text style={[styles.podiumPoints, { color: user.color }]}>
        {user.points.toLocaleString()} pts
      </Text>
      <View style={[styles.trophyCup, { height: cupHeight, borderColor: user.color }]}>
        <LinearGradient
          colors={[`${user.color}30`, `${user.color}10`]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.trophyRank, { color: user.color }]}>#{user.rank}</Text>
      </View>
    </View>
  );

  const renderPodium = () => {
    const second = LEADERBOARD_DATA.find((u) => u.rank === 2)!;
    const first = LEADERBOARD_DATA.find((u) => u.rank === 1)!;
    const third = LEADERBOARD_DATA.find((u) => u.rank === 3)!;

    return (
      <View style={styles.podiumContainer}>
        {renderPodiumItem(second, 90, false)}
        {renderPodiumItem(first, 120, true)}
        {renderPodiumItem(third, 70, false)}
      </View>
    );
  };

  const renderMiniAvatar = (
    avatar: { initial: string; color: string },
    index: number,
  ) => (
    <View
      key={index}
      style={[
        styles.miniAvatar,
        { backgroundColor: avatar.color, marginLeft: index > 0 ? -8 : 0 },
      ]}
    >
      <Text style={styles.miniAvatarText}>{avatar.initial}</Text>
    </View>
  );

  const renderChallengeCard = (challenge: typeof CHALLENGES_DATA[0]) => (
    <TouchableOpacity
      key={challenge.id}
      activeOpacity={0.8}
      onPress={() => navigation.navigate(challenge.navigateTo)}
      style={styles.challengeCardWrapper}
    >
      <LinearGradient
        colors={challenge.gradient as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.challengeGradient}
      >
        <View style={styles.challengeGlassOverlay}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <View style={styles.challengeRow}>
            <View style={styles.miniAvatarRow}>
              {challenge.avatars.map(renderMiniAvatar)}
            </View>
            {challenge.progress !== undefined && (
              <View style={styles.progressBarOuter}>
                <View
                  style={[
                    styles.progressBarInner,
                    { width: `${challenge.progress * 100}%` },
                  ]}
                />
              </View>
            )}
            {challenge.hasCheckmark && (
              <Icon name="checkmark-circle" size={20} color={colors.accent} />
            )}
          </View>
          <Text style={styles.challengeSubtitle}>{challenge.subtitle}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Social</Text>

        <Text style={styles.sectionTitle}>Global Leaderboard</Text>
        <GlassCard style={styles.leaderboardCard}>
          {renderPodium()}
        </GlassCard>

        <Text style={styles.sectionTitle}>Challenges</Text>
        {CHALLENGES_DATA.map(renderChallengeCard)}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 100,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  leaderboardCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  crownEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarInitial: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  podiumName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginBottom: 8,
  },
  trophyCup: {
    width: '100%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyRank: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  challengeCardWrapper: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  challengeGradient: {
    borderRadius: borderRadius.lg,
  },
  challengeGlassOverlay: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  challengeTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  miniAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  miniAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  progressBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  challengeSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
});

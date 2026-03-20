import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';

const GLASS_BG = 'rgba(108, 60, 225, 0.08)';
const GLASS_BORDER = 'rgba(108, 60, 225, 0.2)';

export function ReferralScreen() {
  const user = useAuthStore((s) => s.user);
  const [referralCount, setReferralCount] = useState(0);

  const shareUrl = `https://snoozestake.com/r/${user?.referralCode}`;

  const copyCode = async () => {
    if (user?.referralCode) {
      await Clipboard.setStringAsync(user.referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  };

  const shareInvite = async () => {
    try {
      await Share.share({
        message: `Join me on SnoozeStake — the alarm app that makes you pay to snooze! Use my code ${user?.referralCode} to get $1 free. ${shareUrl}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Refer a Friend</Text>

        {/* Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeValue} numberOfLines={1} adjustsFontSizeToFit>{user?.referralCode}</Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={copyCode}>
            <Icon name="copy-outline" size={18} color={colors.text} />
            <Text style={styles.copyText}>Copy Code</Text>
          </TouchableOpacity>
        </View>

        {/* Reward Info */}
        <View style={styles.glassCard}>
          <View style={styles.rewardHeader}>
            <View style={styles.rewardIconBubble}>
              <Icon name="gift-outline" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardTitle}>Earn $1 for Every Friend</Text>
              <Text style={styles.rewardDesc}>
                When someone signs up with your code, you both get $1 added to your
                snooze wallet!
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referralCount}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              ${referralCount.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButtonWrap} onPress={shareInvite} activeOpacity={0.8}>
          <LinearGradient
            colors={['#6C3CE1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareButton}
          >
            <Icon name="share-social-outline" size={22} color={colors.text} />
            <Text style={styles.shareText}>Share Invite Link</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Share URL */}
        <TouchableOpacity onPress={copyCode}>
          <Text style={styles.urlText}>{shareUrl}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050510',
  },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: 60 },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  codeCard: {
    backgroundColor: GLASS_BG,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    marginBottom: spacing.lg,
  },
  codeLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  codeRow: {
    backgroundColor: 'rgba(108, 60, 225, 0.15)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(108, 60, 225, 0.3)',
    marginBottom: spacing.md,
  },
  codeValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 4,
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
  },
  copyText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  glassCard: {
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  rewardIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.accent },
  rewardDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  shareButtonWrap: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#6C3CE1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md + 2,
    borderRadius: borderRadius.lg,
  },
  shareText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  urlText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

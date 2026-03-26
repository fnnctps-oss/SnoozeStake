import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAuthStore } from '../store/authStore';

export function ReferralScreen() {
  const user = useAuthStore((s) => s.user);
  // Bug fix: read referral count from user object instead of stale local state that never updated
  const referralCount = user?.referralCount ?? 0;
  // Each successful referral earns $1 (one per friend)
  const earnedAmount = (referralCount * 1).toFixed(2);

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
    <View style={styles.container}>
      {/* Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.codeValue} numberOfLines={1} adjustsFontSizeToFit>{user?.referralCode}</Text>
        <TouchableOpacity style={styles.copyButton} onPress={copyCode}>
          <Text style={styles.copyText}>Copy Code</Text>
        </TouchableOpacity>
      </View>

      {/* Reward Info */}
      <View style={styles.rewardCard}>
        <Text style={styles.rewardTitle}>Earn $1 for Every Friend</Text>
        <Text style={styles.rewardDesc}>
          When someone signs up with your code, you both get $1 added to your
          snooze wallet!
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{referralCount}</Text>
          <Text style={styles.statLabel}>Friends Invited</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.accent }]}>
            ${earnedAmount}
          </Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={shareInvite}>
        <Text style={styles.shareText}>Share Invite Link</Text>
      </TouchableOpacity>

      {/* Share URL */}
      <TouchableOpacity onPress={copyCode}>
        <Text style={styles.urlText}>{shareUrl}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  codeCard: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    marginBottom: spacing.lg,
  },
  codeLabel: { fontSize: fontSize.sm, color: colors.primaryLight, fontWeight: '600' },
  codeValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 4,
    marginVertical: spacing.md,
  },
  copyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  copyText: { color: colors.text, fontWeight: '700' },
  rewardCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  rewardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.accent },
  rewardDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shareText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  urlText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { Icon, IconBubble } from '../components/Icon';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <GradientBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.level}>Beginner</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statItem}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{user?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </GlassCard>
          <GlassCard style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
              ${Number(user?.totalSnoozed || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Snoozed</Text>
          </GlassCard>
          <GlassCard style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.accent }]} numberOfLines={1} adjustsFontSizeToFit>
              ${Number(user?.totalSaved || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Saved</Text>
          </GlassCard>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
            <GlassCard style={styles.menuItem}>
              <IconBubble name="wallet-outline" size={20} color={colors.accent} bgColor="rgba(0, 230, 118, 0.13)" />
              <Text style={styles.menuText}>Wallet</Text>
              <Text style={styles.menuValue}>
                ${Number(user?.walletBalance || 0).toFixed(2)}
              </Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
            <GlassCard style={styles.menuItem}>
              <IconBubble name="trophy-outline" size={20} color={colors.warning} bgColor="rgba(255, 176, 32, 0.13)" />
              <Text style={styles.menuText}>Achievements</Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Referral')}>
            <GlassCard style={styles.menuItem}>
              <IconBubble name="git-network-outline" size={20} color={colors.primaryLight} bgColor="rgba(108, 60, 225, 0.13)" />
              <Text style={styles.menuText}>Referral Code</Text>
              <Text style={styles.menuValue} numberOfLines={1}>{user?.referralCode}</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ShareCard')}>
            <GlassCard style={styles.menuItem}>
              <IconBubble name="share-social-outline" size={20} color="#FF9F43" bgColor="rgba(255, 159, 67, 0.13)" />
              <Text style={styles.menuText}>Share Card</Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <GlassCard style={styles.menuItem}>
              <IconBubble name="settings-outline" size={20} color={colors.textSecondary} bgColor={colors.surfaceLight} />
              <Text style={styles.menuText}>Settings</Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </GlassCard>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40, paddingTop: spacing.lg },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  level: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
    fontWeight: '600',
    marginTop: spacing.xs,
    backgroundColor: 'rgba(108, 60, 225, 0.19)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  menu: {
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  menuValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
});

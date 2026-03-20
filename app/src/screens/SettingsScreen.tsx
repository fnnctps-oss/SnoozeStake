import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';

const GLASS_BG = 'rgba(108, 60, 225, 0.08)';
const GLASS_BORDER = 'rgba(108, 60, 225, 0.2)';

export function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [morningReport, setMorningReport] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [battleAlerts, setBattleAlerts] = useState(true);
  const [groupAlerts, setGroupAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Call API to delete, then logout
            logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.glassCard}>
          <SettingToggle
            iconName="sunny-outline"
            iconBg="rgba(255, 217, 61, 0.15)"
            iconColor="#FFD93D"
            label="Morning Report"
            description="Daily summary at noon"
            value={morningReport}
            onToggle={setMorningReport}
          />
          <View style={styles.divider} />
          <SettingToggle
            iconName="calendar-outline"
            iconBg="rgba(52, 152, 219, 0.15)"
            iconColor="#3498DB"
            label="Weekly Report"
            description="Sunday evening summary"
            value={weeklyReport}
            onToggle={setWeeklyReport}
          />
          <View style={styles.divider} />
          <SettingToggle
            iconName="flash-outline"
            iconBg="rgba(255, 107, 53, 0.15)"
            iconColor="#FF6B35"
            label="Battle Updates"
            description="Challenge and result notifications"
            value={battleAlerts}
            onToggle={setBattleAlerts}
          />
          <View style={styles.divider} />
          <SettingToggle
            iconName="people-outline"
            iconBg="rgba(108, 60, 225, 0.15)"
            iconColor="#8B5CF6"
            label="Group Alerts"
            description="When group members snooze"
            value={groupAlerts}
            onToggle={setGroupAlerts}
          />
        </View>

        {/* Appearance */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.glassCard}>
          <SettingToggle
            iconName="moon-outline"
            iconBg="rgba(139, 92, 246, 0.15)"
            iconColor="#8B5CF6"
            label="Dark Mode"
            description="Use dark theme"
            value={darkMode}
            onToggle={setDarkMode}
          />
        </View>

        {/* Account Info */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.glassCard}>
          <View style={styles.infoRow}>
            <View style={[styles.iconBubble, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Icon name="mail-outline" size={18} color="#00E676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={[styles.iconBubble, { backgroundColor: 'rgba(52, 152, 219, 0.15)' }]}>
              <Icon name="globe-outline" size={18} color="#3498DB" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Timezone</Text>
              <Text style={styles.infoValue}>{user?.timezone}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={[styles.iconBubble, { backgroundColor: 'rgba(108, 60, 225, 0.15)' }]}>
              <Icon name="gift-outline" size={18} color="#8B5CF6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Referral Code</Text>
              <Text style={styles.infoValue}>{user?.referralCode}</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
          <Icon name="trash-outline" size={20} color={colors.danger} />
          <Text style={styles.dangerText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SnoozeStake v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingToggle({
  iconName,
  iconBg,
  iconColor,
  label,
  description,
  value,
  onToggle,
}: {
  iconName: string;
  iconBg: string;
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primary + '80' }}
        thumbColor={value ? colors.primaryLight : colors.textMuted}
      />
    </View>
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
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  glassCard: {
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: GLASS_BORDER,
    marginHorizontal: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  toggleDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  infoValue: { fontSize: fontSize.md, color: colors.text, fontWeight: '600', marginTop: 2 },
  dangerButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dangerText: { color: colors.danger, fontWeight: '700', fontSize: fontSize.md },
  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xl,
  },
});
